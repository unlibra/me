// Unit tests for the favicon generator logic (E6).
//
// Node has no <canvas>, so the drawing is checked with a fake canvas
// (tests/helpers/fake-canvas.js) that records the drawing calls.
// tests/fixtures/favicon-generator/expected.json holds the output of the
// former tool site's favicon generator source run with the same fake canvas
// and cases; the ported code must produce the same bytes. Real rendering is
// checked by hand in the browser (E7).
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";

import { installFakeCanvas, runCases } from "./helpers/fake-canvas.js";
import {
  AVAILABLE_SIZES,
  generateOutputSet,
} from "../src/tools/favicon-generator/favicon.ts";
import {
  DEFAULT_OUTPUT_SETS,
  DEFAULT_SIZES,
  OUTPUT_SETS,
} from "../src/tools/favicon-generator/favicon-presets.ts";
import { processImage } from "../src/tools/lib/image.ts";
import { createZip } from "../src/tools/lib/zip.ts";

const expected = JSON.parse(
  readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      "fixtures/favicon-generator/expected.json",
    ),
    "utf8",
  ),
);

let restore;
before(() => {
  restore = installFakeCanvas();
});
after(() => restore());

test("E6: generated files match the former tool's output", async () => {
  const actual = await runCases({
    generateOutputSet,
    processImage,
    OUTPUT_SETS,
  });
  assert.equal(Object.keys(actual).length, 41);
  assert.deepEqual(actual, expected);
});

test("E6: the output sets, sizes and defaults are the former tool's", () => {
  assert.deepEqual(AVAILABLE_SIZES, [16, 24, 32, 48, 64, 128, 256]);
  assert.deepEqual(DEFAULT_SIZES, [16, 32]);
  assert.deepEqual(DEFAULT_OUTPUT_SETS, ["favicon"]);
  assert.deepEqual(
    OUTPUT_SETS.map((set) => [set.id, set.label, set.files]),
    [
      ["favicon", "favicon.ico", [{ name: "favicon.ico", size: "custom" }]],
      [
        "apple-touch-icon",
        "Apple Touch Icon",
        [{ name: "apple-touch-icon.png", size: 180 }],
      ],
      [
        "android-icon",
        "Android Icon",
        [
          { name: "icon-192.png", size: 192 },
          { name: "icon-512.png", size: 512 },
        ],
      ],
    ],
  );
});

test("E6: favicon.ico is an ICO directory of one PNG per selected size", async () => {
  const sizes = [16, 32, 256];
  const [file] = await generateOutputSet(
    { width: 64, height: 64 },
    [{ name: "favicon.ico", size: "custom" }],
    { sizes },
  );
  assert.equal(file.name, "favicon.ico");
  assert.equal(file.blob.type, "image/x-icon");

  const ico = Buffer.from(await file.blob.arrayBuffer());
  assert.equal(ico.readUInt16LE(0), 0); // reserved
  assert.equal(ico.readUInt16LE(2), 1); // type: icon
  assert.equal(ico.readUInt16LE(4), sizes.length);
  let end = 6 + 16 * sizes.length;
  sizes.forEach((size, i) => {
    const entry = 6 + 16 * i;
    assert.equal(ico.readUInt8(entry), size === 256 ? 0 : size);
    assert.equal(ico.readUInt8(entry + 1), size === 256 ? 0 : size);
    assert.equal(ico.readUInt16LE(entry + 4), 1); // color planes
    assert.equal(ico.readUInt16LE(entry + 6), 32); // bits per pixel
    const length = ico.readUInt32LE(entry + 8);
    const offset = ico.readUInt32LE(entry + 12);
    assert.equal(offset, end);
    end += length;
    // The fake canvas's "PNG" records the canvas size.
    const image = JSON.parse(ico.subarray(offset, offset + length).toString());
    assert.equal(image.width, size);
    assert.equal(image.height, size);
  });
  assert.equal(end, ico.length);
});

test("E6: apple-touch-icon always has a background and no rounded corners", async () => {
  const [file] = await generateOutputSet(
    { width: 64, height: 64 },
    [{ name: "apple-touch-icon.png", size: 180 }],
    { borderRadiusPercent: 50 },
  );
  const { ops } = JSON.parse(await file.blob.text());
  assert.ok(
    ops.some(
      (op) => op[0] === "set" && op[1] === "fillStyle" && op[2] === "#ffffff",
    ),
  );
  assert.ok(!ops.some((op) => op[0] === "clip"));
});

test("E6: several files are put into one ZIP with their names", async () => {
  const files = await generateOutputSet(
    { width: 64, height: 64 },
    OUTPUT_SETS.find((set) => set.id === "android-icon").files,
  );
  const zip = await JSZip.loadAsync(
    await (await createZip(files)).arrayBuffer(),
  );
  assert.deepEqual(Object.keys(zip.files).sort(), [
    "icon-192.png",
    "icon-512.png",
  ]);
  for (const { name, blob } of files) {
    assert.equal(await zip.file(name).async("string"), await blob.text());
  }
});
