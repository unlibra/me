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

/**
 * The former arrow (Heroicons "arrow-up-right", 24 outline), the arrow since
 * ui-revise5 6 (a path of Lucide "move-up-right") and Heroicons
 * "chevron-right".
 */
const HEROICONS_ARROW = "m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25";
const ARROW = 'd="M19 5L5 19"';
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

test("ui-revise3 1, ui-revise4 1, ui-revise5 1: the hero has the h1 in the body font and the GitHub and BOOTH text buttons with their logos, without the symbol", () => {
  const hero = top.match(/<div[^>]*data-hero[\s\S]*?<\/ul>/)[0];
  // The wave; the brand symbol is gone (ui-revise4 1).
  assert.match(hero, /viewBox="0 0 1440 320"/);
  assert.doesNotMatch(hero, /viewBox="0 0 512 512"/);
  // The main text is the page's only h1, in the body font (no font-brand,
  // not a logotype).
  const h1 = hero.match(/<h1([^>]*)>([^<]*)<\/h1>/);
  assert.equal(h1[2].trim(), "昼はカフェ。夜はバー。");
  assert.doesNotMatch(h1[1], /font-brand|data-logotype/);
  // 28px (1.75rem) at every width (ui-revise5; text-2xl since ui-revise4 1).
  const sizes = attr(`<h1${h1[1]}>`, "class")
    .split(/\s+/)
    .filter((name) =>
      /(^|:)text-(xs|sm|base|lg|\dxl|\[[^\]]+\])(\/\S+)?$/.test(name),
    );
  assert.deepEqual(sizes, ["text-[1.75rem]/9"]);
  assert.equal(top.match(/<h1[\s>]/g).length, 1);
  // The former logotype and subtitle are gone.
  assert.doesNotMatch(hero, />\s*unlibra\s*</);
  assert.ok(!top.includes("昼はカフェ、夜はバー。"));
  // The buttons below the text: GitHub and BOOTH (site.links), new tabs.
  const links = hero.slice(hero.indexOf("</h1>"));
  // The GitHub mark as in the former footer (GitHubIcon.astro), and
  // Lucide's box (lucide-static 1.52.0, chosen in ui-revise5) as it is in
  // the package.
  assert.match(links, /viewBox="0 0 98 96"[^>]*data-icon="github"/);
  const lucide = readFileSync(
    join(root, "node_modules/lucide-static/icons/box.svg"),
    "utf8",
  );
  const paths = (svg) => [...svg.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]);
  const bag = links.match(/<svg[^>]*data-icon="box"[\s\S]*?<\/svg>/)[0];
  assert.deepEqual(paths(bag), paths(lucide));
  assert.equal(paths(bag).length, 3);
  const anchors = [...links.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/g)];
  assert.deepEqual(
    anchors.map((m) => [text(m[1]), attr(m[0], "href")]),
    [
      ["GitHub", "https://github.com/unlibra"],
      ["BOOTH", SHOP],
    ],
  );
  for (const [i, [tag, inner]] of anchors.entries()) {
    assert.match(tag, /target="_blank"/);
    assert.match(tag, /rel="noopener noreferrer"/);
    // Text buttons (pattern A, ui-revise5 1): the logo, then the text; no
    // up-right arrow, and without the former pill's background and ring.
    // GitHub has its mark, BOOTH Lucide's box (not BOOTH's logo).
    const icons = [...inner.matchAll(/<svg[^>]*data-icon="([^"]+)"/g)];
    assert.deepEqual(
      icons.map((m) => m[1]),
      [["github", "box"][i]],
      tag,
    );
    assert.ok(inner.trim().startsWith("<svg"), `${tag}: the logo first`);
    assert.ok(!tag.includes(ARROW), tag);
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

test("ui-revise4 2, ui-revise6 2: the Apps cards have the former tool site's names, and summaries shortened from its card texts", () => {
  // liblab frontend/src/messages/ja/tools.ts: the tool's name, and its
  // description, which the former tool cards showed without the line breaks
  // (tool-card.tsx replaces /\r?\n/g with ''). Since ui-revise6 2 the
  // summaries are shorter (about two lines; the E2E counts the lines).
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
    assert.notEqual(summary.trim(), "", work);
    assert.ok(
      summary.length < description.replace(/\r?\n/g, "").length,
      `${work}: not shortened`,
    );
  }
});

