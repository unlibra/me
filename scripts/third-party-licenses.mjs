// Astro integration: writes the licenses of the npm packages that the build
// output actually ships to dist/third-party-licenses.txt.
//
// The packages are found from the build itself:
// - JavaScript: the modules of each chunk of the client build
// - Fonts and other files: the source paths of the emitted assets
// Code that reaches the output without passing through the module graph is
// listed by hand (PREBUNDLED and OUTSIDE_MODULE_GRAPH below).
//
// The build fails when a shipped package has no license file and no
// LICENSE_FALLBACKS entry, so that no package is left out silently.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Path of the list in dist/ (and on the site). */
export const LICENSES_FILE = "third-party-licenses.txt";

/**
 * Packages whose shipped file is their own prebuilt bundle, which contains
 * other packages that the module graph cannot see. Keyed by package name.
 * The version is pinned: after an upgrade, check the bundle again and
 * update `packages` (docs/decisions/fixes/fixes.md, FX-5).
 */
export const PREBUNDLED = {
  svgo: {
    version: "4.1.0",
    file: "dist/svgo.browser.js",
    packages: [
      "boolbase",
      "css-select",
      "css-tree",
      "css-what",
      "csso",
      "dom-serializer",
      "domelementtype",
      "domhandler",
      "domutils",
      "entities",
      "mdn-data",
      "nth-check",
      "sax",
      "source-map-js",
    ],
  },
  jszip: {
    version: "3.10.2",
    file: "dist/jszip.min.js",
    packages: ["immediate", "lie", "pako", "setimmediate"],
  },
};

/**
 * Packages whose code reaches dist/ without being a module of the bundle.
 * The tests check that the reasons still hold.
 */
export const OUTSIDE_MODULE_GRAPH = {
  astro: "island hydration script, inlined into the HTML of the tool pages",
  tailwindcss: "base styles (preflight) and utilities, generated into the CSS",
};

/**
 * License texts for shipped packages that have no license file. Keyed by
 * name@version so that an upgrade is checked again.
 */
export const LICENSE_FALLBACKS = {
  // The package (and its repository) has no license file; package.json says
  // "license": "ISC" and "author": "Felix Boehm <me@feedic.com>".
  "boolbase@1.0.0": `ISC License

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
};

const LICENSE_FILE_PATTERN = /^(licen[cs]e|copying|notice)([.-].*)?$/i;

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
 * The directories of `names` among the dependencies (direct or indirect)
 * of the package in `rootDir`.
 */
export function findDependencyDirs(rootDir, names) {
  const found = new Map();
  const visited = new Set();
  const queue = [rootDir];
  while (queue.length > 0) {
    const dir = queue.shift();
    if (visited.has(dir)) continue;
    visited.add(dir);
    const pkg = readPackageJson(dir);
    if (dir !== rootDir && names.includes(pkg.name) && !found.has(pkg.name)) {
      found.set(pkg.name, dir);
    }
    for (const dep of Object.keys(pkg.dependencies ?? {})) {
      const depDir = findPackageDir(dep, dir);
      if (depDir) queue.push(depDir);
    }
  }
  const missing = names.filter((name) => !found.has(name));
  if (missing.length > 0) {
    throw new Error(
      `${LICENSES_FILE}: not found among the dependencies of ${rootDir}: ${missing.join(", ")}`,
    );
  }
  return found;
}

/**
 * The license texts of the package in `dir`: its license and notice files,
 * or its LICENSE_FALLBACKS entry. Throws when there is neither.
 */
export function readLicenseTexts(dir, fallbacks = LICENSE_FALLBACKS) {
  const pkg = readPackageJson(dir);
  const files = readdirSync(dir)
    .filter((file) => LICENSE_FILE_PATTERN.test(file))
    .filter((file) => statSync(join(dir, file)).isFile())
    .sort();
  if (files.length > 0) {
    return files.map((file) => readFileSync(join(dir, file), "utf8").trim());
  }
  const fallback = fallbacks[`${pkg.name}@${pkg.version}`];
  if (fallback) return [fallback.trim()];
  throw new Error(
    `${LICENSES_FILE}: ${pkg.name}@${pkg.version} (${dir}) has no license file. ` +
      "Add its license text to LICENSE_FALLBACKS in scripts/third-party-licenses.mjs.",
  );
}

const RULE = "=".repeat(78);
const THIN_RULE = "-".repeat(78);

/** The text of the list. `packages` maps a package directory to a note. */
export function renderLicenses(packages) {
  const entries = [...packages]
    .map(([dir, note]) => {
      const pkg = readPackageJson(dir);
      return { pkg, note, texts: readLicenseTexts(dir) };
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
      ({ pkg }) => `  - ${pkg.name} ${pkg.version} (${pkg.license})`,
    ),
  ];
  const sections = entries.map(({ pkg, note, texts }) =>
    [
      RULE,
      `${pkg.name} ${pkg.version}`,
      `License: ${pkg.license}`,
      ...(note ? [`Included as: ${note}`] : []),
      THIN_RULE,
      texts.join(`\n\n${THIN_RULE}\n\n`),
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
        // the prerender build). Chunks only ship from the client build.
        // Asset source paths are relative to the project root.
        const ids =
          output.type === "asset"
            ? output.originalFileNames.map((name) => resolve(projectRoot, name))
            : environment === "client"
              ? output.moduleIds
              : [];
        for (const id of ids) {
          const found = packageOfPath(id);
          if (!found) continue;
          add(found.dir);
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
        updateConfig({ vite: { plugins: [plugin] } });
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
