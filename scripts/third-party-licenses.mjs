// Astro integration: writes the licenses of the npm packages that the build
// output actually ships to dist/third-party-licenses.txt.
//
// The packages are found from the build itself:
// - JavaScript: the modules of each chunk of the client build
// - Fonts and other files: the source paths of the emitted assets
// Code that reaches the output without passing through the module graph is
// listed by hand (PREBUNDLED, VIRTUAL_MODULES and OUTSIDE_MODULE_GRAPH below).
//
// The build fails when a shipped package has no license file and no
// LICENSE_FALLBACKS entry, so that no package is left out silently.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Path of the list in dist/ (and on the site). */
export const LICENSES_FILE = "third-party-licenses.txt";

/**
 * Packages whose shipped file is their own prebuilt bundle, which contains
 * other packages that the module graph cannot see. Keyed by package name.
 * All versions are pinned (a package can be bundled at two versions): after
 * an upgrade, check the bundle again and update this (FX-5, FX-8 in
 * docs/decisions/fixes/fixes.md).
 */
export const PREBUNDLED = {
  svgo: {
    version: "4.1.0",
    file: "dist/svgo.browser.js",
    packages: [
      "boolbase@1.0.0",
      "css-select@6.0.0",
      "css-tree@3.2.1",
      // csso's own copy (node_modules/csso/node_modules/), with its data
      "css-tree@2.2.1",
      "css-what@7.0.0",
      "csso@5.0.5",
      "dom-serializer@2.0.0",
      "domelementtype@2.3.0",
      "domhandler@5.0.3",
      "domutils@3.2.2",
      "entities@4.5.0",
      "mdn-data@2.27.1",
      "mdn-data@2.0.28",
      "nth-check@2.1.1",
      "sax@1.6.1",
      "source-map-js@1.2.2",
    ],
  },
  jszip: {
    version: "3.10.2",
    file: "dist/jszip.min.js",
    packages: [
      "immediate@3.0.6",
      "lie@3.3.0",
      "pako@1.0.11",
      "setimmediate@1.0.5",
    ],
  },
};

/**
 * Virtual modules (ids starting with "\0") that the bundler puts into the
 * client JavaScript, and the package each comes from (resolved from the
 * project root, or from the package in `from`). Any other virtual module
 * stops the build, so that it is looked at.
 */
export const VIRTUAL_MODULES = {
  "\0vite/preload-helper.js": {
    name: "vite",
    note: "runtime helper vite/preload-helper.js, added by the bundler",
  },
  "\0rolldown/runtime.js": {
    name: "rolldown",
    from: "vite",
    note: "runtime helper rolldown/runtime.js, added by the bundler",
  },
};

/**
 * Packages whose code reaches dist/ without being a module of the bundle.
 * The tests check that the reasons still hold.
 */
export const OUTSIDE_MODULE_GRAPH = {
  astro: "island hydration script, inlined into the HTML of the tool pages",
  tailwindcss: "base styles (preflight) and utilities, generated into the CSS",
  // A devDependency: two icons are copied into src/components/icons/
  // (LICENSE, section 2), and are in the HTML of the top page (ui-revise5).
  "lucide-static":
    "icons box and move-up-right (icons/box.svg, icons/move-up-right.svg), copied into the HTML of the top page",
};

/**
 * License texts for shipped packages that have no license file. Keyed by
 * name@version so that an upgrade is checked again. The note is shown in the
 * list.
 */
export const LICENSE_FALLBACKS = {
  "boolbase@1.0.0": {
    note:
      "The package has no license file. The license text below is the ISC " +
      'License template, filled in from "license" and "author" in its ' +
      "package.json.",
    text: `ISC License

Copyright (c) Felix Boehm <me@feedic.com>

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
`,
  },
};

/**
 * Packages whose license file also covers code that is not shipped: only the
 * text before `before` is used. Stops the build if `before` is not found.
 */
export const LICENSE_CUTS = {
  // LICENSE.md also lists the dependencies bundled into Vite's Node.js code.
  // Only Vite's own runtime helper (preload-helper) is shipped.
  vite: {
    before: "# Licenses of bundled dependencies",
    note:
      "Only the Vite core license is shown. The licenses of the dependencies " +
      "bundled into Vite's Node.js code are left out, as that code is not " +
      "part of this website.",
  },
};

