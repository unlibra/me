// SP-18: the pages scripts/indexnow.mjs reports as changed, and the commit
// marker in dist/. Run `npm run build` before `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  COMMIT_FILE,
  INDEXNOW_KEY,
  changedPages,
  pageContent,
} from "../scripts/indexnow.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
if (!existsSync(join(dist, "index.html"))) {
  throw new Error("dist/ not found. Run `npm run build` before `npm test`.");
}

/** A copy of dist/ to change, removed after `run`. */
const withCopy = (run) => {
  const dir = mkdtempSync(join(tmpdir(), "indexnow-"));
  try {
    cpSync(dist, dir, { recursive: true });
    run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};
const edit = (dir, file, change) =>
  writeFileSync(join(dir, file), change(readFileSync(join(dir, file), "utf8")));

test("SP-18: dist/commit.txt names the commit of the build", () => {
  const commit = readFileSync(join(dist, COMMIT_FILE), "utf8");
  assert.match(commit, /^[0-9a-f]{40}\n$/);
  // Locally and in CI, the checked-out commit (Workers Builds: its own).
  if (!process.env.WORKERS_CI_COMMIT_SHA) {
    const head = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    });
    assert.equal(commit, head);
  }
});

test("SP-18: the same build has no changed pages", () => {
  assert.deepEqual(changedPages(dist, dist), []);
});

test("SP-18: a change outside <main>, in file names or in scripts is not a change", () => {
  withCopy((copy) => {
    edit(copy, "privacy/index.html", (html) =>
      html
        .replace(/(\/_astro\/[\w-]+\.)[\w-]+(\.css)/g, "$1Changed$2")
        .replace("<footer", "<footer data-changed")
        .replace("</main>", "<script>changed()</script></main>"),
    );
    assert.deepEqual(changedPages(dist, copy), []);
  });
});

test("SP-18: a change to the text, a link, an image's alt, the title or the description is a change", () => {
  const page = "https://unlibra.com/privacy";
  for (const change of [
    (html) => html.replace(/(<main[\s\S]*?<p[^>]*>)/, "$1Changed "),
    (html) =>
      html.replace(
        /(<main[\s\S]*?href=")[^"]*/,
        "$1https://example.com/changed",
      ),
    (html) => html.replace(/<title>/, "<title>Changed "),
    (html) =>
      html.replace(/(<meta name="description" content=")/, "$1Changed "),
  ]) {
    withCopy((copy) => {
      edit(copy, "privacy/index.html", change);
      assert.deepEqual(changedPages(dist, copy), [page]);
    });
  }
  const top = readFileSync(join(dist, "index.html"), "utf8");
  assert.notEqual(
    pageContent(top),
    pageContent(top.replace(/(<main[\s\S]*?<img[^>]*\salt=")/, "$1Changed ")),
  );
});

test("SP-18: a page added to or removed from the sitemap is reported", () => {
  withCopy((copy) => {
    edit(copy, "sitemap-0.xml", (xml) =>
      xml
        .replace(
          /<url><loc>https:\/\/unlibra\.com\/privacy<\/loc>.*?<\/url>/,
          "",
        )
        .replace(
          "</urlset>",
          "<url><loc>https://unlibra.com/new</loc></url></urlset>",
        ),
    );
    assert.deepEqual(changedPages(dist, copy), [
      "https://unlibra.com/new",
      "https://unlibra.com/privacy",
    ]);
  });
});

test("SP-18: the key file is the one IndexNow is told about", () => {
  assert.equal(
    readFileSync(join(dist, `${INDEXNOW_KEY}.txt`), "utf8"),
    INDEXNOW_KEY,
  );
});
