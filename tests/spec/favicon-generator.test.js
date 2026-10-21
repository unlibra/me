// Spec tests of the favicon generator's options (I1).
//
// tests/favicon-generator.test.js checks the port against stored outputs;
// these check what each option should do to the output files. The fake canvas
// (tests/helpers/fake-canvas.js) turns each "PNG" into a record of the canvas
// size and the drawing calls, so the tests read sizes and shapes from it.
// Choosing between one file and a ZIP happens in the component and is checked
// by the E2E tests.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";

import { installFakeCanvas } from "../helpers/fake-canvas.js";
import {
  AVAILABLE_SIZES,
  generateOutputSet,
} from "../../src/tools/favicon-generator/favicon.ts";
import {
  DEFAULT_SIZES,
  OUTPUT_SETS,
} from "../../src/tools/favicon-generator/favicon-presets.ts";

let restore;
before(() => {
  restore = installFakeCanvas();
});
after(() => restore());

const SQUARE = { width: 600, height: 600 };

/** The images inside an ICO file, as fake canvas records. */
const readIco = async (blob) => {
  const ico = Buffer.from(await blob.arrayBuffer());
  const count = ico.readUInt16LE(4);
  return Array.from({ length: count }, (_, i) => {
    const entry = 6 + 16 * i;
    const length = ico.readUInt32LE(entry + 8);
    const offset = ico.readUInt32LE(entry + 12);
    const image = JSON.parse(ico.subarray(offset, offset + length).toString());
    const size = ico.readUInt8(entry) || 256;
    assert.equal(ico.readUInt8(entry + 1) || 256, size);
    assert.equal(image.width, size);
    assert.equal(image.height, size);
    return image;
  });
};

const readPng = async (blob) => {
  assert.equal(blob.type, "image/png");
  return JSON.parse(await blob.text());
};

/** Generates the files of the selected output sets, as the tool does. */
const generate = async (setIds, options, image = SQUARE) => {
  const files = [];
  for (const id of setIds) {
    const set = OUTPUT_SETS.find((s) => s.id === id);
    files.push(...(await generateOutputSet(image, set.files, options)));
  }
  return files;
};

/** Every image of the generated files, with the file it is in. */
const images = async (files) => {
  const result = [];
  for (const { name, blob } of files) {
    if (name === "favicon.ico") {
      for (const image of await readIco(blob)) result.push({ name, image });
    } else {
      result.push({ name, image: await readPng(blob) });
    }
  }
  return result;
};

const subsets = (items) =>
  Array.from({ length: 2 ** items.length - 1 }, (_, mask) =>
    items.filter((_, i) => (mask + 1) & (1 << i)),
  );

const FILES_OF_SET = {
  favicon: [["favicon.ico", "image/x-icon"]],
  "apple-touch-icon": [["apple-touch-icon.png", "image/png"]],
  "android-icon": [
    ["icon-192.png", "image/png"],
    ["icon-512.png", "image/png"],
  ],
};

test("I1 favicon: each combination of output formats gives the files of those formats", async () => {
  const ids = OUTPUT_SETS.map((set) => set.id);
  assert.deepEqual(ids, Object.keys(FILES_OF_SET));
  for (const selected of subsets(ids)) {
    const files = await generate(selected, {});
    assert.deepEqual(
      files.map(({ name, blob }) => [name, blob.type]),
      selected.flatMap((id) => FILES_OF_SET[id]),
      selected.join(","),
    );
  }
});

test("I1 favicon: the PNG files have their fixed sizes", async () => {
  const files = await generate(["apple-touch-icon", "android-icon"], {});
  const sizes = [];
  for (const { name, blob } of files) {
    const { width, height } = await readPng(blob);
    sizes.push([name, width, height]);
  }
  assert.deepEqual(sizes, [
    ["apple-touch-icon.png", 180, 180],
    ["icon-192.png", 192, 192],
    ["icon-512.png", 512, 512],
  ]);
});

test("I1 favicon: favicon.ico holds one image for each selected size", async () => {
  for (const sizes of subsets(AVAILABLE_SIZES)) {
    const [file] = await generate(["favicon"], { sizes });
    const ico = await readIco(file.blob);
    assert.deepEqual(
      ico.map((image) => image.width),
      sizes,
      sizes.join(","),
    );
  }
});

