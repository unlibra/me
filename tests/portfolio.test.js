// Integration tests for the portfolio top page (Phase 3) against dist/.
// Run `npm run build` before `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, globSync, readFileSync, statSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

if (!existsSync(join(dist, "index.html"))) {
  throw new Error("dist/ not found. Run `npm run build` before `npm test`.");
}

const readDist = (path) => readFileSync(join(dist, path), "utf8");
const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];
const hrefs = (html) =>
  [...html.matchAll(/<a\s[^>]*>/g)].map((m) => attr(m[0], "href"));
/** Text content with tags removed. */
const text = (html) => html.replace(/<[^>]*>/g, "").trim();

const SHOP = "https://unlibra-twin.booth.pm/";
/** Section IDs (anchors) and headings, as written in the HTML. */
const CATEGORIES = [
  ["keyboards", "DIY Keyboards"],
  ["libraries", "Libraries"],
  ["apps", "Apps"],
  ["vr-3d", "VR &amp; 3D"],
];
const TOOLS = [
  "tw-palette-generator",
  "favicon-generator",
  "svg-optimizer",
  "password-generator",
];

const top = readDist("index.html");
const { cardKind, cardStyles } = await import("../src/config/cards.ts");

/** The <section id="..."> of a category on the top page. */
const sectionOf = (id) => {
  const sections = top.match(
    new RegExp(`<section[^>]*\\sid="${id}"[\\s\\S]*?</section>`, "g"),
  );
  assert.equal(sections?.length, 1, `section #${id} count`);
  return sections[0];
};

/** Work cards (<article>) in a piece of HTML. */
const cardsOf = (html) =>
  [...html.matchAll(/<article\s[^>]*>[\s\S]*?<\/article>/g)].map((m) => m[0]);

/** The detail dialog of a work. */
const dialogOf = (id) => {
  const dialogs = top.match(
    new RegExp(
      `<dialog[^>]*\\sdata-work-dialog="${id}"[\\s\\S]*?</dialog>`,
      "g",
    ),
  );
  assert.equal(dialogs?.length, 1, `dialog of ${id} count`);
  return dialogs[0];
};

test("D2: the top page has the four category sections in order (ui-revise2 6)", () => {
  const ids = [...top.matchAll(/<section[^>]*\sid="([^"]+)"/g)].map(
    (m) => m[1],
  );
  assert.deepEqual(
    ids,
    CATEGORIES.map(([id]) => id),
  );
  for (const [id, label] of CATEGORIES) {
    const heading = sectionOf(id).match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
    assert.equal(text(heading[1]), label, `#${id} heading`);
    assert.ok(cardsOf(sectionOf(id)).length > 0, `#${id} has works`);
  }
  // The former names are gone from the page (except in the works' texts).
  const page = top
    .match(/<body[\s\S]*<\/body>/)[0]
    .replace(/<dialog[\s\S]*?<\/dialog>/g, "");
  assert.doesNotMatch(page, /WEBツール|ソフトウェア|VRChat/);
  for (const id of ["keyboard", "software", "web", "vrchat"]) {
    assert.doesNotMatch(top, new RegExp(`id="${id}"|href="/#${id}"`), id);
  }
});

test("D2: the header links to each category section (ui-revise2 1, 6)", () => {
  const header = top.match(/<header[\s>][\s\S]*?<\/header>/)[0];
  const nav = header.match(/<ul[^>]*data-category-nav[\s\S]*?<\/ul>/)[0];
  const items = [...nav.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/g)].map((m) => [
    attr(m[0], "href"),
    text(m[1]),
  ]);
  assert.deepEqual(
    items,
    CATEGORIES.map(([id, label]) => [`/#${id}`, label]),
  );
  assert.doesNotMatch(nav, /<button[\s>]/);
  // Every section a header link points to exists.
  for (const [id] of CATEGORIES) sectionOf(id);
});

