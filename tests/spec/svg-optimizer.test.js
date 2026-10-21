// Spec tests of the SVG optimizer's options (I1).
//
// tests/svg-optimizer.test.js checks the port against stored outputs; these
// check what each option should do. For every switch there is a small SVG that
// only that switch changes: with every switch on (the "maximum" preset) the
// change is made, and with only that switch off it is not.
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildSvgoConfig,
  optimizeSvg,
} from "../../src/tools/svg-optimizer/svgo.ts";
import { PLUGIN_GROUPS } from "../../src/tools/svg-optimizer/svgo-options.ts";
import {
  DEFAULT_SVGO_OPTIONS,
  PRESET_MAXIMUM,
  PRESET_SAFE,
  PRESET_SVGO_DEFAULT,
  PRESETS,
} from "../../src/tools/svg-optimizer/svgo-presets.ts";

const svg = (body, attrs = 'viewBox="0 0 100 100"') =>
  `<svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${body}</svg>`;

const XLINK =
  'xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100"';

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

/**
 * One case per switch. `input` is an SVG that the switch changes, `changed`
 * tells whether the output shows that change. `base` overrides other switches
 * that would make the same change (or hide it).
 */
const SWITCH_CASES = {
  removeDoctype: {
    input:
      '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' +
      svg('<path d="M0 0h10v10z"/>'),
    changed: (out) => !out.includes("<!DOCTYPE"),
  },
  removeComments: {
    input: svg('<!-- a note --><path d="M0 0h10v10z"/>'),
    changed: (out) => !out.includes("<!--"),
  },
  removeMetadata: {
    input: svg('<metadata>about</metadata><path d="M0 0h10v10z"/>'),
    changed: (out) => !out.includes("<metadata"),
  },
  removeTitle: {
    input: svg('<title>A title</title><path d="M0 0h10v10z"/>'),
    changed: (out) => !out.includes("<title"),
  },
  removeDesc: {
    // Only a description an editor wrote: whether removeDesc should remove
    // other descriptions is still being decided (fixes.md FX-1).
    input: svg('<desc>Created with an editor</desc><path d="M0 0h10v10z"/>'),
    changed: (out) => !out.includes("<desc"),
  },
  removeUselessDefs: {
    input: svg(
      '<defs><path d="M0 0h1v1z"/></defs><path d="M0 0h10v10z" fill="red"/>',
    ),
    changed: (out) => !out.includes("M0 0h1v1z"),
  },
  removeEditorsNSData: {
    input: svg(
      '<sodipodi:namedview id="base"/><path d="M0 0h10v10z"/>',
      'xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" viewBox="0 0 100 100"',
    ),
    changed: (out) => !out.includes("sodipodi"),
  },
  removeEmptyAttrs: {
    input: svg('<path d="M0 0h10v10z" class=""/>'),
    changed: (out) => !out.includes('class=""'),
  },
  removeHiddenElems: {
    input: svg(
      '<path d="M0 0h10v10z"/><path d="M50 50h10v10z" display="none"/>',
    ),
    base: { mergePaths: false },
    changed: (out) => !out.includes("display"),
  },
  removeEmptyText: {
    input: svg('<text x="1" y="1"/><path d="M0 0h10v10z"/>'),
    changed: (out) => !out.includes("<text"),
  },
  removeEmptyContainers: {
    input: svg('<g fill="red"/><path d="M0 0h10v10z"/>'),
    changed: (out) => !out.includes("<g"),
  },
  removeViewBox: {
    input: svg(
      '<path d="M0 0h10v10z"/>',
      'width="100" height="100" viewBox="0 0 100 100"',
    ),
    // removeDimensions keeps the viewBox and removes width and height instead.
    base: { removeDimensions: false },
    changed: (out) => !out.includes("viewBox"),
  },
  cleanupEnableBackground: {
    input: svg(
      '<path d="M0 0h10v10z"/>',
      'width="100" height="100" viewBox="0 0 100 100" enable-background="new 0 0 100 100"',
    ),
    base: { removeDimensions: false },
    changed: (out) => !out.includes("enable-background"),
  },
  minifyStyles: {
    // A media query stays in <style> (preset-default's inlineStyles cannot
    // move it to attributes), so the <style> is kept to see it. inlineStyles
    // also strips the spaces, so the change looked at is merging the rules.
    input: svg(
      '<style>@media (min-width:1px){.a{fill:#ff0000}.a{stroke:blue}}</style><path class="a" d="M0 0h10v10z"/>',
    ),
    base: { keepStyleElement: true },
    changed: (out) => out.includes("{.a{fill:red;stroke:#00f}}"),
  },
  convertStyleToAttrs: {
    input: svg('<path d="M0 0h10v10z" style="fill:red"/>'),
    changed: (out) => !out.includes("style="),
  },
  convertColors: {
    input: svg('<path d="M0 0h10v10z" fill="#ff0000"/>'),
    changed: (out) => !out.includes("#ff0000"),
  },
  convertPathData: {
    input: svg('<path d="M 0 0 L 10 0 L 10 10 Z"/>'),
    changed: (out) => /d="M0 0h10v10z"/i.test(out),
  },
  convertTransform: {
    input: svg('<text transform="matrix(1 0 0 1 10 20)">a</text>'),
    changed: (out) => out.includes('transform="translate(10 20)"'),
  },
  removeUnknownsAndDefaults: {
    input: svg('<path d="M0 0h10v10z" fill-rule="nonzero"/>'),
    changed: (out) => !out.includes("fill-rule"),
  },
  removeNonInheritableGroupAttrs: {
    input: svg('<g stop-color="red"><text>a</text><text>b</text></g>'),
    changed: (out) => !out.includes("stop-color"),
  },
  removeUselessStrokeAndFill: {
    input: svg('<path d="M0 0h10v10z" stroke="#00f" stroke-width="0"/>'),
    changed: (out) => !out.includes("stroke"),
  },
  removeUnusedNS: {
    input: svg(
      '<path d="M0 0h10v10z"/>',
      'xmlns:foo="http://example.com/foo" viewBox="0 0 100 100"',
    ),
    changed: (out) => !out.includes("xmlns:foo"),
  },
  cleanupIds: {
    input: svg('<path id="unused" d="M0 0h10v10z"/>'),
    changed: (out) => !out.includes("id="),
  },
  cleanupNumericValues: {
    // Not x or y: cleanupListOfValues rounds those too.
    input: svg('<circle cx="5" cy="5" r="1.123456"/>'),
    changed: (out) => !out.includes("1.123456"),
  },
  cleanupListOfValues: {
    input: svg('<text x="1.123456 2.123456" y="2">ab</text>'),
    changed: (out) => !out.includes("1.123456"),
  },
  moveElemsAttrsToGroup: {
    input: svg('<g><text fill="red">a</text><text fill="red">b</text></g>'),
    changed: (out) => /<g fill="red"><text>a<\/text><text>b/.test(out),
  },
  moveGroupAttrsToElems: {
    input: svg(
      '<g transform="translate(10 20)"><text>a</text><text>b</text></g>',
    ),
    changed: (out) => !/<g[^>]*transform/.test(out),
  },
  collapseGroups: {
    input: svg("<g><g><text>a</text></g></g>"),
    changed: (out) => !out.includes("<g"),
  },
  removeRasterImages: {
    // SVGO's plugin looks at xlink:href only.
    input: svg(`<image width="2" height="2" xlink:href="${PNG}"/>`, XLINK),
    changed: (out) => !out.includes("<image"),
  },
  mergePaths: {
    input: svg('<path d="M0 0h10v10z"/><path d="M50 50h10v10z"/>'),
    changed: (out) => out.match(/<path/g).length === 1,
  },
  convertShapeToPath: {
    input: svg('<rect x="10" y="10" width="20" height="20"/>'),
    changed: (out) => !out.includes("<rect"),
  },
  sortAttrs: {
    input: svg('<path stroke="#00f" d="M0 0h10v10z" fill="#0f0"/>'),
    changed: (out) => out.includes('<path fill="#0f0" stroke="#00f" d='),
  },
  removeDimensions: {
    input: svg(
      '<path d="M0 0h10v10z"/>',
      'width="100" height="100" viewBox="0 0 100 100"',
    ),
    changed: (out) => !/ (width|height)=/.test(out),
  },
};

