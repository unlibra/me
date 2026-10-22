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
/** The BOOTH product added in ui-revise3 (the user's instruction). */
const MURURU_ITEM = "https://unlibra-twin.booth.pm/items/9009879";
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

/** Heroicons "arrow-up-right" and "chevron-right" (24 outline). */
const ARROW = "m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25";
const CHEVRON = "m8.25 4.5 7.5 7.5-7.5 7.5";

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

test("ui-revise3 1, ui-revise4 1: the hero has the h1 in the body font and the GitHub and BOOTH text buttons, without the symbol", () => {
  const hero = top.match(/<div[^>]*data-hero[\s\S]*?<\/ul>/)[0];
  // The wave; the brand symbol is gone (ui-revise4 1).
  assert.match(hero, /viewBox="0 0 1440 320"/);
  assert.doesNotMatch(hero, /viewBox="0 0 512 512"/);
  // The main text is the page's only h1, in the body font (no font-brand,
  // not a logotype).
  const h1 = hero.match(/<h1([^>]*)>([^<]*)<\/h1>/);
  assert.equal(h1[2].trim(), "昼はカフェ。夜はバー。");
  assert.doesNotMatch(h1[1], /font-brand|data-logotype/);
  // text-2xl at every width (ui-revise4 1).
  const sizes = attr(`<h1${h1[1]}>`, "class")
    .split(/\s+/)
    .filter((name) => /(^|:)text-(xs|sm|base|lg|\dxl)$/.test(name));
  assert.deepEqual(sizes, ["text-2xl"]);
  assert.equal(top.match(/<h1[\s>]/g).length, 1);
  // The former logotype and subtitle are gone.
  assert.doesNotMatch(hero, />\s*unlibra\s*</);
  assert.ok(!top.includes("昼はカフェ、夜はバー。"));
  // The buttons below the text: GitHub and BOOTH (site.links), new tabs.
  const links = hero.slice(hero.indexOf("</h1>"));
  const anchors = [...links.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/g)];
  assert.deepEqual(
    anchors.map((m) => [text(m[1]), attr(m[0], "href")]),
    [
      ["GitHub", "https://github.com/unlibra"],
      ["BOOTH", SHOP],
    ],
  );
  for (const [tag] of anchors) {
    assert.match(tag, /target="_blank"/);
    assert.match(tag, /rel="noopener noreferrer"/);
    // Text buttons (pattern B, ui-revise4 1): the text and the up-right
    // arrow, without the former pill's background and ring.
    assert.equal(tag.split(ARROW).length - 1, 1, tag);
    const cls = attr(tag, "class").split(/\s+/);
    assert.ok(
      !cls.some((name) => /^(dark:)?(bg-|ring-|rounded-full)/.test(name)),
      tag,
    );
  }
});