test("ui-revise 4: the category buttons are gone from the top page", () => {
  const main = top.match(/<main[\s>][\s\S]*?<\/main>/)[0];
  assert.doesNotMatch(main, /href="#/);
  assert.doesNotMatch(main, /<nav[\s>]/);
});

test("ui-revise 1, ui-revise2 4, 5: the hero has the symbol, the name and the subtitle", () => {
  const hero = top.match(/<div[^>]*data-hero[\s\S]*?<\/p>/)[0];
  // The wave and the brand symbol.
  assert.match(hero, /viewBox="0 0 1440 320"/);
  assert.match(hero, /<svg[^>]*viewBox="0 0 512 512"/);
  // The name in LINE Seed JP (the font-brand class).
  assert.match(hero, /<h1 class="[^"]*\bfont-brand\b[^"]*">unlibra<\/h1>/);
  assert.match(hero, /<p[^>]*>昼はカフェ、夜はバー。<\/p>/);
  assert.equal(top.match(/<h1[\s>]/g).length, 1);
});

test("ui-revise 3: no page has sponsor or share buttons; the footer keeps the donate link", () => {
  const pages = globSync("**/*.html", { cwd: dist });
  assert.ok(pages.length >= 11, "self-check of the page list");
  for (const page of pages) {
    const html = readDist(page);
    const footer = html.match(/<footer[\s>][\s\S]*?<\/footer>/)[0];
    const rest = html.replace(footer, "");
    for (const href of hrefs(rest)) {
      assert.doesNotMatch(
        href,
        /ofuse\.me|twitter\.com\/intent|x\.com\/intent/,
        page,
      );
    }
    assert.doesNotMatch(
      rest,
      /navigator\.share|スポンサー|シェアする|ポストする/,
      page,
    );
    assert.ok(hrefs(footer).includes("https://ofuse.me/unlibra"), page);
  }
  assert.equal(
    existsSync(join(root, "src/components/SponsorButton.astro")),
    false,
  );
});

test("ui-revise 5: the profile has no GitHub button", () => {
  const main = top.match(/<main[\s>][\s\S]*?<\/main>/)[0];
  assert.ok(!hrefs(main).some((href) => href.includes("github.com")));
});

test("D3: the apps section's details link to the four tools under /lab", () => {
  const cards = cardsOf(sectionOf("apps"));
  assert.deepEqual(
    cards.map((card) => attr(card, "data-work")),
    TOOLS,
  );
  for (const tool of TOOLS) {
    const links = [...dialogOf(tool).matchAll(/<a\s[^>]*>/g)].map((m) => m[0]);
    assert.deepEqual(
      links.map((a) => attr(a, "href")),
      [`/lab/${tool}`],
      tool,
    );
    // Internal links open in the same tab.
    assert.doesNotMatch(links[0], /target="_blank"/, tool);
  }
});

test("D3: each app card shows the tool's icon, and the file is in dist/", () => {
  // The tool list pages checked the icons until ui-revise removed them.
  const cards = cardsOf(sectionOf("apps"));
  for (const [i, card] of cards.entries()) {
    const imgs = card.match(/<img\s[^>]*>/g) ?? [];
    assert.equal(imgs.length, 1, `${TOOLS[i]}: icon count`);
    const src = attr(imgs[0], "src");
    assert.match(
      src,
      new RegExp(`^/_astro/${TOOLS[i]}\\.[\\w-]+\\.svg$`),
      `${TOOLS[i]}: icon`,
    );
    assert.ok(existsSync(join(dist, src.slice(1))), `${TOOLS[i]}: ${src}`);
  }
});

test("D4: the VR & 3D section has one dummy work per subcategory and the shop link", () => {
  const section = sectionOf("vr-3d");
  const cards = cardsOf(section);
  assert.deepEqual(
    cards.map((card) => attr(card, "data-subcategory")),
    ["avatar", "asset", "unity-tool"],
  );
  const labels = {
    avatar: "アバター",
    asset: "アセット",
    "unity-tool": "Unityツール",
  };
  for (const card of cards) {
    const subcategory = attr(card, "data-subcategory");
    assert.ok(
      text(card).includes(labels[subcategory]),
      `${subcategory}: label`,
    );
    const title = text(card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)[1]);
    assert.match(title, /ダミー/, `${subcategory}: title`);
    const dialog = dialogOf(attr(card, "data-work"));
    assert.deepEqual(hrefs(dialog), [SHOP], `${subcategory}: link`);
    assert.ok(text(dialog).includes(labels[subcategory]), subcategory);
  }
  // The shop link outside the cards and the dialogs.
  const outside = section.replace(/<(article|dialog)[\s\S]*?<\/\1>/g, "");
  assert.ok(hrefs(outside).includes(SHOP), "shop link in the section");
});