/** Switches named for what they keep: on means the element is kept. */
const KEEP_CASES = {
  keepScripts: {
    input: svg('<script>alert(1)</script><path d="M0 0h10v10z"/>'),
    kept: (out) => out.includes("<script>alert(1)</script>"),
  },
  keepStyleElement: {
    input: svg(
      '<style>@media (min-width:1px){path{fill:red}}</style><path d="M0 0h10v10z"/>',
    ),
    kept: (out) => out.includes("<style>"),
  },
};

const booleanOptions = Object.keys(PRESET_MAXIMUM).filter(
  (key) => typeof PRESET_MAXIMUM[key] === "boolean",
);

test("I1 svg: every switch has a spec case", () => {
  assert.deepEqual(
    [...Object.keys(SWITCH_CASES), ...Object.keys(KEEP_CASES)].sort(),
    [...booleanOptions].sort(),
  );
});

test("I1 svg: every switch of the options panel is an option", () => {
  const panel = PLUGIN_GROUPS.flatMap((group) => group.plugins);
  assert.deepEqual([...panel].sort(), [...booleanOptions].sort());
});

for (const [option, { input, base = {}, changed }] of Object.entries(
  SWITCH_CASES,
)) {
  test(`I1 svg: ${option} on makes its change, off does not`, async () => {
    const on = await optimizeSvg(input, {
      ...PRESET_MAXIMUM,
      ...base,
      [option]: true,
    });
    assert.ok(changed(on), `on: ${on}`);
    const off = await optimizeSvg(input, {
      ...PRESET_MAXIMUM,
      ...base,
      [option]: false,
    });
    assert.ok(!changed(off), `off: ${off}`);
  });
}