test("ui-revise 3: no page has sponsor or share buttons; the footer keeps the donate link", () => {
  const pages = globSync("**/*.html", { cwd: dist });
  assert.ok(pages.length >= 11, "self-check of the page list");
  for (const page of pages) {
    const html = readDist(page);
    if (page === "404.html") {
      // No footer since not-found, and no sponsor or share button either.
      assert.doesNotMatch(html, /<footer[\s>]|ofuse\.me|navigator\.share/);
      continue;
    }
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

test("ui-revise 5, ui-revise3 1: the only GitHub link in main is the hero's button", () => {
  const main = top.match(/<main[\s>][\s\S]*?<\/main>/)[0];
  const hero = main.match(/<div[^>]*data-hero[\s\S]*?<\/ul>/)[0];
  assert.deepEqual(
    hrefs(main).filter((href) => href.includes("github.com")),
    ["https://github.com/unlibra"],
  );
  assert.ok(hrefs(hero).includes("https://github.com/unlibra"));
});

/** The <a> elements in a piece of HTML (`tag`), with their text. */
const linksIn = (html) =>
  [...html.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({
    tag: m[0],
    label: text(m[1]),
    href: attr(m[0], "href"),
  }));

/** A card's title link (the cards that go to a link), or undefined. */
const titleLinkOf = (card) =>
  linksIn(card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)[1])[0];

/** The <a> elements of a card's actions (outside the title). */
const actionsOf = (card) =>
  linksIn(card.replace(/<h3[\s\S]*?<\/h3>/, "")).filter(({ tag }) =>
    /data-work-action/.test(tag),
  );

test("D3, ui-revise4 2: each app card links to its tool, in the same tab", () => {
  const cards = cardsOf(sectionOf("apps"));
  assert.deepEqual(
    cards.map((card) => attr(card, "data-work")),
    TOOLS,
  );
  for (const [i, card] of cards.entries()) {
    const link = titleLinkOf(card);
    assert.equal(link.href, `/lab/${TOOLS[i]}`, TOOLS[i]);
    // Internal links open in the same tab.
    assert.doesNotMatch(link.tag, /target=/, TOOLS[i]);
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

test("ui-revise4 2: the Apps cards have the former tool site's card texts", () => {
  // liblab frontend/src/messages/ja/tools.ts: the tool's name, and its
  // description without the line breaks (tool-card.tsx replaces /\r?\n/g
  // with ''), as the former tool cards showed them.
  const liblab = {
    "tw-palette-generator": [
      "TWパレットジェネレーター",
      "指定した色から、TailwindCSSに最適化されたカラーパレットを自動生成。\nコーポレートカラーやブランドカラーをベースに、50〜950まで統一感のある配色を無料で作成できます。",
    ],
    "favicon-generator": [
      "Faviconジェネレーター",
      "無料のFavicon一括生成ツール。PNG、JPEG、SVGなどの画像をアップロードするだけで、Webサイトに必要な全サイズのFaviconとApple Touch Iconを自動生成。\n角丸加工や背景色の設定もブラウザ上で簡単に完了します。",
    ],
    "svg-optimizer": [
      "SVG最適化",
      "無料のSVG最適化・圧縮ツール。品質を保ったままファイルサイズを削減し、Webサイトの読み込み速度を改善。\nブラウザ上で完結するため、セキュアで高速に最適化できます。",
    ],
    "password-generator": [
      "パスワードジェネレーター",
      "無料の強力なパスワード生成ツール。文字数、大文字・小文字・数字・記号を自由に組み合わせて、セキュアなパスワードを作成。\n紛らわしい文字の除外にも対応し、ブラウザ完結で安全です。",
    ],
  };
  for (const card of cardsOf(sectionOf("apps"))) {
    const work = attr(card, "data-work");
    const [name, description] = liblab[work];
    const title = card.match(/<span id="work-[^"]+-name">([^<]*)<\/span>/)[1];
    assert.equal(title, name, work);
    const summary = card.match(/<p[^>]*data-work-summary[^>]*>([^<]*)<\/p>/)[1];
    assert.equal(summary, description.replace(/\r?\n/g, ""), work);
  }
});

test("ui-revise4 2: VR & 3D has the real product only, without subcategories or dummies", () => {
  const section = sectionOf("vr-3d");
  const cards = cardsOf(section);
  assert.deepEqual(
    cards.map((card) => attr(card, "data-work")),
    ["mururu-blink-lipsync"],
  );
  // No subcategory label or attribute anywhere on the page.
  assert.doesNotMatch(top, /data-subcategory/);
  const body = text(top.match(/<body[\s\S]*<\/body>/)[0]);
  for (const label of ["アバター", "アセット", "Unityツール", "ダミー"]) {
    assert.ok(!body.includes(label), label);
  }
  assert.ok(!existsSync(join(root, "src/assets/works/dummy.svg")));
  assert.equal(globSync("_astro/dummy*", { cwd: dist }).length, 0);
  // No subcategory in the data or the messages.
  const works = readFileSync(join(root, "src/config/works.ts"), "utf8");
  const ja = readFileSync(join(root, "src/messages/ja.ts"), "utf8");
  for (const source of [works, ja]) {
    assert.doesNotMatch(source, /subcategor|dummy/i);
  }
  // No shop link outside the cards (it was beside the heading until
  // ui-revise3).
  const outside = section.replace(/<article[\s\S]*?<\/article>/g, "");
  assert.ok(outside.includes('id="vr-3d-heading"'), "self-check");
  assert.deepEqual(hrefs(outside), [], "links outside the cards");
  assert.ok(!top.includes("BOOTH ショップ"));
});

test("ui-revise3 (user), ui-revise4 2: the BOOTH product: its card, link and image", () => {
  const work = "mururu-blink-lipsync";
  const card = cardsOf(sectionOf("vr-3d"))[0];
  assert.equal(attr(card, "data-work"), work);
  assert.equal(attr(card, "data-card"), "frame");
  const title = "【ムルル対応】まばたき＆リップシンク追加ツール";
  assert.match(
    card,
    new RegExp(`<span id="work-${work}-name">${title}</span>`),
  );
  assert.match(
    card,
    /<p[^>]*data-work-summary[^>]*>ムルルにまばたきとリップシンクを追加する Unity ツール<\/p>/,
  );
  // The card goes to the item on BOOTH, in a new tab, with no other action.
  const link = titleLinkOf(card);
  assert.equal(link.href, MURURU_ITEM);
  assert.match(link.tag, /target="_blank"/);
  assert.match(link.tag, /rel="noopener noreferrer"/);
  assert.deepEqual(actionsOf(card), []);
  assert.doesNotMatch(top, new RegExp(`data-work-dialog="${work}"`));

  // The image: the file from the third-party directory (LICENSE section 3),
  // kept in view at the top, where its credit is.
  const source = join(
    root,
    "src/assets/works/third-party/mururu-blink-lipsync.webp",
  );
  assert.ok(existsSync(source));
  const img = card.match(/<img\s[^>]*>/)[0];
  const src = attr(img, "src");
  assert.match(src, /^\/_astro\/mururu-blink-lipsync\.[\w-]+\.webp$/);
  assert.ok(existsSync(join(dist, src.slice(1))), src);
  assert.equal(attr(img, "width"), "1200");
  assert.equal(attr(img, "height"), "1200");
  assert.ok(attr(img, "class").split(/\s+/).includes("object-top"), img);
  // The other photos are cropped around the center as before.
  const other = cardsOf(sectionOf("keyboards"))[1].match(/<img\s[^>]*>/)[0];
  assert.ok(attr(other, "class").split(/\s+/).includes("object-center"));
});

test("ui-revise4 2: every card has the same hover; no photo zooms and no card lifts", async () => {
  const { cardHover } = await import("../src/components/works/card-classes.ts");
  // liblab tool-card.tsx: transition-colors hover:bg-gray-100
  // dark:hover:bg-atom-one-dark-light (and the same on keyboard focus).
  for (const name of [
    "transition-colors",
    "hover:bg-gray-100",
    "dark:hover:bg-atom-one-dark-light",
  ]) {
    assert.ok(cardHover.split(/\s+/).includes(name), name);
  }
  const cards = cardsOf(top);
  const kinds = new Set();
  for (const card of cards) {
    const work = attr(card, "data-work");
    kinds.add(attr(card, "data-card"));
    const cls = attr(card.match(/<article[^>]*>/)[0], "class").split(/\s+/);
    for (const name of cardHover.split(/\s+/)) {
      assert.ok(cls.includes(name), `${work}: ${name}`);
    }
    assert.ok(cls.includes("relative"), work);
    // No other hover: no lift, shadow or border change on the card, and no
    // zoom or transition on the photo.
    assert.ok(
      !cls.some((name) =>
        /translate|shadow|hover:border|^transition$/.test(name),
      ),
      work,
    );
    for (const img of card.match(/<img\s[^>]*>/g)) {
      // (The logos' static crop, scale-[2.25], is not a hover.)
      assert.doesNotMatch(attr(img, "class"), /hover:|transition/, work);
    }
  }
  assert.deepEqual([...kinds].sort(), ["featured", "frame", "tool"]);
  // The data has no flag for the zoom any more.
  const works = readFileSync(join(root, "src/config/works.ts"), "utf8");
  assert.doesNotMatch(works, /thirdPartyImage/);
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
        // The icon on its background (the cards' radius since ui-revise3).
        assert.match(card, /\brounded-card\b[^"]*"><img/, work);
        assert.doesNotMatch(card, /aspect-4\/3/, work);
      } else {
        assert.match(card, /<div class="aspect-4\/3[^"]*"><img/, work);
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

test("ui-revise4 3: no card and no details show a year", () => {
  const main = top.match(/<main[\s>][\s\S]*?<\/main>/)[0];
  assert.doesNotMatch(main, /<time[\s>]/);
  for (const card of cardsOf(main)) {
    assert.doesNotMatch(text(card), /\b20\d\d\b/, attr(card, "data-work"));
  }
  for (const dialog of main.match(/<dialog[\s\S]*?<\/dialog>/g)) {
    assert.doesNotMatch(text(dialog), /\b20\d\d\b/);
  }
  const works = readFileSync(join(root, "src/config/works.ts"), "utf8");
  assert.doesNotMatch(works, /\byear\b/);
});

test("ui-revise2 3, ui-revise4 2: the DIY Keyboards cards open their details; the other cards have none", () => {
  const cards = cardsOf(top);
  assert.equal(cards.length, 12, "self-check of the work count");
  const keyboards = new Set(
    cardsOf(sectionOf("keyboards")).map((card) => attr(card, "data-work")),
  );
  assert.equal(keyboards.size, 4, "self-check");
  const dialogs = [...top.matchAll(/<dialog[^>]*data-work-dialog="([^"]+)"/g)];
  assert.deepEqual(dialogs.map((m) => m[1]).sort(), [...keyboards].sort());
  for (const card of cards) {
    const work = attr(card, "data-work");
    // Card images are decorative: the title is the heading beside them.
    for (const img of card.match(/<img\s[^>]*>/g)) {
      // Astro writes an empty alt as a bare `alt`.
      assert.match(img, /\salt(="")?[\s>]/, work);
    }
    // The summary: one short line on the card.
    const summary = card.match(/<p[^>]*data-work-summary[^>]*>([^<]*)<\/p>/);
    assert.ok(summary, `${work}: summary`);
    assert.ok(summary[1].trim() !== "" && !summary[1].includes("\n"), work);

    if (!keyboards.has(work)) {
      // A link card: no button, no "詳しく見る", no dialog.
      assert.doesNotMatch(card, /<button[\s>]|data-work-more|詳しく見る/, work);
      continue;
    }
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
    // "詳しく見る" opens the details, not a link: no arrow (ui-revise4 2).
    assert.match(
      card,
      new RegExp(
        `<p id="work-${work}-more"[^>]*aria-hidden="true"[^>]*data-work-more[^>]*>\\s*詳しく見る\\s*</p>`,
      ),
      work,
    );
    assert.deepEqual(linksIn(card), [], `${work}: no links`);
    // The description (several lines) is in the details only.
    const description = dialog.match(
      /<p[^>]*data-work-description[^>]*>([^<]*)<\/p>/,
    )[1];
    assert.ok(description.length > summary[1].length, `${work}: description`);
    assert.ok(!card.includes(description.trim()), `${work}: not on the card`);

    // The dialog: closed, named by the work's title, with a close button,
    // and no links (DIY Keyboards have none).
    const open = dialog.match(/<dialog[^>]*>/)[0];
    assert.equal(attr(open, "id"), `work-${work}`, work);
    assert.doesNotMatch(open, /\sopen(?=[\s=>])/, work);
    const titleId = attr(open, "aria-labelledby");
    const heading = dialog.match(
      new RegExp(`<h2 id="${titleId}"[^>]*>([\\s\\S]*?)</h2>`),
    );
    assert.equal(text(heading[1]), title, work);
    assert.match(dialog, /<button[^>]*aria-label="閉じる"[^>]*data-work-close/);
    assert.deepEqual(linksIn(dialog), [], `${work}: dialog links`);
  }
});

test("ui-revise4 2: a card goes to its place directly; actions only where there are two places", () => {
  const npm = (name) => `https://www.npmjs.com/package/@i18n-tiny/${name}`;
  const docs = "https://docs.unlibra.com";
  // [the title link, the actions]
  const expected = {
    "i18n-tiny-astro": [
      `${docs}/i18n-tiny/astro/introduction`,
      [
        ["ドキュメント", `${docs}/i18n-tiny/astro/introduction`],
        ["npm", npm("astro")],
      ],
    ],
    "i18n-tiny-next": [
      `${docs}/i18n-tiny/next/introduction`,
      [
        ["ドキュメント", `${docs}/i18n-tiny/next/introduction`],
        ["npm", npm("next")],
      ],
    ],
    "tkinter-unblur": [
      `${docs}/tkinter-unblur/`,
      [
        ["ドキュメント", `${docs}/tkinter-unblur/`],
        ["PyPI", "https://pypi.org/project/tkinter-unblur"],
      ],
    ],
    ...Object.fromEntries(TOOLS.map((tool) => [tool, [`/lab/${tool}`, []]])),
    "mururu-blink-lipsync": [MURURU_ITEM, []],
  };
  const cards = cardsOf(top).filter(
    (card) => !cardsOf(sectionOf("keyboards")).includes(card),
  );
  assert.deepEqual(
    cards.map((card) => attr(card, "data-work")).sort(),
    Object.keys(expected).sort(),
  );
  for (const card of cards) {
    const work = attr(card, "data-work");
    const [href, actions] = expected[work];
    // The title is the link; its ::after covers the card, so a click
    // anywhere on the card goes there.
    const link = titleLinkOf(card);
    assert.equal(link.href, href, work);
    assert.match(link.tag, /after:absolute after:inset-0/, work);
    assert.match(card, /<h3[^>]*data-work-title[^>]*><a\s/, work);
    assert.match(link.tag, new RegExp(`<span id="work-${work}-name">`), work);
    const found = actionsOf(card);
    assert.deepEqual(
      found.map(({ label, href }) => [label, href]),
      actions,
      work,
    );
    for (const { tag, href } of [link, ...found]) {
      if (href.startsWith("https://")) {
        assert.match(tag, /target="_blank"/, work);
        assert.match(tag, /rel="noopener noreferrer"/, work);
      } else {
        assert.doesNotMatch(tag, /target=/, work);
      }
    }
    for (const { tag } of found) {
      // In front of the title link's overlay, so that a click goes there
      // directly; described by the work's title.
      const cls = attr(tag, "class").split(/\s+/);
      assert.ok(cls.includes("relative") && cls.includes("z-10"), work);
      assert.equal(attr(tag, "aria-describedby"), `work-${work}-name`, work);
    }
    // All links are in one row; no row when there are no actions.
    const row = card.match(/<div[^>]*data-work-links[\s\S]*?<\/div>/);
    assert.equal(Boolean(row), actions.length > 0, work);
  }
});

test("ui-revise4 2: the links have the up-right arrow, not the chevron; 詳しく見る has none", () => {
  const main = top.match(/<main[\s>][\s\S]*?<\/main>/)[0];
  assert.ok(!main.includes(CHEVRON), "no chevron in main");
  assert.ok(
    !existsSync(join(root, "src/components/icons/ChevronRightIcon.astro")),
  );
  let links = 0;
  for (const card of cardsOf(main)) {
    const work = attr(card, "data-work");
    for (const { tag } of [titleLinkOf(card), ...actionsOf(card)].filter(
      Boolean,
    )) {
      // `tag` is the whole <a> element.
      assert.equal(tag.split(ARROW).length - 1, 1, `${work}: arrow`);
      links++;
    }
    const more = card.match(/<p[^>]*data-work-more[\s\S]*?<\/p>/);
    if (more) assert.doesNotMatch(more[0], /<svg/, `${work}: more`);
  }
  assert.equal(links, 8 + 6, "self-check: 8 title links and 6 actions");
});

test("ui-revise3 3: the photo cards and the list items share the title, summary, link, radius and focus classes", async () => {
  const classes = await import("../src/components/works/card-classes.ts");
  const has = (tag, list, what) => {
    const cls = attr(tag, "class").split(/\s+/);
    for (const name of list.split(/\s+/)) {
      assert.ok(cls.includes(name), `${what}: ${name}`);
    }
  };
  const kinds = new Set();
  for (const card of cardsOf(top)) {
    const work = attr(card, "data-work");
    kinds.add(attr(card, "data-card"));
    has(card.match(/<h3[^>]*>/)[0], classes.cardTitle, `${work} title`);
    has(
      card.match(/<p[^>]*data-work-summary[^>]*>/)[0],
      classes.cardSummary,
      `${work} summary`,
    );
    const more = card.match(/<p[^>]*data-work-more[^>]*>/);
    if (more) has(more[0], classes.cardLink, `${work} more`);
    for (const { tag } of actionsOf(card)) {
      has(tag, classes.cardLink, `${work} action`);
      has(tag, classes.focusRing, `${work} action focus`);
    }
    // The photo cards and the list items have the card radius; the list
    // items' icon backgrounds too.
    has(card.match(/<article[^>]*>/)[0], classes.cardRadius, `${work} card`);
    if (attr(card, "data-card") === "tool") {
      has(
        card.match(/<div[^>]*>(?=<img)/)[0],
        classes.cardRadius,
        `${work} icon`,
      );
    }
  }
  assert.deepEqual([...kinds].sort(), ["featured", "frame", "tool"]);
  assert.equal(classes.cardRadius, "rounded-card");
  // The token is one value in the theme.
  const css = readFileSync(join(root, "src/styles/global.css"), "utf8");
  assert.match(css, /--radius-card:\s*0\.5rem;/);
});

test("ui-revise3 3: the list items take the former tool site's card padding and icon color", () => {
  for (const id of ["libraries", "apps"]) {
    for (const card of cardsOf(sectionOf(id))) {
      const work = attr(card, "data-work");
      const cls = attr(card.match(/<article[^>]*>/)[0], "class").split(/\s+/);
      // tool-card.tsx: p-4 rounded-lg.
      assert.ok(cls.includes("p-4"), work);
    }
  }
  // The apps' icons on the former tools' color.
  for (const card of cardsOf(sectionOf("apps"))) {
    assert.match(card, /bg-logo-medium\/70[^"]*"><img/);
  }
});

test("D5: the three documentation links point to docs.unlibra.com", () => {
  // The works' links (the footer links to the docs site's top since ui-revise).
  // Each is on the work's card twice: the title link and the action
  // (ui-revise4 2).
  const main = top.match(/<main[\s>][\s\S]*?<\/main>/)[0];
  const expected = [
    "https://docs.unlibra.com/i18n-tiny/astro/introduction",
    "https://docs.unlibra.com/i18n-tiny/next/introduction",
    "https://docs.unlibra.com/tkinter-unblur/",
  ];
  const docsIn = (html) =>
    hrefs(html)
      .filter((href) => /docs|github\.io/.test(href))
      .sort();
  assert.deepEqual(docsIn(main), [...expected, ...expected].sort());
  assert.deepEqual(docsIn(cardsOf(main).join("")), docsIn(main));
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

test("ui-revise3 2: the top page's description is the footer's description", () => {
  const footer = top.match(/<footer[\s>][\s\S]*?<\/footer>/)[0];
  const text = footer.match(/<p class="mt-3[^"]*">([^<]*)<\/p>/)[1];
  assert.equal(
    text,
    "個人開発のプロダクトを掲載しているサイトです。昼は本業のビルダー、夜は自作キーボード、ライブラリ、アプリ、VR &amp; 3Dなどの個人開発をしています。",
  );
  for (const [key, name] of [
    ["name", "description"],
    ["property", "og:description"],
    ["name", "twitter:description"],
  ]) {
    assert.equal(metaOf(top, key, name), text, name);
  }
});