test("D4: only VR & 3D works have a subcategory", () => {
  const all = cardsOf(top);
  assert.ok(all.length > 0);
  const vr3d = new Set(cardsOf(sectionOf("vr-3d")));
  for (const card of all) {
    if (vr3d.has(card)) continue;
    assert.equal(
      attr(card, "data-subcategory"),
      undefined,
      attr(card, "data-work"),
    );
  }
});

test("ui-revise2 3: Apps and Libraries use the tool card, DIY Keyboards and VR & 3D the 4:3 frame", () => {
  assert.deepEqual(cardStyles, {
    keyboards: "frame",
    libraries: "tool",
    apps: "tool",
    "vr-3d": "frame",
  });
  for (const [id] of CATEGORIES) {
    for (const card of cardsOf(sectionOf(id))) {
      const work = attr(card, "data-work");
      if (attr(card, "data-card") === "featured") continue;
      assert.equal(attr(card, "data-card"), cardStyles[id], work);
      const imgs = card.match(/<img\s[^>]*>/g);
      assert.equal(imgs.length, 1, work);
      if (cardStyles[id] === "tool") {
        // The icon on a circle, beside the name.
        assert.match(card, /rounded-full[^"]*"><img/, work);
        assert.doesNotMatch(card, /aspect-4\/3/, work);
      } else {
        assert.match(card, /<div class="aspect-4\/3[^"]*"><img/, work);
        assert.match(card, new RegExp(`<time datetime="\\d{4}"`), work);
      }
    }
  }
});

test("ui-revise2 3: a featured work is a large card, chosen by the data", () => {
  // The function the page uses: `featured: true` makes any work large.
  for (const [id] of CATEGORIES) {
    assert.equal(cardKind({ category: id, featured: true }), "featured", id);
    assert.equal(cardKind({ category: id }), cardStyles[id], id);
  }
  // The page follows the data: fosty natural (the first DIY keyboard) only.
  const featured = cardsOf(top).filter(
    (card) => attr(card, "data-card") === "featured",
  );
  assert.deepEqual(
    featured.map((card) => attr(card, "data-work")),
    ["fosty-natural"],
  );
  assert.equal(
    attr(cardsOf(sectionOf("keyboards"))[0], "data-work"),
    "fosty-natural",
  );
  // Full width, with the image and the summary side by side.
  const tag = featured[0].match(/<article[^>]*>/)[0];
  assert.match(attr(tag, "class"), /\bcol-span-full\b/);
  assert.match(attr(tag, "class"), /\bmd:grid-cols-2\b/);
  assert.match(featured[0], /<img[^>]*src="\/_astro\/fosty-natural\./);
});

test("ui-revise2 3: every card shows its one-line summary and opens its details", () => {
  const cards = cardsOf(top);
  assert.equal(cards.length, 14, "self-check of the work count");
  for (const card of cards) {
    const work = attr(card, "data-work");
    const dialog = dialogOf(work);

    // The title is the button that opens the dialog.
    const button = card.match(/<button[^>]*>([\s\S]*?)<\/button>/);
    const title = text(button[1]);
    assert.match(button[0], /type="button"/, work);
    assert.match(button[0], /aria-haspopup="dialog"/, work);
    assert.equal(attr(button[0], "aria-controls"), `work-${work}`, work);
    assert.match(button[0], /after:absolute after:inset-0/, work);
    // Its name is the title and the visible "詳しく見る" (WCAG 2.5.3).
    assert.equal(
      attr(button[0], "aria-labelledby"),
      `work-${work}-open work-${work}-more`,
      work,
    );
    assert.equal(attr(button[0], "id"), `work-${work}-open`, work);
    assert.match(
      card,
      new RegExp(`<p id="work-${work}-more"[^>]*data-work-more`),
      work,
    );
    // Card images are decorative: the title is the heading beside them.
    for (const img of card.match(/<img\s[^>]*>/g)) {
      // Astro writes an empty alt as a bare `alt`.
      assert.match(img, /\salt(="")?[\s>]/, work);
    }

    // The summary: one short line on the card. The description (several
    // lines) is in the details only.
    const summary = card.match(/<p[^>]*data-work-summary[^>]*>([^<]*)<\/p>/);
    assert.ok(summary, `${work}: summary`);
    assert.ok(summary[1].trim() !== "" && !summary[1].includes("\n"), work);
    const description = dialog.match(
      /<p[^>]*data-work-description[^>]*>([^<]*)<\/p>/,
    )[1];
    assert.ok(description.length > summary[1].length, `${work}: description`);
    assert.ok(!card.includes(description.trim()), `${work}: not on the card`);

    // "詳しく見る" with a chevron says that a click opens the details.
    assert.match(
      card,
      /<p[^>]*aria-hidden="true"[^>]*data-work-more[^>]*>\s*詳しく見る\s*<svg/,
      work,
    );
    // The card lifts on hover and keyboard focus.
    const cls = attr(card.match(/<article[^>]*>/)[0], "class");
    for (const name of [
      "relative",
      "motion-safe:hover:-translate-y-0.5",
      "hover:shadow-md",
      "has-[button:focus-visible]:shadow-md",
    ]) {
      assert.ok(cls.split(/\s+/).includes(name), `${work}: ${name}`);
    }

    // The dialog: closed, named by the work's title, with a close button.
    const open = dialog.match(/<dialog[^>]*>/)[0];
    assert.equal(attr(open, "id"), `work-${work}`, work);
    assert.doesNotMatch(open, /\sopen(?=[\s=>])/, work);
    const titleId = attr(open, "aria-labelledby");
    const heading = dialog.match(
      new RegExp(`<h2 id="${titleId}"[^>]*>([\\s\\S]*?)</h2>`),
    );
    assert.equal(text(heading[1]), title, work);
    assert.match(dialog, /<button[^>]*aria-label="閉じる"[^>]*data-work-close/);
  }
});

test("ui-revise2 3: the details link to where each work is published", () => {
  const expected = {
    "i18n-tiny-astro": [
      ["npm で見る", "https://www.npmjs.com/package/@i18n-tiny/astro"],
      ["ドキュメント", "https://docs.unlibra.com/i18n-tiny/astro/introduction"],
    ],
    "tkinter-unblur": [
      ["PyPI で見る", "https://pypi.org/project/tkinter-unblur"],
      ["ドキュメント", "https://docs.unlibra.com/tkinter-unblur/"],
    ],
    "svg-optimizer": [["ツールを開く", "/lab/svg-optimizer"]],
    "dummy-asset": [["BOOTH で見る", SHOP]],
    "fosty-natural": [],
  };
  for (const [work, links] of Object.entries(expected)) {
    const found = [
      ...dialogOf(work).matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/g),
    ].map((m) => [text(m[1]), attr(m[0], "href")]);
    assert.deepEqual(found, links, work);
  }
});

test("D5: the three documentation links point to docs.unlibra.com", () => {
  // The works' links (the footer links to the docs site's top since ui-revise).
  const main = top.match(/<main[\s>][\s\S]*?<\/main>/)[0];
  const docs = hrefs(main).filter((href) => /docs|github\.io/.test(href));
  assert.deepEqual(docs.sort(), [
    "https://docs.unlibra.com/i18n-tiny/astro/introduction",
    "https://docs.unlibra.com/i18n-tiny/next/introduction",
    "https://docs.unlibra.com/tkinter-unblur/",
  ]);
});

/** Source files tracked or untracked-but-not-ignored, outside docs/ and tests/. */
const sourceTextFiles = () =>
  execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root, encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean)
    .filter((p) => existsSync(join(root, p)))
    .filter((p) => !p.startsWith("docs/") && !p.startsWith("tests/"))
    .filter((p) => !/\.(png|webp|jpe?g|gif|ico|woff2?)$/i.test(p));