for (const [option, { input, kept }] of Object.entries(KEEP_CASES)) {
  test(`I1 svg: ${option} on keeps the element, off removes it`, async () => {
    const on = await optimizeSvg(input, { ...PRESET_MAXIMUM, [option]: true });
    assert.ok(kept(on), `on: ${on}`);
    const off = await optimizeSvg(input, {
      ...PRESET_MAXIMUM,
      [option]: false,
    });
    assert.ok(!kept(off), `off: ${off}`);
  });
}

// Only the numbers cleanupNumericValues rounds: path data and lists of
// values keep SVGO's own precision whatever the slider says. Whether they
// should follow the slider is not decided (reported to the parent).
test("I1 svg: floatPrecision sets the decimal places of numeric attributes", async () => {
  const input = svg('<circle cx="5" cy="5" r="1.123456"/>');
  for (const [precision, r] of [
    [0, "1"],
    [1, "1.1"],
    [3, "1.123"],
    [5, "1.12346"],
    [10, "1.123456"],
  ]) {
    const out = await optimizeSvg(input, {
      ...PRESET_MAXIMUM,
      floatPrecision: precision,
    });
    assert.ok(out.includes(`r="${r}"`), `${precision}: ${out}`);
  }
});

// Translations: SVGO rounds rotation angles to at most 3 places on its own.
test("I1 svg: transformPrecision sets the decimal places of translations", async () => {
  const input = svg('<text transform="translate(10.123456 20)">a</text>');
  for (const [precision, x] of [
    [0, "10"],
    [1, "10.1"],
    [3, "10.123"],
    [5, "10.12346"],
  ]) {
    const out = await optimizeSvg(input, {
      ...PRESET_MAXIMUM,
      transformPrecision: precision,
    });
    assert.ok(out.includes(`translate(${x} 20)`), `${precision}: ${out}`);
  }
});

test("I1 svg: every switch is turned on and off in the SVGO config", () => {
  // Whether a plugin runs, read from the config: in preset-default's
  // overrides (anything but false runs it) or in the plugin list.
  const runs = (config, plugin) =>
    config.plugins.some((p) => p.name === plugin) ||
    (plugin in config.plugins[0].params.overrides &&
      config.plugins[0].params.overrides[plugin] !== false);
  const pluginOf = (option) =>
    ({ keepScripts: "removeScripts", keepStyleElement: "removeStyleElement" })[
      option
    ] ?? option;
  for (const option of booleanOptions) {
    const plugin = pluginOf(option);
    const inverted = plugin !== option;
    for (const value of [true, false]) {
      const config = buildSvgoConfig({ ...PRESET_MAXIMUM, [option]: value });
      assert.equal(runs(config, plugin), inverted ? !value : value, option);
    }
  }
});

/** One SVG with what the presets treat differently. */
const PRESET_INPUT = svg(
  '<title>T</title><desc>Created with an editor</desc><path stroke="#00f" d="M0 0h10v10z" fill="#0f0"/>' +
    `<image width="2" height="2" xlink:href="${PNG}"/>` +
    '<circle cx="5" cy="5" r="1.123456"/>',
  `width="100" height="100" ${XLINK}`,
);

test("I1 svg: the recommended preset keeps title, desc, size, viewBox and images", async () => {
  assert.equal(DEFAULT_SVGO_OPTIONS, PRESET_SAFE);
  const out = await optimizeSvg(PRESET_INPUT, PRESET_SAFE);
  assert.match(out, /<title>T<\/title>/);
  assert.match(out, /<desc>Created with an editor<\/desc>/);
  assert.match(out, / width="100"/);
  assert.match(out, / viewBox="0 0 100 100"/);
  assert.match(out, /<image /);
  assert.match(out, /stroke="#00f" d="M0 0h10v10z" fill="#0f0"/); // not sorted
  assert.match(out, /r="1.123"/);
});

test("I1 svg: the SVGO default preset removes title, desc and viewBox and keeps size and images", async () => {
  const out = await optimizeSvg(PRESET_INPUT, PRESET_SVGO_DEFAULT);
  assert.doesNotMatch(out, /<title|<desc|viewBox/);
  assert.match(out, / width="100"/);
  assert.match(out, /<image /);
  assert.match(out, /stroke="#00f" d="M0 0h10v10z" fill="#0f0"/);
  assert.match(out, /r="1.123"/);
});

test("I1 svg: the maximum preset removes everything it can and rounds to one digit", async () => {
  const out = await optimizeSvg(PRESET_INPUT, PRESET_MAXIMUM);
  assert.doesNotMatch(out, /<title|<desc|<image| width=| height=/);
  assert.match(out, / viewBox="0 0 100 100"/); // kept in place of the size
  assert.match(out, /fill="#0f0" stroke="#00f" d=/);
  assert.match(out, /r="1.1"/);
});

test("I1 svg: the presets keep scripts and style elements out", () => {
  for (const { id, options } of PRESETS) {
    assert.equal(options.keepScripts, false, id);
    assert.equal(options.keepStyleElement, false, id);
  }
});
