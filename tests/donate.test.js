// Tests for the donate page (/donate): the address to send an Amazon e-gift
// card to, a button that copies it and a link to the gift card. Run after
// `npm run build`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, globSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
if (!existsSync(join(dist, "index.html"))) {
  throw new Error("dist/ not found. Run `npm run build` before `npm test`.");
}

const { site } = await import("../src/config/site.ts");
const page = readFileSync(join(dist, "donate/index.html"), "utf8");
const main = page.match(/<main[\s>][\s\S]*?<\/main>/)[0];

test("the donation settings: the address and the Amazon e-gift card", () => {
  assert.deepEqual(site.donation, {
    email: "gift@unlibra.com",
    amazonGift: "https://www.amazon.co.jp/dp/B06X1GVMW7?gpo=500",
  });
  assert.equal(site.links.sponsor, undefined);
});

test("the page shows the address and a button that copies it", () => {
  assert.match(main, /<h1[^>]*>寄付・支援<\/h1>/);
  assert.match(main, /Amazon\s+eギフトカード/);
  const box = main.match(/<div[^>]*data-donate-email[\s\S]*?<\/div>/)[0];
  assert.match(
    box,
    /<span[^>]*\bfont-mono\b[^>]*>\s*gift@unlibra\.com\s*<\/span>/,
  );
  const button = box.match(/<button[^>]*>[\s\S]*?<\/button>/)[0];
  assert.match(button, /type="button"/);
  assert.match(button, /data-copy="gift@unlibra\.com"/);
  // The name read out is the label on screen (WCAG 2.5.3).
  assert.doesNotMatch(button, /aria-label/);
  assert.match(button, />\s*コピー\s*</);
  // The result of copying is announced.
  assert.match(main, /<p[^>]*role="status"[^>]*data-copy-status/);
});

test("the page links to the Amazon e-gift card in a new tab, drawn as a button", () => {
  const links = [...main.matchAll(/<a\s[^>]*>/g)].map((m) => m[0]);
  assert.equal(links.length, 1);
  const [link] = links;
  // gpo fills in ¥500 on Amazon's page (the amount can be changed there).
  assert.match(
    link,
    /href="https:\/\/www\.amazon\.co\.jp\/dp\/B06X1GVMW7\?gpo=500"/,
  );
  assert.match(link, /target="_blank"/);
  assert.match(link, /rel="noopener noreferrer"/);
  assert.match(link, /\bdata-button\b/);
  assert.match(main, />\s*Amazon eギフトカードを贈る\s*</);
});

test("the page is like the privacy policy: Japanese, canonical, in the sitemap", () => {
  assert.match(page, /<html lang="ja"/);
  assert.match(
    page,
    /<link rel="canonical" href="https:\/\/unlibra\.com\/donate">/,
  );
  assert.match(
    readFileSync(join(dist, "sitemap-0.xml"), "utf8"),
    /<loc>https:\/\/unlibra\.com\/donate<\/loc>/,
  );
  assert.match(page, /<title>寄付・支援 - unlibra<\/title>/);
});

test("no page links to OFUSE any more", () => {
  for (const file of globSync("**/*.html", { cwd: dist })) {
    assert.doesNotMatch(
      readFileSync(join(dist, file), "utf8"),
      /ofuse\.me/,
      file,
    );
  }
});
