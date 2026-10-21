// Tests for the list of third-party licenses (dist/third-party-licenses.txt)
// written by scripts/third-party-licenses.mjs. Run `npm run build` before
// `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  globSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DERIVED_ASSETS,
  LICENSE_FALLBACKS,
  LICENSE_NOTES,
  LICENSES_FILE,
  OUTSIDE_MODULE_GRAPH,
  PREBUNDLED,
  findDependencyDirs,
  packageOfModule,
  packageOfPath,
  readLicense,
} from "../scripts/third-party-licenses.mjs";
import { nameOf, woff2Tables } from "./helpers/woff2.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

if (!existsSync(join(dist, "index.html"))) {
  throw new Error("dist/ not found. Run `npm run build` before `npm test`.");
}

const list = readFileSync(join(dist, LICENSES_FILE), "utf8");

/** "name version" of each package in the summary at the top of the list. */
const listedPackages = () =>
  [...list.matchAll(/^ {2}- (\S+) (\S+) \(/gm)].map(([, name, version]) => ({
    name,
    version,
  }));

/** The section of the list for one package (and version, if given). */
const sectionOf = (name, version = "") => {
  const sections = list.split(/^={78}$/m).slice(1);
  const found = sections.filter((s) => s.startsWith(`\n${name} ${version}`));
  assert.equal(found.length, 1, `one section for ${name} ${version}`);
  return found[0];
};

const normalize = (text) => text.replace(/\r\n/g, "\n").trim();

test("H4: the list is in dist/ and has the license text of each shipped package", () => {
  for (const name of [
    "react",
    "react-dom",
    "@headlessui/react",
    "@heroicons/react",
    "svgo",
    "jszip",
  ]) {
    const dir = join(root, "node_modules", name);
    const { version } = JSON.parse(
      readFileSync(join(dir, "package.json"), "utf8"),
    );
    const section = sectionOf(name);
    assert.ok(section.startsWith(`\n${name} ${version}\n`), name);
    const [license] = globSync("LICENSE*", { cwd: dir });
    const text = normalize(readFileSync(join(dir, license), "utf8"));
    assert.ok(normalize(section).includes(text), `${name}: full text`);
    assert.match(section, /^Copyright \(c\) .+$/m, `${name}: copyright`);
  }
});

test("H4/H5: the list has exactly the packages the build output ships", () => {
  // From the client JavaScript, the fonts, the packages inside svgo's and
  // JSZip's own bundles, and the code outside the module graph. Update this
  // when the dependencies change, after checking the output.
  assert.deepEqual(
    listedPackages().map((p) => p.name),
    [
      "@astrojs/react",
      "@fontsource-variable/noto-sans-jp",
      "@fontsource/line-seed-jp",
      "@fontsource/roboto-mono",
      "@headlessui/react",
      "@heroicons/react",
      "astro",
      "boolbase",
      "css-select",
      "css-tree",
      "css-tree",
      "css-what",
      "csso",
      "dom-serializer",
      "domelementtype",
      "domhandler",
      "domutils",
      "entities",
      "immediate",
      "jszip",
      "lie",
      "mdn-data",
      "mdn-data",
      "nth-check",
      "pako",
      "react",
      "react-aria",
      "react-dom",
      "react-stately",
      "rolldown",
      "sax",
      "scheduler",
      "setimmediate",
      "source-map-js",
      "svgo",
      "tailwindcss",
      "vite",
    ],
  );
});

test("H4: packages that svgo bundles at two versions are listed at both", () => {
  // css-tree 3 for svgo itself, css-tree 2 under csso (with their mdn-data).
  const listed = listedPackages().map((p) => `${p.name} ${p.version}`);
  for (const entry of [
    "css-tree 2.2.1",
    "css-tree 3.2.1",
    "mdn-data 2.0.28",
    "mdn-data 2.27.1",
  ]) {
    assert.ok(listed.includes(entry), entry);
  }
  assert.match(
    sectionOf("css-tree", "2.2.1"),
    /^Included as: part of svgo 4\.1\.0 /m,
  );
});

test("H4: the bundler's runtime helpers are listed", () => {
  assert.match(sectionOf("vite"), /^Included as: .*vite\/preload-helper/m);
  assert.match(sectionOf("rolldown"), /^Included as: .*rolldown\/runtime/m);
});

test("H4: license expressions are not wrapped in a second pair of parentheses", () => {
  assert.doesNotMatch(list, /\(\(/);
  assert.match(list, /^ {2}- jszip 3\.10\.2 \(MIT OR GPL-3\.0-or-later\)$/m);
  assert.match(list, /^ {2}- react 19\.3\.1 \(MIT\)$/m);
});

test("H5: no build-only package is in the list", () => {
  const names = new Set(listedPackages().map((p) => p.name));
  // Packages that a shipped file is made from (DERIVED_ASSETS) are
  // devDependencies, and are listed.
  const derived = new Set(
    Object.values(DERIVED_ASSETS).map((asset) => asset.name),
  );
  for (const name of [
    // vite and rolldown are listed for their runtime helpers (FX-8); their
    // plugins and other build tools must not be.
    ...Object.keys(pkg.devDependencies).filter((name) => !derived.has(name)),
    "@tailwindcss/vite",
    "@vitejs/plugin-react",
    "@astrojs/sitemap",
    "commander",
    "picocolors",
    "readable-stream",
  ]) {
    assert.equal(names.has(name), false, name);
  }
});

test("H6: a package without a license file stops the build", () => {
  const dir = mkdtempSync(join(tmpdir(), "tpl-"));
  try {
    const pkgDir = join(dir, "node_modules", "no-license");
    mkdirSync(pkgDir, { recursive: true });
    writeFileSync(
      join(pkgDir, "package.json"),
      JSON.stringify({ name: "no-license", version: "1.0.0" }),
    );
    writeFileSync(join(pkgDir, "README.md"), "MIT");
    assert.throws(
      () => readLicense(pkgDir),
      /no-license@1\.0\.0.*no license file/,
    );
    // A fallback text is used when there is one.
    assert.deepEqual(
      readLicense(pkgDir, {
        "no-license@1.0.0": { note: "Made up.", text: "Text\n" },
      }),
      { texts: ["Text"], note: "Made up." },
    );
    // License and notice files are all read.
    writeFileSync(join(pkgDir, "LICENSE.md"), "License\n");
    writeFileSync(join(pkgDir, "NOTICE"), "Notice\n");
    assert.deepEqual(readLicense(pkgDir), {
      texts: ["License", "Notice"],
      note: "",
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("H6: each license fallback is for a shipped package that has no license file", () => {
  const listed = new Set(listedPackages().map((p) => `${p.name}@${p.version}`));
  for (const key of Object.keys(LICENSE_FALLBACKS)) {
    assert.ok(listed.has(key), key);
    const name = key.slice(0, key.lastIndexOf("@"));
    assert.deepEqual(
      globSync("{LICEN[CS]E,licen[cs]e,COPYING,NOTICE}*", {
        cwd: join(root, "node_modules", name),
      }),
      [],
      key,
    );
    const section = sectionOf(name);
    assert.ok(section.includes(LICENSE_FALLBACKS[key].text.trim()), key);
    assert.ok(section.includes(`Note: ${LICENSE_FALLBACKS[key].note}`), key);
  }
});

test("every JavaScript file in dist/ points to the list", () => {
  const files = globSync("_astro/*.js", { cwd: dist });
  assert.ok(files.length > 0);
  const banner = `/*! Third-party licenses: https://unlibra.com/${LICENSES_FILE} */`;
  for (const file of files) {
    // At the top, or right after the dependency map that Vite puts before
    // everything in chunks with dynamic imports.
    const lines = readFileSync(join(dist, file), "utf8").split("\n");
    const index = lines.indexOf(banner);
    assert.ok(
      index === 0 ||
        (index === 1 && lines[0].startsWith("const __vite__mapDeps=")),
      file,
    );
  }
});

test("the reasons for the hand-listed packages still hold", () => {
  // OUTSIDE_MODULE_GRAPH
  assert.deepEqual(Object.keys(OUTSIDE_MODULE_GRAPH).sort(), [
    "astro",
    "tailwindcss",
  ]);
  const html = readFileSync(join(dist, "lab/svg-optimizer/index.html"), "utf8");
  assert.match(html, /customElements\.define\(`astro-island`/);
  const css = globSync("_astro/*.css", { cwd: dist })
    .map((file) => readFileSync(join(dist, file), "utf8"))
    .join("\n");
  // Tailwind's preflight
  assert.match(css, /box-sizing:border-box;border:0 solid;margin:0;padding:0/);

  // PREBUNDLED: the bundles are shipped, at the versions that were checked.
  for (const [name, { version, file }] of Object.entries(PREBUNDLED)) {
    const installed = JSON.parse(
      readFileSync(join(root, "node_modules", name, "package.json"), "utf8"),
    ).version;
    assert.equal(installed, version, name);
    const base = file.split("/").pop().replace(/\.js$/, "");
    assert.equal(
      globSync(`_astro/${base}.*.js`, { cwd: dist }).length,
      1,
      `${name}: ${file} is shipped`,
    );
  }
});

test("packageOfPath finds the package of a module or asset path", () => {
  assert.deepEqual(
    packageOfPath("C:\\p\\node_modules\\react-dom\\cjs\\react-dom.js"),
    {
      name: "react-dom",
      dir: "C:/p/node_modules/react-dom",
      file: "cjs/react-dom.js",
    },
  );
  assert.deepEqual(
    packageOfPath("/p/node_modules/a/node_modules/@scope/b/index.js?v=1"),
    {
      name: "@scope/b",
      dir: "/p/node_modules/a/node_modules/@scope/b",
      file: "index.js",
    },
  );
  assert.equal(
    packageOfPath("\0/p/node_modules/svgo/dist/svgo.browser.js").file,
    "dist/svgo.browser.js",
  );
  assert.equal(packageOfPath("/p/src/tools/svg-optimizer/svgo.ts"), null);
  assert.equal(packageOfPath("\0virtual:astro:page"), null);
});

test("H7: LICENSE section 4 points to the list on the website", () => {
  const license = readFileSync(join(root, "LICENSE"), "utf8");
  const section4 = license.slice(license.indexOf("\n4. Dependencies\n"));
  assert.match(section4, /\/third-party-licenses\.txt/);
  assert.match(section4, /scripts\/third-party-licenses\.mjs/);
});

test("findDependencyDirs finds each name@version, also when nested", () => {
  const svgo = join(root, "node_modules", "svgo");
  const found = findDependencyDirs(svgo, ["css-tree@3.2.1", "css-tree@2.2.1"]);
  assert.equal(found.size, 2);
  assert.match(
    found.get("css-tree@2.2.1").replaceAll("\\", "/"),
    /node_modules\/csso\/node_modules\/css-tree$/,
  );
  assert.throws(
    () => findDependencyDirs(svgo, ["css-tree@9.9.9"]),
    /css-tree@9\.9\.9/,
  );
});

test("packageOfModule maps known virtual modules and stops on unknown ones", () => {
  assert.equal(packageOfModule("\0vite/preload-helper.js", root).name, "vite");
  assert.equal(packageOfModule("\0rolldown/runtime.js", root).name, "rolldown");
  assert.equal(
    packageOfModule(join(root, "node_modules/react/index.js"), root).name,
    "react",
  );
  assert.equal(
    packageOfModule(join(root, "src/tools/svg-optimizer/svgo.ts"), root),
    null,
  );
  assert.throws(
    () => packageOfModule("\0some-plugin/helper.js", root),
    /some-plugin\/helper\.js/,
  );
  assert.throws(
    () => packageOfModule("/elsewhere/helper.js", root),
    /elsewhere/,
  );
});

test("H4: vite shows only its core license, not those of its Node.js bundle", () => {
  const section = sectionOf("vite");
  assert.match(section, /^# Vite core license$/m);
  assert.match(
    section,
    /^Copyright \(c\) .*VoidZero Inc\. and Vite contributors$/m,
  );
  assert.doesNotMatch(section, /Licenses of bundled dependencies/);
  assert.match(section, /^Note: Only the Vite core license is shown\./m);
});

test("a license cut whose marker is missing stops the build", () => {
  const dir = mkdtempSync(join(tmpdir(), "tpl-"));
  try {
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name: "cut-me", version: "1.0.0" }),
    );
    writeFileSync(join(dir, "LICENSE"), "Own\n\n# Others\nOther\n");
    assert.deepEqual(
      readLicense(dir, {}, { "cut-me": { before: "# Others", note: "N" } }),
      { texts: ["Own"], note: "N" },
    );
    assert.throws(
      () => readLicense(dir, {}, { "cut-me": { before: "# Gone", note: "N" } }),
      /cut-me@1\.0\.0.*# Gone/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("H4: rolldown's entry also has its THIRD-PARTY-LICENSE (Rollup's MIT)", () => {
  const dir = join(root, "node_modules", "rolldown");
  const section = normalize(sectionOf("rolldown"));
  for (const file of ["LICENSE", "THIRD-PARTY-LICENSE"]) {
    const text = normalize(readFileSync(join(dir, file), "utf8"));
    assert.ok(section.includes(text), file);
  }
  assert.match(section, /github\.com\/rollup\/rollup\/graphs\/contributors/);
});

test("ui-revise2 L5: LINE Seed JP's section notes the font's own copyright holder", () => {
  const dir = join(root, "node_modules/@fontsource/line-seed-jp");
  const { version } = JSON.parse(
    readFileSync(join(dir, "package.json"), "utf8"),
  );
  // The note is for the installed version (an upgrade is checked again).
  assert.ok(LICENSE_NOTES[`@fontsource/line-seed-jp@${version}`], version);
  // The copyright in the shipped font file (the subset of "unlibra").
  const fonts = globSync("_astro/line-seed-jp-*.woff2", { cwd: dist });
  assert.equal(fonts.length, 1, "LINE Seed JP files in dist/");
  const { name } = woff2Tables(readFileSync(join(dist, fonts[0])));
  assert.equal(nameOf(name, 0), "© LY Corporation");

  const section = sectionOf("@fontsource/line-seed-jp");
  assert.match(
    section,
    /^Note: The copyright notice in the font files is "© LY Corporation"\./m,
  );
  // The package's own license file (the full OFL) is kept as it is.
  const license = readFileSync(join(dir, "LICENSE"), "utf8");
  assert.match(license, /SIL OPEN FONT LICENSE Version 1\.1/);
  assert.ok(normalize(section).includes(normalize(license)));
});

test("ui-revise2 4: the brand font made from LINE Seed JP is listed through DERIVED_ASSETS", () => {
  assert.deepEqual(Object.keys(DERIVED_ASSETS), [
    "src/assets/fonts/line-seed-jp-unlibra-700.woff2",
  ]);
  // The package is only the source of the subset: a devDependency.
  assert.ok(pkg.devDependencies["@fontsource/line-seed-jp"]);
  assert.equal(pkg.dependencies["@fontsource/line-seed-jp"], undefined);
  // Its section says how it is included.
  assert.match(
    sectionOf("@fontsource/line-seed-jp"),
    /^Included as: files\/line-seed-jp-latin-700-normal\.woff2, cut down to the letters of "unlibra" \(scripts\/subset-brand-font\.mjs\)$/m,
  );
});

test("readLicense adds a LICENSE_NOTES note to the license's own note", () => {
  const dir = mkdtempSync(join(tmpdir(), "licenses-"));
  try {
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name: "noted", version: "1.0.0", license: "MIT" }),
    );
    writeFileSync(join(dir, "LICENSE"), "The license text\n");
    const notes = { "noted@1.0.0": { note: "Extra." } };
    assert.deepEqual(readLicense(dir, {}, {}, notes), {
      texts: ["The license text"],
      note: "Extra.",
    });
    // Another version gets no note.
    assert.deepEqual(
      readLicense(dir, {}, {}, { "noted@0.9.0": notes["noted@1.0.0"] }),
      {
        texts: ["The license text"],
        note: "",
      },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