const distTextFiles = () =>
  globSync("**/*.{html,xml,txt,js,css,json,svg}", { cwd: dist })
    .concat(["_headers"])
    .map((p) => p.split(sep).join("/"));

test("D5: no unlibra.github.io URLs remain in the source and dist/", () => {
  const pattern = /unlibra\.github\.io/;
  const found = (base, files) =>
    files.filter((p) => pattern.test(readFileSync(join(base, p), "utf8")));
  assert.deepEqual(found(dist, distTextFiles()), []);
  assert.deepEqual(found(root, sourceTextFiles()), []);
});

/** All files under a directory as posix-style relative paths. */
const allFiles = (base, dir) =>
  globSync(`${dir}/**/*`, { cwd: base })
    .filter((p) => statSync(join(base, p)).isFile())
    .map((p) => p.split(sep).join("/"));

const isText = (p) =>
  p === "_headers" ||
  /\.(astro|ts|js|mjs|css|md|html|xml|txt|json|svg)$/i.test(p);

test("D6: the removed works and X-style wording do not remain in src/ and dist/", () => {
  // `/lab` links and tool IDs contain none of these.
  const pattern = /liblab|lib lab|iromide|イロマイド|Xオマージュ|パロディ/i;
  const found = [
    ...allFiles(root, "src").map((p) => [root, p]),
    ...allFiles(dist, ".").map((p) => [dist, p]),
  ].filter(
    ([base, p]) =>
      pattern.test(p) ||
      (isText(p) && pattern.test(readFileSync(join(base, p), "utf8"))),
  );
  assert.deepEqual(
    found.map(([base, p]) => (base === dist ? `dist/${p}` : p)),
    [],
  );
});

