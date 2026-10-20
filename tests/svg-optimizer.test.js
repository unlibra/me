// Unit tests for the SVG optimizer logic (E6).
//
// tests/fixtures/svg-optimizer/expected.json holds the output of the former
// tool site's optimizer (its own source with svgo 4.0.0, the version in its
// lock file) for each fixture and option set. The ported code must produce
// the same output.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildSvgoConfig,
  optimizeSvg,
} from "../src/tools/svg-optimizer/svgo.ts";
import {
  DEFAULT_SVGO_OPTIONS,
  PRESET_MAXIMUM,
  PRESET_SAFE,
  PRESET_SVGO_DEFAULT,
  PRESETS,
} from "../src/tools/svg-optimizer/svgo-presets.ts";

const fixtures = join(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures/svg-optimizer",
);
const expected = JSON.parse(
  readFileSync(join(fixtures, "expected.json"), "utf8"),
);

/** The option sets the expected outputs were made with. */
const cases = {
  safe: PRESET_SAFE,
  "svgo-default": PRESET_SVGO_DEFAULT,
  maximum: PRESET_MAXIMUM,
  custom: {
    ...PRESET_SAFE,
    keepScripts: true,
    keepStyleElement: true,
    floatPrecision: 0,
    transformPrecision: 1,
    sortAttrs: true,
    removeTitle: true,
    convertColors: false,
    mergePaths: false,
  },
};

test("E6: optimized SVGs match the former tool's output", async () => {
  assert.deepEqual(Object.keys(expected).sort(), ["editor.svg", "icon.svg"]);
  for (const [file, outputs] of Object.entries(expected)) {
    const svg = readFileSync(join(fixtures, file), "utf8");
    assert.deepEqual(Object.keys(outputs).sort(), Object.keys(cases).sort());
    for (const [name, options] of Object.entries(cases)) {
      assert.equal(
        await optimizeSvg(svg, options),
        outputs[name],
        `${file} ${name}`,
      );
    }
  }
});

test("E6: the presets and default options are the former tool's", () => {
  assert.equal(DEFAULT_SVGO_OPTIONS, PRESET_SAFE);
  assert.deepEqual(
    PRESETS.map((p) => p.id),
    ["safe", "svgo-default", "maximum"],
  );
  assert.deepEqual(
    [PRESET_SAFE, PRESET_SVGO_DEFAULT, PRESET_MAXIMUM].map((p) => [
      p.floatPrecision,
      p.transformPrecision,
    ]),
    [
      [3, 5],
      [3, 5],
      [1, 3],
    ],
  );
});

test("E6: the SVGO config passes precision to preset-default and multipass is on", () => {
  const config = buildSvgoConfig({
    ...PRESET_SAFE,
    floatPrecision: 2,
    transformPrecision: 4,
  });
  assert.equal(config.multipass, true);
  const [preset] = config.plugins;
  assert.equal(preset.name, "preset-default");
  assert.deepEqual(preset.params.overrides.cleanupNumericValues, {
    floatPrecision: 2,
  });
  assert.deepEqual(preset.params.overrides.convertTransform, {
    floatPrecision: 4,
  });
});

test("E6: an unparsable SVG is reported as an optimization failure", async () => {
  // Muted: the optimizer logs the parser error before rethrowing.
  const original = console.error;
  console.error = () => {};
  try {
    await assert.rejects(optimizeSvg("<svg><g></svg>", PRESET_SAFE), {
      message: "SVGの最適化に失敗しました",
    });
  } finally {
    console.error = original;
  }
});
