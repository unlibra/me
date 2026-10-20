// Tests for the license files (Phase 5): LICENSE, LICENSES/, package.json,
// and README.md. These read repository files only, not dist/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** File contents with line endings normalized to LF. */
const read = (path) =>
  readFileSync(join(root, path), "utf8").replace(/\r\n/g, "\n");

const license = read("LICENSE");

/** Text of a numbered section of LICENSE ("1. MIT License" etc.). */
const section = (number) => {
  const start = license.search(new RegExp(`^${number}\\. `, "m"));
  assert.notEqual(start, -1, `LICENSE has no section ${number}`);
  const rest = license.slice(start + 1);
  const end = rest.search(/^\d+\. /m);
  return end === -1 ? rest : rest.slice(0, end);
};

/** Paths listed as "  - path" in a block of LICENSE. */
const listed = (text) => [...text.matchAll(/^ {2}- (\S+)$/gm)].map((m) => m[1]);

/**
 * Third-party sources in section 2 of LICENSE. Each source is a paragraph
 * (name, license, "The full text is in LICENSES/...") followed by its files.
 */
const thirdPartySources = () =>
  section(2)
    .split(/\n\n(?=\S)/)
    .filter((block) => /The full text is in LICENSES\//.test(block))
    .map((block) => ({
      heading: block.split("\n")[0],
      licenseFile: block.match(/The full text is in (LICENSES\/\S+?)\.?$/m)[1],
      files: listed(block),
    }));

/** Matches an attribution of material by other authors. */
const ATTRIBUTION =
  /copyright \(c\)|\bMIT License\b|licensed under|SPDX-License-Identifier|dcterms:license|creativecommons\.org|data source:/i;

/**
 * Files with material by other authors that cannot carry an attribution
 * comment (JSON has no comments). They must still be listed in LICENSE.
 */
const WITHOUT_COMMENT = [
  // tailwindcss 3.4.18 colors (docs/decisions/phase-4/tools.md T-21)
  "tests/fixtures/tw-palette-generator/tailwind-v3-colors.json",
];

/**
 * Tracked and untracked (not ignored) files under src/ and tests/, where
 * material by other authors can be. This file is left out because it
 * contains the attribution patterns themselves.
 */
const sourceFiles = () =>
  execFileSync(
    "git",
    [
      "ls-files",
      "--cached",
      "--others",
      "--exclude-standard",
      "-z",
      "src",
      "tests",
    ],
    { cwd: root, encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean)
    .filter((p) => p !== "tests/license.test.js")
    .filter((p) => existsSync(join(root, p)))
    .filter((p) => !/\.(png|webp|jpe?g|gif|ico|woff2?)$/i.test(p));

/** The beginning of a file, where its attribution must be. */
const headOf = (path) => {
  const text = read(path);
  if (!path.endsWith(".svg")) return text.split("\n").slice(0, 10).join("\n");
  // In an SVG, the part before the first element that draws or defines shapes.
  const end = text.search(/<(?:g|path|rect|circle|ellipse|mask|defs)\b/);
  return end === -1 ? text : text.slice(0, end);
};

/** The MIT License text (https://opensource.org/license/mit) without the copyright line. */
const MIT_TEXT = `MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

/** Splits an MIT license file into its copyright line and the rest. */
const splitCopyright = (text) => {
  const lines = text.split("\n");
  const index = lines.findIndex((l) => l.startsWith("Copyright (c)"));
  assert.notEqual(index, -1, "no copyright line");
  const copyright = lines[index];
  lines.splice(index, 2); // the copyright line and the blank line after it
  return { copyright, body: lines.join("\n") };
};

test("F2: LICENSE reserves all rights by default", () => {
  assert.match(
    license.split("\n")[0],
    /^Copyright \(c\) 2025 unlibra\. All rights reserved\.$/,
  );
  assert.match(license, /no license is granted/);
});

test("F2: LICENSE lists the MIT directories, and they exist", () => {
  const dirs = listed(section(1));
  // docs/decisions/phase-4/parent.md P4-1
  assert.deepEqual(dirs, ["src/tools/", "src/components/ui/"]);
  for (const dir of dirs) {
    assert.ok(statSync(join(root, dir)).isDirectory(), dir);
  }
  assert.match(section(1), /LICENSES\/MIT\.txt/);
});

test("F2: listed third-party files exist and start with their attribution", () => {
  const sources = thirdPartySources();
  assert.deepEqual(
    sources.map((s) => s.licenseFile),
    [
      "LICENSES/Heroicons-MIT.txt",
      "LICENSES/tailwindcss-MIT.txt",
      "LICENSES/CC0-1.0.txt",
    ],
  );
  for (const { heading, licenseFile, files } of sources) {
    assert.ok(existsSync(join(root, licenseFile)), licenseFile);
    assert.ok(files.length > 0, `${heading}: no files listed`);
    // The first word of the heading names the source (Heroicons, Tailwind, DiceBear).
    const name = new RegExp(heading.split(" ")[0], "i");
    for (const file of files) {
      assert.ok(existsSync(join(root, file)), `${file} does not exist`);
      if (WITHOUT_COMMENT.includes(file)) continue;
      const head = headOf(file);
      assert.match(head, ATTRIBUTION, `${file}: no attribution at the top`);
      assert.match(head, name, `${file}: attribution does not name ${name}`);
    }
  }
});

test("F2: every file with material by other authors is listed in LICENSE", () => {
  const withAttribution = sourceFiles()
    .filter((p) => ATTRIBUTION.test(read(p)))
    .concat(WITHOUT_COMMENT)
    .sort();
  const inLicense = thirdPartySources()
    .flatMap((s) => s.files)
    .sort();
  assert.deepEqual(withAttribution, inLicense);
});

test("F2: LICENSE excludes BOOTH images by other creators and covers dependencies", () => {
  assert.match(section(3), /BOOTH product images/);
  assert.match(section(3), /src\/assets\/works\/third-party\//);
  assert.match(section(4), /npm packages/);
});

test("F3: LICENSES/MIT.txt is the MIT License for unlibra", () => {
  const { copyright, body } = splitCopyright(read("LICENSES/MIT.txt"));
  assert.equal(copyright, "Copyright (c) 2025 unlibra");
  assert.equal(body, MIT_TEXT);
});

test("F3: Heroicons and tailwindcss licenses are copied verbatim", () => {
  for (const [file, pkg] of [
    ["LICENSES/Heroicons-MIT.txt", "node_modules/@heroicons/react/LICENSE"],
    ["LICENSES/tailwindcss-MIT.txt", "node_modules/tailwindcss/LICENSE"],
  ]) {
    const text = read(file);
    assert.equal(text, read(pkg), file);
    const { copyright, body } = splitCopyright(text);
    assert.equal(copyright, "Copyright (c) Tailwind Labs, Inc.", file);
    assert.equal(body, MIT_TEXT, file);
  }
});

test("F3: LICENSES/CC0-1.0.txt is the CC0 1.0 legal code", () => {
  // SHA-256 of https://creativecommons.org/publicdomain/zero/1.0/legalcode.txt
  const hash = createHash("sha256")
    .update(read("LICENSES/CC0-1.0.txt"))
    .digest("hex");
  assert.equal(
    hash,
    "a2010f343487d3f7618affe54f789f5487602331c0a8d03f49e9a7c547cf0499",
  );
});

test("F4: package.json points to LICENSE", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.license, "SEE LICENSE IN LICENSE");
});

test("F5: README describes the new site only", () => {
  const readme = read("README.md");
  for (const pattern of [
    /ibm[ -]plex/i,
    /\bX \(Twitter\)|X-style|X's profile/i,
    /vercel/i,
    /cloudflare pages/i,
  ]) {
    assert.doesNotMatch(readme, pattern);
  }
  assert.match(readme, /\[LICENSE\]\(LICENSE\)/);
});
