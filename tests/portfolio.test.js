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

test("ui-revise3 1: the hero has the symbol, the h1 in the body font and the GitHub and BOOTH buttons", () => {
  const hero = top.match(/<div[^>]*data-hero[\s\S]*?<\/ul>/)[0];
  // The wave and the brand symbol.
  assert.match(hero, /viewBox="0 0 1440 320"/);
  assert.match(hero, /<svg[^>]*viewBox="0 0 512 512"/);
  // The main text is the page's only h1, in the body font (no font-brand,
  // not a logotype).
  const h1 = hero.match(/<h1([^>]*)>([^<]*)<\/h1>/);
  assert.equal(h1[2].trim(), "昼はカフェ。夜はバー。");
  assert.doesNotMatch(h1[1], /font-brand|data-logotype/);
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
  }
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

test("ui-revise 5, ui-revise3 1: the only GitHub link in main is the hero's button", () => {
  const main = top.match(/<main[\s>][\s\S]*?<\/main>/)[0];
  const hero = main.match(/<div[^>]*data-hero[\s\S]*?<\/ul>/)[0];
  assert.deepEqual(
    hrefs(main).filter((href) => href.includes("github.com")),
    ["https://github.com/unlibra"],
  );
  assert.ok(hrefs(hero).includes("https://github.com/unlibra"));
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

test("D4: the VR & 3D section has the real product first, then one dummy work per subcategory, without the shop link (ui-revise3 3)", () => {
  const section = sectionOf("vr-3d");
  const cards = cardsOf(section);
  assert.deepEqual(
    cards.map((card) => [
      attr(card, "data-work"),
      attr(card, "data-subcategory"),
    ]),
    [
      ["mururu-blink-lipsync", "unity-tool"],
      ["dummy-avatar", "avatar"],
      ["dummy-asset", "asset"],
      ["dummy-unity-tool", "unity-tool"],
    ],
  );
  const labels = {
    avatar: "アバター",
    asset: "アセット",
    "unity-tool": "Unityツール",
  };
  for (const card of cards) {
    const work = attr(card, "data-work");
    const subcategory = attr(card, "data-subcategory");
    assert.ok(text(card).includes(labels[subcategory]), `${work}: label`);
    const dialog = dialogOf(work);
    assert.ok(text(dialog).includes(labels[subcategory]), work);
    if (!work.startsWith("dummy-")) continue;
    const title = text(card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)[1]);
    assert.match(title, /ダミー/, `${work}: title`);
    assert.deepEqual(hrefs(dialog), [SHOP], `${work}: link`);
  }
  // No shop link outside the cards and the dialogs (it was beside the
  // heading until ui-revise3).
  const outside = section.replace(/<(article|dialog)[\s\S]*?<\/\1>/g, "");
  assert.ok(outside.includes('id="vr-3d-heading"'), "self-check");
  assert.deepEqual(hrefs(outside), [], "links outside the cards");
  assert.ok(!top.includes("BOOTH ショップ"));
});

test("ui-revise3 (user): the BOOTH product: its card, details, link and image", () => {
  const work = "mururu-blink-lipsync";
  const card = cardsOf(sectionOf("vr-3d"))[0];
  assert.equal(attr(card, "data-work"), work);
  assert.equal(attr(card, "data-card"), "frame");
  const title = "【ムルル対応】まばたき＆リップシンク追加ツール";
  assert.equal(text(card.match(/<button[^>]*>([\s\S]*?)<\/button>/)[1]), title);
  assert.match(
    card,
    /<p[^>]*data-work-summary[^>]*>ムルルにまばたきとリップシンクを追加する Unity ツール<\/p>/,
  );
  assert.match(card, /<time datetime="2026"[^>]*>\s*2026\s*<\/time>/);
  assert.ok(text(card).includes("Unityツール"));

  // The card's action and the details link to the item on BOOTH.
  assert.deepEqual(
    actionsOf(card).map(({ label, href }) => [label, href]),
    [["BOOTH で見る", MURURU_ITEM]],
  );
  const dialog = dialogOf(work);
  assert.deepEqual(
    [...dialog.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/g)].map((m) => [
      text(m[1]),
      attr(m[0], "href"),
    ]),
    [["BOOTH で見る", MURURU_ITEM]],
  );
  assert.equal(
    text(dialog.match(/<p[^>]*data-work-description[^>]*>([^<]*)<\/p>/)[1]),
    "ムルルに、まばたき機能と声に合わせて口が動くリップシンク機能を追加するUnityツールです。",
  );

  // The image: the file from the third-party directory (LICENSE section 3),
  // kept in view at the top, where its credit is.
  const source = join(
    root,
    "src/assets/works/third-party/mururu-blink-lipsync.webp",
  );
  assert.ok(existsSync(source));
  for (const html of [card, dialog]) {
    const img = html.match(/<img\s[^>]*>/)[0];
    const src = attr(img, "src");
    assert.match(src, /^\/_astro\/mururu-blink-lipsync\.[\w-]+\.webp$/);
    assert.ok(existsSync(join(dist, src.slice(1))), src);
    assert.equal(attr(img, "width"), "1200");
    assert.equal(attr(img, "height"), "1200");
    assert.ok(attr(img, "class").split(/\s+/).includes("object-top"), img);
  }
  // The other photos are cropped around the center as before.
  const other = cardsOf(sectionOf("keyboards"))[1].match(/<img\s[^>]*>/)[0];
  assert.ok(attr(other, "class").split(/\s+/).includes("object-center"));
});

test("ui-revise3 (parent): only the images with other creators' material are not zoomed on hover", () => {
  // In the data, every work whose image comes from third-party/ is marked
  // thirdPartyImage, and only those.
  const source = readFileSync(join(root, "src/config/works.ts"), "utf8");
  const thirdParty = [
    ...source.matchAll(
      /^import (\w+) from "@\/assets\/works\/third-party\/[^"]+";$/gm,
    ),
  ].map((m) => m[1]);
  assert.deepEqual(thirdParty, ["mururuBlinkLipsyncImg"]);
  const items = [...source.matchAll(/^ {2}\{\n([\s\S]*?)^ {2}\},$/gm)].map(
    (m) => m[1],
  );
  assert.equal(items.length, 15, "self-check of the work items");
  const marked = [];
  for (const item of items) {
    const id = item.match(/id: "([^"]+)"/)[1];
    const image = item.match(/image: ([^,\n]+),/)[1];
    const flagged = /^\s+thirdPartyImage: true,$/m.test(item);
    assert.equal(flagged, thirdParty.includes(image), id);
    if (flagged) marked.push(id);
  }
  assert.deepEqual(marked, ["mururu-blink-lipsync"]);
  // On the page: no zoom class on those images; the other photos keep it.
  let zoomed = 0;
  for (const card of cardsOf(top)) {
    const work = attr(card, "data-work");
    if (attr(card, "data-card") === "tool") continue;
    const img = card.match(/<img\s[^>]*>/)[0];
    const zoom = attr(img, "class").includes("group-hover:scale-");
    assert.equal(zoom, !marked.includes(work), work);
    if (zoom) zoomed++;
  }
  assert.ok(zoomed > 0, "self-check");
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
        // The icon on its background (the cards' radius since ui-revise3).
        assert.match(card, /\brounded-card\b[^"]*"><img/, work);
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
  assert.equal(cards.length, 15, "self-check of the work count");
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
    // A photo card lifts on hover and keyboard focus; a list item (Apps,
    // Libraries) takes the former tool site's hover (ui-revise3 3).
    const cls = attr(card.match(/<article[^>]*>/)[0], "class").split(/\s+/);
    const photo = attr(card, "data-card") !== "tool";
    for (const name of [
      "motion-safe:hover:-translate-y-0.5",
      "hover:shadow-md",
      "has-[button:focus-visible]:shadow-md",
    ]) {
      assert.equal(cls.includes(name), photo, `${work}: ${name}`);
    }
    assert.ok(cls.includes("relative"), work);

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

test("ui-revise3 (parent): the card and the details have the same links, labels and order", () => {
  const linksIn = (html) =>
    [...html.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/g)].map((m) => [
      attr(m[0], "href"),
      text(m[1]),
    ]);
  for (const card of cardsOf(top)) {
    const work = attr(card, "data-work");
    assert.deepEqual(linksIn(card), linksIn(dialogOf(work)), work);
  }
});

test("ui-revise2 3: the details link to where each work is published", () => {
  const expected = {
    // The documentation first, as on the card (ui-revise3).
    "i18n-tiny-astro": [
      ["ドキュメント", "https://docs.unlibra.com/i18n-tiny/astro/introduction"],
      ["npm", "https://www.npmjs.com/package/@i18n-tiny/astro"],
    ],
    "tkinter-unblur": [
      ["ドキュメント", "https://docs.unlibra.com/tkinter-unblur/"],
      ["PyPI", "https://pypi.org/project/tkinter-unblur"],
    ],
    "svg-optimizer": [["ツールを使う", "/lab/svg-optimizer"]],
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

/** The <a> tags of a card's actions, with their text. */
const actionsOf = (card) =>
  [...card.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({
    tag: m[0],
    label: text(m[1]),
    href: attr(m[0], "href"),
  }));

test("ui-revise3 3: every card shows the title, the summary, the year and its actions", () => {
  const npm = (name) => `https://www.npmjs.com/package/@i18n-tiny/${name}`;
  const docs = "https://docs.unlibra.com";
  const expected = {
    // DIY Keyboards have no links: "詳しく見る" only.
    "fosty-natural": [],
    "fosty-dark": [],
    botsu: [],
    "mira-zero": [],
    "i18n-tiny-astro": [
      ["ドキュメント", `${docs}/i18n-tiny/astro/introduction`],
      ["npm", npm("astro")],
    ],
    "i18n-tiny-next": [
      ["ドキュメント", `${docs}/i18n-tiny/next/introduction`],
      ["npm", npm("next")],
    ],
    "tkinter-unblur": [
      ["ドキュメント", `${docs}/tkinter-unblur/`],
      ["PyPI", "https://pypi.org/project/tkinter-unblur"],
    ],
    ...Object.fromEntries(
      TOOLS.map((tool) => [tool, [["ツールを使う", `/lab/${tool}`]]]),
    ),
    "mururu-blink-lipsync": [["BOOTH で見る", MURURU_ITEM]],
    "dummy-avatar": [["BOOTH で見る", SHOP]],
    "dummy-asset": [["BOOTH で見る", SHOP]],
    "dummy-unity-tool": [["BOOTH で見る", SHOP]],
  };
  const cards = cardsOf(top);
  assert.deepEqual(
    cards.map((card) => attr(card, "data-work")).sort(),
    Object.keys(expected).sort(),
  );
  for (const card of cards) {
    const work = attr(card, "data-work");
    // Title, summary and year on every card (Apps and Libraries too).
    assert.match(card, /<h3[^>]*data-work-title[^>]*><button/, work);
    assert.match(card, /data-work-summary/, work);
    const year = card.match(/<time datetime="(\d{4})"[^>]*>\s*(\d{4})\s*</);
    assert.ok(year && year[1] === year[2], `${work}: year`);

    const actions = actionsOf(card);
    assert.deepEqual(
      actions.map(({ label, href }) => [label, href]),
      expected[work],
      work,
    );
    for (const { tag, href } of actions) {
      // In front of the title button's overlay, so that a click goes there
      // directly; described by the work's title.
      const cls = attr(tag, "class").split(/\s+/);
      assert.ok(cls.includes("relative") && cls.includes("z-10"), work);
      assert.equal(attr(tag, "aria-describedby"), `work-${work}-name`, work);
      assert.match(
        card,
        new RegExp(`<button[^>]*><span id="work-${work}-name">`),
        work,
      );
      if (href.startsWith("https://")) {
        assert.match(tag, /target="_blank"/, work);
        assert.match(tag, /rel="noopener noreferrer"/, work);
      } else {
        assert.doesNotMatch(tag, /target=/, work);
      }
    }
    // The actions come before "詳しく見る", in one row.
    const row = card.match(/<div[^>]*data-work-links[\s\S]*<\/p>/)[0];
    assert.equal(actionsOf(row).length, actions.length, work);
    assert.ok(row.trimEnd().endsWith("</svg></p>"), `${work}: more is last`);
  }
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
    has(
      card.match(/<p[^>]*data-work-more[^>]*>/)[0],
      classes.cardLink,
      `${work} more`,
    );
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

test("ui-revise3 3: the list items take the former tool site's card hover, without the lift", () => {
  for (const id of ["libraries", "apps"]) {
    for (const card of cardsOf(sectionOf(id))) {
      const work = attr(card, "data-work");
      const cls = attr(card.match(/<article[^>]*>/)[0], "class").split(/\s+/);
      // tool-card.tsx: p-4 rounded-lg transition-colors hover:bg-gray-100
      // focus-visible:bg-gray-100 dark:hover:bg-atom-one-dark-light.
      for (const name of [
        "p-4",
        "transition-colors",
        "hover:bg-gray-100",
        "has-[button:focus-visible]:bg-gray-100",
        "dark:hover:bg-atom-one-dark-light",
        "dark:has-[button:focus-visible]:bg-atom-one-dark-light",
      ]) {
        assert.ok(cls.includes(name), `${work}: ${name}`);
      }
      assert.ok(!cls.some((name) => /translate|shadow/.test(name)), work);
    }
  }
  // The apps' icons on the former tools' color.
  for (const card of cardsOf(sectionOf("apps"))) {
    assert.match(card, /bg-logo-medium\/70[^"]*"><img/);
  }
});

test("D5: the three documentation links point to docs.unlibra.com", () => {
  // The works' links (the footer links to the docs site's top since ui-revise).
  // Each is on the work's card (ui-revise3 3) and in its details.
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
  const dialogs = main.match(/<dialog[\s\S]*?<\/dialog>/g).join("");
  assert.deepEqual(docsIn(cardsOf(main).join("")), expected);
  assert.deepEqual(docsIn(dialogs), expected);
  assert.deepEqual(docsIn(main), [...expected, ...expected].sort());
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