test("I1 favicon: favicon.ico defaults to 16 and 32 pixels", async () => {
  assert.deepEqual(DEFAULT_SIZES, [16, 32]);
  const [file] = await generate(["favicon"], {});
  assert.deepEqual(
    (await readIco(file.blob)).map((image) => image.width),
    [16, 32],
  );
});

test("I1 favicon: the sizes only change favicon.ico", async () => {
  const files = await generate(["apple-touch-icon", "android-icon"], {
    sizes: [24],
  });
  assert.deepEqual(
    (await images(files)).map(({ image }) => image.width),
    [180, 192, 512],
  );
});

const ops = (image, name) => image.ops.filter((op) => op[0] === name);

/** The clip path of an image: null, a circle radius or a corner radius. */
const clipShape = (image) => {
  if (ops(image, "clip").length === 0) return null;
  const [arc] = ops(image, "arc");
  if (arc) return { circle: arc[3] };
  const [moveTo] = ops(image, "moveTo");
  return { corner: moveTo[1] };
};

test("I1 favicon: the corner radius rounds every image but apple-touch-icon", async () => {
  const all = ["favicon", "apple-touch-icon", "android-icon"];
  const sizes = [16, 32, 48, 256];
  for (const percent of [0, 1, 25, 50, 99, 100]) {
    const shapes = (
      await images(await generate(all, { sizes, borderRadiusPercent: percent }))
    ).map(({ name, image }) => [name, image.width, clipShape(image)]);
    const expected = [
      ...sizes.map((size) => ["favicon.ico", size]),
      ["apple-touch-icon.png", 180],
      ["icon-192.png", 192],
      ["icon-512.png", 512],
    ].map(([name, size]) => {
      if (name === "apple-touch-icon.png" || percent === 0) {
        return [name, size, null];
      }
      if (percent === 100) return [name, size, { circle: size / 2 }];
      return [name, size, { corner: (size / 2) * (percent / 100) }];
    });
    assert.deepEqual(shapes, expected, `${percent}%`);
  }
});

/** The background fill of an image, or null. */
const background = (image) => {
  const fills = ops(image, "fillRect");
  if (fills.length === 0) return null;
  assert.deepEqual(fills, [["fillRect", 0, 0, image.width, image.height]]);
  // The last fillStyle set before the fill, and the fill before the image.
  const index = image.ops.findIndex((op) => op[0] === "fillRect");
  const style = image.ops
    .slice(0, index)
    .findLast((op) => op[0] === "set" && op[1] === "fillStyle");
  assert.ok(
    index < image.ops.findIndex((op) => op[0] === "drawImage"),
    "background under the image",
  );
  return style[2];
};

test("I1 favicon: the background color fills every image; apple-touch-icon is white without one", async () => {
  const all = ["favicon", "apple-touch-icon", "android-icon"];
  for (const color of [undefined, "#123456"]) {
    for (const percent of [0, 50, 100]) {
      const fills = (
        await images(
          await generate(all, {
            backgroundColor: color,
            borderRadiusPercent: percent,
          }),
        )
      ).map(({ name, image }) => [name, background(image)]);
      assert.deepEqual(
        fills,
        [
          ["favicon.ico", color ?? null],
          ["favicon.ico", color ?? null],
          ["apple-touch-icon.png", color ?? "#ffffff"],
          ["icon-192.png", color ?? null],
          ["icon-512.png", color ?? null],
        ],
        `${color} ${percent}%`,
      );
    }
  }
});

test("I1 favicon: a rounded image's background is inside the rounded shape", async () => {
  const [file] = await generate(["android-icon"], {
    backgroundColor: "#123456",
    borderRadiusPercent: 50,
  });
  const image = await readPng(file.blob);
  const names = image.ops.map((op) => op[0]);
  assert.ok(names.indexOf("clip") < names.indexOf("fillRect"));
});

test("I1 favicon: a non-square image is cropped to its center square", async () => {
  for (const [source, crop] of [
    [{ width: 300, height: 200 }, [50, 0, 200, 200]],
    [{ width: 120, height: 400 }, [0, 140, 120, 120]],
    [{ width: 64, height: 64 }, [0, 0, 64, 64]],
  ]) {
    const [file] = await generate(["android-icon"], {}, source);
    const image = await readPng(file.blob);
    assert.deepEqual(ops(image, "drawImage"), [
      [
        "drawImage",
        { image: [source.width, source.height] },
        ...crop,
        0,
        0,
        192,
        192,
      ],
    ]);
  }
});