/**
 * Files of this project made from a package (generated once and kept in the
 * repository), keyed by their path from the project root. When the build
 * ships one, the package is listed with the note (the package itself is a
 * devDependency).
 */
export const DERIVED_ASSETS = {
  "src/assets/fonts/line-seed-jp-unlibra-700.woff2": {
    name: "@fontsource/line-seed-jp",
    note:
      "files/line-seed-jp-latin-700-normal.woff2, cut down to the letters " +
      'of "unlibra" (scripts/subset-brand-font.mjs)',
  },
};

/** Whether a file (absolute path) is one of DERIVED_ASSETS. */
const isDerivedAsset = (file, projectRoot) =>
  Object.hasOwn(
    DERIVED_ASSETS,
    relative(projectRoot, file.replace(/[?#].*$/, "")).replaceAll("\\", "/"),
  );

/**
 * Notes added to a package's section, for what its license files do not say.
 * Keyed by name@version so that an upgrade is checked again (the tests fail
 * when the installed version has no entry).
 */
export const LICENSE_NOTES = {
  // The package's LICENSE file is Fontsource's template ("Google Inc."); the
  // font files themselves name the copyright holder (name table, ID 0).
  "@fontsource/line-seed-jp@5.3.2": {
    note:
      'The copyright notice in the font files is "© LY Corporation". The ' +
      "license file below is the one in the npm package.",
  },
};

// Also THIRD-PARTY-LICENSE(S): rolldown's LICENSE points to it for the code
// derived from Rollup.
const LICENSE_FILE_PATTERN =
  /^((third[-_]party[-_])?licen[cs]es?|copying|notice)([.-].*)?$/i;

/**
 * The package a module or asset path belongs to: the directory right after
 * its last `node_modules`, or null for the project's own files.
 */
export function packageOfPath(id) {
  const path = id
    .replace(/^\0/, "")
    .replace(/[?#].*$/, "")
    .replaceAll("\\", "/");
  const marker = "/node_modules/";
  const index = path.lastIndexOf(marker);
  if (index === -1) return null;
  const rest = path.slice(index + marker.length).split("/");
  const length = rest[0].startsWith("@") ? 2 : 1;
  if (rest.length <= length) return null;
  const name = rest.slice(0, length).join("/");
  return {
    name,
    dir: path.slice(0, index + marker.length) + name,
    file: rest.slice(length).join("/"),
  };
}

const readPackageJson = (dir) =>
  JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));

/** The directory of a package as Node resolves it from `fromDir`. */
function findPackageDir(name, fromDir) {
  let dir = fromDir;
  for (;;) {
    const candidate = join(dir, "node_modules", name);
    if (statSync(join(candidate, "package.json"), { throwIfNoEntry: false })) {
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * The package a module of the client build belongs to: a package in
 * node_modules, a known virtual module (VIRTUAL_MODULES), or null for the
 * project's own files. Throws for anything else.
 */
export function packageOfModule(id, projectRoot) {
  const found = packageOfPath(id);
  if (found) return { ...found, note: "" };
  if (id.startsWith("\0")) {
    const virtual = VIRTUAL_MODULES[id];
    if (!virtual) {
      throw new Error(
        `${LICENSES_FILE}: unknown virtual module ${JSON.stringify(id)} in the client build. ` +
          "Add the package it comes from to VIRTUAL_MODULES in scripts/third-party-licenses.mjs.",
      );
    }
    const fromDir = virtual.from
      ? findPackageDir(virtual.from, projectRoot)
      : projectRoot;
    const dir = fromDir && findPackageDir(virtual.name, fromDir);
    if (!dir) throw new Error(`${LICENSES_FILE}: ${virtual.name} not found`);
    return { name: virtual.name, dir, file: null, note: virtual.note };
  }
  const path = resolve(id.replace(/[?#].*$/, ""));
  const fromRoot = relative(projectRoot, path);
  if (fromRoot !== "" && !fromRoot.startsWith("..") && !isAbsolute(fromRoot)) {
    return null;
  }
  throw new Error(
    `${LICENSES_FILE}: module ${JSON.stringify(id)} in the client build is neither in node_modules nor in the project`,
  );
}

/**
 * The directories of the packages in `specs` (name@version) among the
 * dependencies (direct or indirect) of the package in `rootDir`. Keyed by
 * the spec.
 */
export function findDependencyDirs(rootDir, specs) {
  const found = new Map();
  const visited = new Set();
  const queue = [rootDir];
  while (queue.length > 0) {
    const dir = queue.shift();
    if (visited.has(dir)) continue;
    visited.add(dir);
    const pkg = readPackageJson(dir);
    const spec = `${pkg.name}@${pkg.version}`;
    if (dir !== rootDir && specs.includes(spec) && !found.has(spec)) {
      found.set(spec, dir);
    }
    for (const dep of Object.keys(pkg.dependencies ?? {})) {
      const depDir = findPackageDir(dep, dir);
      if (depDir) queue.push(depDir);
    }
  }
  const missing = specs.filter((spec) => !found.has(spec));
  if (missing.length > 0) {
    throw new Error(
      `${LICENSES_FILE}: not found among the dependencies of ${rootDir}: ${missing.join(", ")}`,
    );
  }
  return found;
}

/**
 * The license texts of the package in `dir` (its license and notice files,
 * or its LICENSE_FALLBACKS entry with the entry's note). Throws when there
 * is neither.
 */
export function readLicense(
  dir,
  fallbacks = LICENSE_FALLBACKS,
  cuts = LICENSE_CUTS,
  notes = LICENSE_NOTES,
) {
  const pkg = readPackageJson(dir);
  const extra = notes[`${pkg.name}@${pkg.version}`]?.note ?? "";
  const withNote = ({ texts, note }) => ({
    texts,
    note: [note, extra].filter(Boolean).join(" "),
  });
  const files = readdirSync(dir)
    .filter((file) => LICENSE_FILE_PATTERN.test(file))
    .filter((file) => statSync(join(dir, file)).isFile())
    .sort();
  if (files.length > 0) {
    const texts = files.map((file) =>
      readFileSync(join(dir, file), "utf8").trim(),
    );
    const cut = cuts[pkg.name];
    if (!cut) return withNote({ texts, note: "" });
    const index = texts.findIndex((text) => text.includes(cut.before));
    if (index === -1) {
      throw new Error(
        `${LICENSES_FILE}: ${pkg.name}@${pkg.version}: ${JSON.stringify(cut.before)} not found in its license files. Check LICENSE_CUTS.`,
      );
    }
    texts[index] = texts[index].slice(0, texts[index].indexOf(cut.before));
    return withNote({
      texts: texts.map((text) => text.trim()),
      note: cut.note,
    });
  }
  const fallback = fallbacks[`${pkg.name}@${pkg.version}`];
  if (fallback) {
    return withNote({ texts: [fallback.text.trim()], note: fallback.note });
  }
  throw new Error(
    `${LICENSES_FILE}: ${pkg.name}@${pkg.version} (${dir}) has no license file. ` +
      "Add its license text to LICENSE_FALLBACKS in scripts/third-party-licenses.mjs.",
  );
}

/** Whether one pair of parentheses encloses the whole expression. */
const isEnclosed = (expression) => {
  if (!expression.startsWith("(")) return false;
  let depth = 0;
  for (const [index, char] of [...expression].entries()) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (depth === 0) return index === expression.length - 1;
  }
  return false;
};

/** An SPDX expression in parentheses, unless it already has them. */
const parenthesize = (expression) =>
  isEnclosed(expression) ? expression : `(${expression})`;

const RULE = "=".repeat(78);
const THIN_RULE = "-".repeat(78);

/** The text of the list. `packages` maps a package directory to a note. */
export function renderLicenses(packages) {
  const entries = [...packages]
    .map(([dir, note]) => {
      const pkg = readPackageJson(dir);
      return { pkg, note, license: readLicense(dir) };
    })
    .sort(
      (a, b) =>
        a.pkg.name.localeCompare(b.pkg.name, "en") ||
        a.pkg.version.localeCompare(b.pkg.version, "en"),
    );

  const header = [
    "Third-party software in this website",
    "",
    "The JavaScript, CSS and font files of this website include the npm",
    "packages below. Each package is licensed under its own license, whose",
    "full text and copyright notices follow.",
    "",
    ...entries.map(
      ({ pkg }) =>
        `  - ${pkg.name} ${pkg.version} ${parenthesize(pkg.license)}`,
    ),
  ];
  const sections = entries.map(({ pkg, note, license }) =>
    [
      RULE,
      `${pkg.name} ${pkg.version}`,
      `License: ${pkg.license}`,
      ...(note ? [`Included as: ${note}`] : []),
      ...(license.note ? [`Note: ${license.note}`] : []),
      THIN_RULE,
      license.texts.join(`\n\n${THIN_RULE}\n\n`),
    ].join("\n"),
  );
  return `${[header.join("\n"), ...sections].join("\n\n")}\n`;
}

/**
 * The Astro integration. Adds the Vite plugin that collects the packages,
 * and writes the list after the build.
 */
export default function thirdPartyLicenses() {
  /** Package directory -> note on how it is shipped ("" if as a module). */
  const shipped = new Map();
  let projectRoot;
  let site;

  const add = (dir, note = "") => {
    const key = resolve(dir);
    if (!shipped.get(key)) shipped.set(key, note);
  };

  const plugin = {
    name: "third-party-licenses",
    apply: "build",
    outputOptions(options) {
      if (this.environment?.name !== "client") return null;
      return {
        ...options,
        // Added after minification, so that it is kept.
        postBanner: `/*! Third-party licenses: ${new URL(LICENSES_FILE, site)} */`,
      };
    },
    generateBundle(_options, bundle) {
      const environment = this.environment?.name;
      for (const output of Object.values(bundle)) {
        // Assets of every environment are copied to dist/ (fonts come from
        // the prerender build); their source paths are relative to the
        // project root. Chunks only ship from the client build.
        const packages =
          output.type === "asset"
            ? output.originalFileNames.map((name) =>
                packageOfPath(resolve(projectRoot, name)),
              )
            : environment === "client"
              ? output.moduleIds.map((id) => packageOfModule(id, projectRoot))
              : [];
        if (output.type === "asset") {
          for (const name of output.originalFileNames) {
            const derived = DERIVED_ASSETS[name.replaceAll("\\", "/")];
            if (!derived) continue;
            const dir = findPackageDir(derived.name, projectRoot);
            if (!dir) {
              throw new Error(`${LICENSES_FILE}: ${derived.name} not found`);
            }
            add(dir, derived.note);
          }
        }
        for (const found of packages) {
          if (!found) continue;
          add(found.dir, found.note);
          const prebundled = PREBUNDLED[found.name];
          if (prebundled && found.file === prebundled.file) {
            const { version } = readPackageJson(found.dir);
            if (version !== prebundled.version) {
              throw new Error(
                `${LICENSES_FILE}: ${found.name} is ${version}, but PREBUNDLED lists ${prebundled.version}. ` +
                  `Check which packages ${prebundled.file} contains and update PREBUNDLED.`,
              );
            }
            for (const [, dir] of findDependencyDirs(
              found.dir,
              prebundled.packages,
            )) {
              add(dir, `part of ${found.name} ${version} (${prebundled.file})`);
            }
          }
        }
      }
    },
  };

  return {
    name: "third-party-licenses",
    hooks: {
      "astro:config:setup": ({ config, updateConfig }) => {
        projectRoot = fileURLToPath(config.root);
        site = config.site;
        if (!site) throw new Error(`${LICENSES_FILE}: config.site is not set`);
        updateConfig({
          vite: {
            plugins: [plugin],
            build: {
              // Derived assets are always files (never inlined as data
              // URLs), so that the build output shows them and they are
              // listed.
              assetsInlineLimit: (file) =>
                isDerivedAsset(file, projectRoot) ? false : undefined,
            },
          },
        });
      },
      "astro:build:done": ({ dir }) => {
        for (const [name, note] of Object.entries(OUTSIDE_MODULE_GRAPH)) {
          const pkgDir = findPackageDir(name, projectRoot);
          if (!pkgDir) throw new Error(`${LICENSES_FILE}: ${name} not found`);
          add(pkgDir, note);
        }
        writeFileSync(
          join(fileURLToPath(dir), LICENSES_FILE),
          renderLicenses(shipped),
        );
      },
    },
  };
}