test("D6: the X-style page parts and tokens are removed", () => {
  for (const marker of [
    /id="share-btn"/,
    /role="tablist"/,
    /end-of-timeline/,
    /pinned/,
    /Updated/,
  ]) {
    assert.doesNotMatch(top, marker);
  }

  const css = globSync("_astro/*.css", { cwd: dist })
    .map((p) => readDist(p))
    .join("\n");
  assert.ok(css.length > 0, "no CSS in dist/_astro");
  assert.doesNotMatch(
    css,
    /--color-(base|accent)-|--text-x-|\.pinned-label|pinned-mode/,
  );

  for (const path of [
    "src/assets/icon.svg",
    "src/components/icons/ShareIcon.astro",
    "src/components/icons/ParodyIcon.astro",
    "src/components/icons/PinIcon.astro",
    "src/components/icons/CalendarIcon.astro",
    "src/components/icons/LocationIcon.astro",
  ]) {
    assert.equal(existsSync(join(root, path)), false, path);
  }
});

test("ui-revise2 9: the privacy policy's contact is the community repository", () => {
  const privacy = readDist("privacy/index.html");
  const main = privacy.match(/<main[\s>][\s\S]*?<\/main>/)[0];
  const contact = main.match(
    /8\. お問い合わせ<\/h2>([\s\S]*?)(<h2|<\/main>|<\/article>)/,
  );
  assert.ok(contact, "no section 8");
  assert.deepEqual(hrefs(contact[1]), ["https://github.com/unlibra/community"]);
  assert.ok(!hrefs(main).includes("https://github.com/unlibra"));
});

/** The content of a <meta name="..."> or <meta property="..."> tag. */
const metaOf = (html, key, name) =>
  attr(
    html.match(new RegExp(`<meta[^>]*${key}="${name}"[^>]*>`))[0],
    "content",
  );

test("ui-revise2 (parent): the privacy policy names the site and its update date", () => {
  const privacy = readDist("privacy/index.html");
  const description = metaOf(privacy, "name", "description");
  assert.match(description, /^unlibra のプライバシーポリシーです。/);
  assert.equal(metaOf(privacy, "property", "og:description"), description);
  assert.match(privacy, /<strong>最終更新日：<\/strong> 2026年10月22日<\/p>/);
});

test("ui-revise2 (parent): the top page's description is the footer's description", () => {
  const footer = top.match(/<footer[\s>][\s\S]*?<\/footer>/)[0];
  const text = footer.match(/<p class="mt-3[^"]*">([^<]*)<\/p>/)[1];
  assert.equal(
    text,
    "unlibra の制作物をまとめたサイトです。自作キーボード、ライブラリ、アプリ、VR &amp; 3D の作品を掲載しています。",
  );
  for (const [key, name] of [
    ["name", "description"],
    ["property", "og:description"],
    ["name", "twitter:description"],
  ]) {
    assert.equal(metaOf(top, key, name), text, name);
  }
});