test("ui-revise4 2: VR & 3D has the real product only, without subcategories or dummies", () => {
  const section = sectionOf("vr-3d");
  const cards = cardsOf(section);
  assert.deepEqual(
    cards.map((card) => attr(card, "data-work")),
    ["mururu-blink-lipsync"],
  );
  // No subcategory label or attribute anywhere on the page. The footer's
  // description (the owner's words, ui-revise6 1) names VR avatars and 3D
  // assets, which are not labels: it is left out.
  assert.doesNotMatch(top, /data-subcategory/);
  const body = text(
    top
      .match(/<body[\s\S]*<\/body>/)[0]
      .replace(/<footer[\s>][\s\S]*?<\/footer>/, ""),
  );
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

test("ui-revise3 (user), ui-revise4 2, ui-revise5 5: the BOOTH product: its card, links and image", () => {
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
  // The card goes to the item on BOOTH, in a new tab. The text links are
  // "BOOTH で見る" (where the card goes) and the documentation (ui-revise5 5).
  const link = titleLinkOf(card);
  assert.equal(link.href, MURURU_ITEM);
  assert.match(link.tag, /target="_blank"/);
  assert.match(link.tag, /rel="noopener noreferrer"/);
  assert.deepEqual(
    actionsOf(card).map(({ label, href }) => [label, href]),
    [
      ["BOOTH で見る", MURURU_ITEM],
      ["ドキュメント", "https://docs.unlibra.com/mururu-blink-lipsync/"],
    ],
  );
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
  const { cardHover, featuredSurface } =
    await import("../src/components/works/card-classes.ts");
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
    // The large card has its own light gray surface, one step darker (or
    // lighter in dark mode) on hover, with the same transition (ui-revise5).
    const hover =
      attr(card, "data-card") === "featured" ? featuredSurface : cardHover;
    for (const name of hover.split(/\s+/)) {
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
        // The icon on its background: the cards' radius since ui-revise3,
        // a circle for Apps since ui-revise5 (6).
        const shape = id === "apps" ? "rounded-full" : "rounded-card";
        assert.match(card, new RegExp(`\\b${shape}\\b[^"]*"><img`), work);
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
    // Its text is in the span with the underline (ui-revise5 5).
    assert.match(
      card,
      new RegExp(
        `<p id="work-${work}-more"[^>]*aria-hidden="true"[^>]*data-work-more[^>]*>\\s*<span[^>]*data-link-text[^>]*>\\s*詳しく見る\\s*</span>\\s*</p>`,
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

test("ui-revise4 2, ui-revise5 9, 10, 11: a card goes to its first link; every link is an action, the first one first", () => {
  const npm = (name) => `https://www.npmjs.com/package/@i18n-tiny/${name}`;
  const docs = "https://docs.unlibra.com";
  // The actions, in order; the title link goes to the first.
  const expected = {
    "i18n-tiny-astro": [
      ["npm", npm("astro")],
      ["ドキュメント", `${docs}/i18n-tiny/astro/introduction`],
    ],
    "i18n-tiny-next": [
      ["npm", npm("next")],
      ["ドキュメント", `${docs}/i18n-tiny/next/introduction`],
    ],
    "tkinter-unblur": [
      ["PyPI", "https://pypi.org/project/tkinter-unblur"],
      ["ドキュメント", `${docs}/tkinter-unblur/`],
    ],
    ...Object.fromEntries(
      TOOLS.map((tool) => [tool, [["アプリを開く", `/lab/${tool}`]]]),
    ),
    "mururu-blink-lipsync": [
      ["BOOTH で見る", MURURU_ITEM],
      ["ドキュメント", `${docs}/mururu-blink-lipsync/`],
    ],
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
    const actions = expected[work];
    // The title is the link to the first action's place; its ::after
    // covers the card, so a click anywhere on the card goes there.
    const link = titleLinkOf(card);
    assert.equal(link.href, actions[0][1], work);
    assert.match(link.tag, /after:absolute after:inset-0/, work);
    assert.match(card, /<h3[^>]*data-work-title[^>]*><a\s/, work);
    assert.match(link.tag, new RegExp(`<span id="work-${work}-name">`), work);
    const found = actionsOf(card);
    assert.deepEqual(
      found.map(({ label, href }) => [label, href]),
      actions,
      work,
    );
    // The first action is marked as the card's own link (underlined on the
    // card's hover); the others are not.
    assert.deepEqual(
      found.map(({ tag }) => attr(tag, "data-work-action")),
      actions.map((_, i) => (i === 0 ? "primary" : "secondary")),
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
  }
  // "ツールを使う" is gone (ui-revise5 9).
  assert.ok(!top.includes("ツールを使う"));
});

test("ui-revise5 5, 11: the links' text has the growing underline; the first link's also grows on the card's hover", async () => {
  const { linkText, actionText, primaryText } =
    await import("../src/components/works/card-classes.ts");
  // A 1px line under the text that grows from the left, and does not move
  // under prefers-reduced-motion: reduce.
  for (const name of [
    "bg-size-[0%_1px]",
    "bg-position-[0_100%]",
    "transition-[background-size]",
    "motion-reduce:transition-none",
  ]) {
    assert.ok(linkText.split(/\s+/).includes(name), name);
  }
  assert.ok(
    primaryText.split(/\s+/).includes("group-hover:bg-size-[100%_1px]"),
  );
  const has = (tag, list, what) => {
    const cls = attr(tag, "class").split(/\s+/);
    for (const name of list.split(/\s+/)) {
      assert.ok(cls.includes(name), `${what}: ${name}`);
    }
  };
  /** The <span data-link-text> in a piece of HTML. */
  const textOf = (html) => html.match(/<span[^>]*data-link-text[^>]*>/)[0];
  for (const card of cardsOf(top)) {
    const work = attr(card, "data-work");
    const actions = [
      ...card.matchAll(/<a\s[^>]*data-work-action="(\w+)"[\s\S]*?<\/a>/g),
    ];
    for (const [html, kind] of actions) {
      // No text-decoration underline; no arrow that moves.
      assert.doesNotMatch(attr(html, "class"), /underline/, work);
      assert.doesNotMatch(html, /translate/, work);
      const span = textOf(html);
      has(span, `${linkText} ${actionText}`, `${work} ${kind}`);
      assert.equal(
        attr(span, "class").includes("group-hover:bg-size"),
        kind === "primary",
        `${work} ${kind}`,
      );
    }
    // The first link: the action the card goes to, or "詳しく見る".
    const more = card.match(/<p[^>]*data-work-more[\s\S]*?<\/p>/);
    if (more) has(textOf(more[0]), `${linkText} ${primaryText}`, work);
    else has(textOf(actions[0][0]), primaryText, work);
  }
});

test("ui-revise4 2, ui-revise5 2, 6: the actions have Lucide's up-right arrow, not the chevron; the titles and 詳しく見る have none", () => {
  const main = top.match(/<main[\s>][\s\S]*?<\/main>/)[0];
  assert.ok(!main.includes(CHEVRON), "no chevron in main");
  // Lucide "move-up-right" from lucide-static 1.52.0, in place of
  // Heroicons "arrow-up-right" (ui-revise5 6).
  assert.ok(!main.includes(HEROICONS_ARROW), "no Heroicons arrow");
  assert.ok(
    !existsSync(join(root, "src/components/icons/ArrowUpRightIcon.astro")),
  );
  const lucide = readFileSync(
    join(root, "node_modules/lucide-static/icons/move-up-right.svg"),
    "utf8",
  );
  const icon = readFileSync(
    join(root, "src/components/icons/MoveUpRightIcon.astro"),
    "utf8",
  );
  const paths = (svg) => [...svg.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(paths(icon), paths(lucide));
  assert.ok(lucide.includes(ARROW));
  assert.ok(
    !existsSync(join(root, "src/components/icons/ChevronRightIcon.astro")),
  );
  let links = 0;
  for (const card of cardsOf(main)) {
    const work = attr(card, "data-work");
    // No arrow (no icon at all) in the title (ui-revise5 2).
    const title = card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)[1];
    assert.doesNotMatch(title, /<svg/, `${work}: title`);
    for (const { tag } of actionsOf(card)) {
      // `tag` is the whole <a> element.
      assert.equal(tag.split(ARROW).length - 1, 1, `${work}: arrow`);
      // The size of the text: 14px (ui-revise5 8).
      const svg = tag.match(/<svg[^>]*>/)[0];
      assert.ok(attr(svg, "class").split(/\s+/).includes("size-3.5"), work);
      links++;
    }
    const more = card.match(/<p[^>]*data-work-more[\s\S]*?<\/p>/);
    if (more) assert.doesNotMatch(more[0], /<svg/, `${work}: more`);
  }
  assert.equal(links, 3 * 2 + 4 + 2, "self-check: the number of actions");
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
    // The photo cards and the list items have the card radius; the
    // Libraries' icon backgrounds too (the Apps' are circles, ui-revise5 6).
    has(card.match(/<article[^>]*>/)[0], classes.cardRadius, `${work} card`);
    if (attr(card, "data-card") === "tool") {
      has(
        card.match(/<div[^>]*>(?=<img)/)[0],
        TOOLS.includes(work) ? "rounded-full" : classes.cardRadius,
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

test("ui-revise5 6, 7, 12: no card and no icon has a border or ring; the Apps' icons are circles", () => {
  const borderOrRing = /^(?:[\w-]+:)*(?:border|ring|outline)(?:-|$)/;
  for (const card of cardsOf(top)) {
    const work = attr(card, "data-work");
    const tag = card.match(/<article[^>]*>/)[0];
    const cls = attr(tag, "class").split(/\s+/);
    assert.ok(!cls.some((name) => borderOrRing.test(name)), `${work}: card`);
    // The image's frame or the icon's background.
    const frame = card.match(/<div[^>]*>(?=<img)/)[0];
    const frameCls = attr(frame, "class").split(/\s+/);
    assert.ok(
      !frameCls.some((name) => borderOrRing.test(name)),
      `${work}: icon`,
    );
    if (TOOLS.includes(work)) {
      assert.ok(frameCls.includes("rounded-full"), `${work}: circle`);
      assert.ok(!frameCls.includes("rounded-card"), `${work}: circle`);
    }
  }
});

test("ui-revise5 (design 4): the large card is a light gray surface with the photo inset in it", async () => {
  const { featuredSurface, cardRadius } =
    await import("../src/components/works/card-classes.ts");
  // Light gray (gray-50), one step darker (gray-100) on hover; in dark mode
  // one step lighter than the page (atom-one-dark-light), and halfway back
  // to the page on hover (for 4.5:1, ui-revise5).
  for (const name of [
    "bg-gray-50",
    "hover:bg-gray-100",
    "dark:bg-atom-one-dark-light",
    "dark:hover:bg-featured-hover-dark",
    "transition-colors",
  ]) {
    assert.ok(featuredSurface.split(/\s+/).includes(name), name);
  }
  const card = cardsOf(top).find((c) => attr(c, "data-card") === "featured");
  const article = attr(card.match(/<article[^>]*>/)[0], "class").split(/\s+/);
  for (const name of ["p-4", "sm:p-6", "gap-6", "md:grid-cols-2"]) {
    assert.ok(article.includes(name), name);
  }
  // The photo's frame has the card radius, inside the padding.
  const frame = attr(card.match(/<div[^>]*>(?=<img)/)[0], "class").split(/\s+/);
  assert.ok(frame.includes(cardRadius));
});

test("ui-revise5 13: the large card has SPOTLIGHT above its title, in text-4xl", () => {
  const featured = cardsOf(top).filter(
    (card) => attr(card, "data-card") === "featured",
  );
  assert.equal(featured.length, 1, "self-check");
  const card = featured[0];
  const spotlight = card.match(/<p[^>]*data-work-spotlight[^>]*>([^<]*)<\/p>/);
  assert.equal(spotlight[1].trim(), "SPOTLIGHT");
  // Right above the title (where the year was until ui-revise4).
  assert.match(
    card,
    /data-work-spotlight[^>]*>[^<]*<\/p>\s*<h3[^>]*data-work-title/,
  );
  const h3 = card.match(/<h3[^>]*>/)[0];
  const sizes = attr(h3, "class")
    .split(/\s+/)
    .filter((name) => /(^|:)text-(xs|sm|base|lg|\dxl)$/.test(name));
  assert.deepEqual(sizes, ["text-4xl"]);
  // Only the large card has it.
  assert.equal(top.match(/data-work-spotlight/g).length, 1);
});

test("ui-revise5 3: the works are 24px further below the hero than the hero's margin", () => {
  const main = top.match(/<main[\s>][\s\S]*?<\/main>/)[0];
  const works = main.match(/<div[^>]*data-works[^>]*>/)[0];
  // Padding, not a margin, so that it does not collapse with the hero's.
  const cls = attr(works, "class").split(/\s+/);
  assert.ok(cls.includes("pt-6"), works);
  assert.ok(!cls.some((name) => /^(?:\w+:)?(?:mt|my|m)-/.test(name)), works);
  // The DIY Keyboards section is the first in it.
  const first = main.slice(main.indexOf(works)).match(/<section[^>]*>/)[0];
  assert.equal(attr(first, "id"), "keyboards");
});

test("D5, ui-revise5 5: the four documentation links point to docs.unlibra.com", () => {
  // The works' links (the footer links to the docs site's top since ui-revise).
  // Each is on the work's card once, as its second action (ui-revise5 10).
  const main = top.match(/<main[\s>][\s\S]*?<\/main>/)[0];
  const expected = [
    "https://docs.unlibra.com/i18n-tiny/astro/introduction",
    "https://docs.unlibra.com/i18n-tiny/next/introduction",
    "https://docs.unlibra.com/mururu-blink-lipsync/",
    "https://docs.unlibra.com/tkinter-unblur/",
  ];
  const docsIn = (html) =>
    hrefs(html)
      .filter((href) => /docs|github\.io/.test(href))
      .sort();
  assert.deepEqual(docsIn(main), expected);
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

test("ui-revise3 2, ui-revise6 1: the top page's description is the footer's description", () => {
  const footer = top.match(/<footer[\s>][\s\S]*?<\/footer>/)[0];
  const text = footer.match(/<p class="mt-3[^"]*">([^<]*)<\/p>/)[1];
  assert.equal(
    text,
    "個人で制作したプロダクトを紹介するサイトです。昼はビルダー。夜は個人開発。自作キーボード、ライブラリ、アプリ、VRアバターや3Dアセットなど、ジャンルにとらわれず自由にものづくりしています。",
  );
  for (const [key, name] of [
    ["name", "description"],
    ["property", "og:description"],
    ["name", "twitter:description"],
  ]) {
    assert.equal(metaOf(top, key, name), text, name);
  }
});
