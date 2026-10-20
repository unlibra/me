// Integration tests for the common layout (Phase 2) against dist/.
// Run `npm run build` before `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, globSync, readFileSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const SITE = "https://unlibra.com";

if (!existsSync(join(dist, "index.html"))) {
  throw new Error("dist/ not found. Run `npm run build` before `npm test`.");
}

const readDist = (path) => readFileSync(join(dist, path), "utf8");
const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];

/** HTML files in dist/ as posix-style paths relative to dist/. */
const htmlPages = () =>
  globSync("**/*.html", { cwd: dist })
    .map((p) => p.split(sep).join("/"))
    .sort();

/** "index.html" -> "/", "privacy/index.html" -> "/privacy". */
const pathOf = (file) => "/" + file.replace(/(^|\/)index\.html$/, "");

const head = (html) => {
  const match = html.match(/<head>([\s\S]*?)<\/head>/);
  assert.ok(match, "no <head>");
  return match[1];
};

/** Inline <script> bodies (no src attribute) in the order they appear. */
const inlineScripts = (html) =>
  [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(
    (m) => ({ index: m.index, tag: m[0], body: m[1] }),
  );

const isThemeInit = (body) =>
  body.includes("localStorage") && /classList\.toggle\("dark"/.test(body);

test("the build has the pages this test suite expects", () => {
  // Guards against the checks below passing on an empty page list.
  assert.deepEqual(htmlPages(), [
    "404.html",
    "index.html",
    "privacy/index.html",
  ]);
});

test("C2: pages other than 404 have exactly one canonical and a matching og:url", () => {
  for (const file of htmlPages().filter((f) => f !== "404.html")) {
    const html = head(readDist(file));
    const expected = SITE + pathOf(file).replace(/\/$/, "");
    assert.doesNotMatch(expected, /\/$/);

    const canonical = html.match(/<link[^>]*rel="canonical"[^>]*>/g) ?? [];
    assert.equal(canonical.length, 1, `${file}: canonical count`);
    assert.equal(attr(canonical[0], "href"), expected, `${file}: canonical`);

    const ogUrl = html.match(/<meta[^>]*property="og:url"[^>]*>/g) ?? [];
    assert.equal(ogUrl.length, 1, `${file}: og:url count`);
    assert.equal(attr(ogUrl[0], "content"), expected, `${file}: og:url`);
  }
});

test("C2: the 404 page has neither canonical nor og:url", () => {
  const html = readDist("404.html");
  assert.doesNotMatch(html, /rel="canonical"/);
  assert.doesNotMatch(html, /property="og:url"/);
});

test("pages have title, description, OGP and Twitter card metadata", () => {
  for (const file of htmlPages()) {
    const html = head(readDist(file));
    assert.match(html, /<title>[^<]+<\/title>/, file);
    for (const [key, name] of [
      ["name", "description"],
      ["property", "og:title"],
      ["property", "og:description"],
      ["property", "og:image"],
      ["property", "og:site_name"],
      ["name", "twitter:card"],
      ["name", "twitter:image"],
    ]) {
      const tags = html.match(
        new RegExp(`<meta[^>]*${key}="${name}"[^>]*>`, "g"),
      );
      assert.equal(tags?.length, 1, `${file}: ${name}`);
      assert.ok(attr(tags[0], "content"), `${file}: ${name} is empty`);
    }
    const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*>/)[0];
    assert.equal(attr(ogImage, "content"), `${SITE}/ogp.png`, file);
    assert.match(readDist(file), /<html[^>]*lang="ja"/, file);
  }
});

test("C3: the theme init script comes before any stylesheet in <head>", () => {
  for (const file of htmlPages()) {
    const html = head(readDist(file));
    const scripts = inlineScripts(html).filter((s) => isThemeInit(s.body));
    assert.equal(scripts.length, 1, `${file}: theme init script count`);
    assert.doesNotMatch(scripts[0].tag, /type="module"/, file);

    const styles = [
      html.search(/<link[^>]*rel="stylesheet"/),
      html.search(/<style[\s>]/),
    ].filter((i) => i >= 0);
    assert.ok(styles.length > 0, `${file}: no stylesheet in <head>`);
    assert.ok(
      scripts[0].index < Math.min(...styles),
      `${file}: theme init script is after a stylesheet`,
    );
  }
});

/** Runs the theme init script with a fake browser environment. */
const runThemeInit = ({ stored, systemDark, storageThrows = false }) => {
  const script = inlineScripts(head(readDist("index.html"))).find((s) =>
    isThemeInit(s.body),
  ).body;
  const classes = new Set();
  const context = {
    matchMedia: (query) => ({
      matches: query === "(prefers-color-scheme: dark)" && systemDark,
    }),
    document: {
      documentElement: {
        classList: {
          toggle: (name, force) => {
            if (force) classes.add(name);
            else classes.delete(name);
          },
        },
      },
    },
  };
  context.window = context;
  Object.defineProperty(context, "localStorage", {
    get() {
      if (storageThrows) throw new Error("SecurityError: storage is disabled");
      return { getItem: (key) => (key === "theme" ? stored : null) };
    },
  });
  vm.runInNewContext(script, context);
  return classes.has("dark");
};

test("theme init: an explicit choice wins over the system setting", () => {
  assert.equal(runThemeInit({ stored: "dark", systemDark: false }), true);
  assert.equal(runThemeInit({ stored: "light", systemDark: true }), false);
});

test("theme init: system (or no choice) follows prefers-color-scheme", () => {
  for (const stored of ["system", null, "unexpected"]) {
    assert.equal(runThemeInit({ stored, systemDark: true }), true, stored);
    assert.equal(runThemeInit({ stored, systemDark: false }), false, stored);
  }
});

test("theme init: unavailable localStorage does not throw and follows the system", () => {
  assert.equal(
    runThemeInit({ stored: "light", systemDark: true, storageThrows: true }),
    true,
  );
  assert.equal(
    runThemeInit({ stored: "dark", systemDark: false, storageThrows: true }),
    false,
  );
});

/** CSS files linked from an HTML page, plus inline <style> contents. */
const pageCss = (html) => {
  const linked = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*>/g)].map(
    (m) => readDist(attr(m[0], "href").replace(/^\//, "")),
  );
  const inline = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(
    (m) => m[1],
  );
  return linked.concat(inline).join("\n");
};

test("C6: body text uses Noto Sans JP and its font files are in dist/", () => {
  for (const file of htmlPages()) {
    const css = pageCss(readDist(file));
    assert.match(css, /--font-sans:\s*"Noto Sans JP Variable"/, file);
    assert.match(css, /--default-font-family:\s*var\(--font-sans\)/, file);

    const faces = [...css.matchAll(/@font-face\s*{([^}]*)}/g)]
      .map((m) => m[1])
      .filter((face) => /font-family:\s*"?Noto Sans JP Variable/.test(face));
    assert.ok(faces.length > 0, `${file}: no @font-face for Noto Sans JP`);
    for (const face of faces) {
      for (const [, url] of face.matchAll(/url\(([^)]+)\)/g)) {
        const path = url.replace(/^["']|["']$/g, "").replace(/^\//, "");
        assert.ok(existsSync(join(dist, path)), `${file}: ${path} is missing`);
      }
    }
  }
});

test("C6: no IBM Plex references remain", () => {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  for (const field of ["dependencies", "devDependencies"]) {
    assert.equal(pkg[field]?.["@fontsource/ibm-plex-sans-jp"], undefined);
  }

  const pattern = /ibm[ -]plex/i;
  const distFiles = globSync("**/*.{html,css,js}", { cwd: dist }).concat(
    globSync("**/*ibm*", { cwd: dist }),
  );
  assert.deepEqual(
    distFiles.filter(
      (p) =>
        /ibm/i.test(p) || pattern.test(readFileSync(join(dist, p), "utf8")),
    ),
    [],
  );

  const sources = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root, encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean)
    .filter((p) => existsSync(join(root, p)))
    .filter((p) => !p.startsWith("docs/") && !p.startsWith("tests/"))
    // README.md is rewritten in Phase 5 (outside this phase's scope).
    .filter((p) => p !== "README.md")
    .filter((p) => !/\.(png|webp|jpe?g|gif|ico|woff2?)$/i.test(p));
  assert.deepEqual(
    sources.filter((p) => pattern.test(readFileSync(join(root, p), "utf8"))),
    [],
  );
});

/**
 * JavaScript a page loads: inline module scripts, external scripts and
 * modulepreloads, and the dist/_astro/*.js files they reference (recursively).
 */
const pageJavaScript = (html) => {
  const sources = inlineScripts(html).map((s) => s.body);
  const pending = [
    ...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g),
    ...html.matchAll(/<link[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g),
  ].map((m) => m[1]);
  const seen = new Set();
  const referenced = (code) =>
    [...code.matchAll(/([\w.-]+\.js)\b/g)]
      .map((m) => `/_astro/${m[1]}`)
      .filter((p) => existsSync(join(dist, p)));
  for (const code of sources) pending.push(...referenced(code));
  while (pending.length > 0) {
    const path = pending.pop();
    if (seen.has(path)) continue;
    seen.add(path);
    const code = readDist(path.replace(/^\//, ""));
    sources.push(code);
    pending.push(...referenced(code));
  }
  return sources;
};

test("C7: the top page and privacy do not load the React runtime", () => {
  // Symbols every React runtime build defines.
  const reactMarker = /react\.(transitional\.)?element/;
  for (const file of ["index.html", "privacy/index.html"]) {
    const html = readDist(file);
    assert.doesNotMatch(html, /<astro-island/, file);
    for (const code of pageJavaScript(html)) {
      assert.doesNotMatch(code, reactMarker, file);
    }
  }
});

const sectionOf = (html, tag) => {
  const sections = html.match(
    new RegExp(`<${tag}[\\s>][\\s\\S]*?</${tag}>`, "g"),
  );
  assert.equal(sections?.length, 1, `<${tag}> count`);
  return sections[0];
};

const hrefs = (html) =>
  [...html.matchAll(/<a\s[^>]*>/g)].map((m) => attr(m[0], "href"));

test("C4: every page has the common header", () => {
  for (const file of htmlPages()) {
    const header = sectionOf(readDist(file), "header");
    const links = hrefs(header);
    assert.ok(links.includes("/"), `${file}: home link`);
    assert.ok(links.includes("/lab"), `${file}: tools link`);
    assert.ok(links.includes("https://github.com/unlibra"), `${file}: GitHub`);
    assert.match(header, />unlibra\.com</, `${file}: site name`);
    assert.match(header, /<svg[^>]*viewBox="0 0 512 512"/, `${file}: logo`);

    // Theme toggle: a button controlling a hidden panel of three choices.
    assert.match(
      header,
      /<button[^>]*aria-label="テーマを切り替え"[^>]*aria-expanded="false"[^>]*aria-controls="theme-menu"/,
      file,
    );
    assert.match(header, /<div[^>]*id="theme-menu"[^>]*hidden/, file);
    const options = [...header.matchAll(/data-theme-option="([^"]+)"/g)].map(
      (m) => m[1],
    );
    assert.deepEqual(options, ["light", "dark", "system"], file);
  }
});

test("pages without another language version have no language switcher", () => {
  for (const file of htmlPages()) {
    const html = readDist(file);
    assert.doesNotMatch(html, /data-language-switcher/, file);
    assert.doesNotMatch(html, /hreflang/, file);
  }
});

test("C4: every page has the common footer with the required links", () => {
  for (const file of htmlPages()) {
    const footer = sectionOf(readDist(file), "footer");
    assert.match(footer, />© 2025 unlibra</, `${file}: copyright`);
    const links = hrefs(footer);
    for (const href of [
      "/",
      "https://github.com/unlibra",
      "https://ofuse.me/unlibra",
      "/privacy",
    ]) {
      assert.ok(links.includes(href), `${file}: footer link to ${href}`);
    }
  }
});

/** Lists every key path of a nested object, e.g. "footer.github". */
const keyPaths = (object, prefix = "") =>
  Object.entries(object).flatMap(([key, value]) =>
    typeof value === "object"
      ? keyPaths(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );

test("C8: header and footer texts have the same keys in ja and en", async () => {
  // The type check (tests/types/layout-messages.ts) is the guarantee; this
  // checks the actual values as well.
  const { layoutMessages } = await import("../src/messages/layout.ts");
  assert.deepEqual(Object.keys(layoutMessages).sort(), ["en", "ja"]);
  assert.deepEqual(
    keyPaths(layoutMessages.en).sort(),
    keyPaths(layoutMessages.ja).sort(),
  );
  for (const locale of ["ja", "en"]) {
    for (const path of keyPaths(layoutMessages[locale])) {
      const value = path
        .split(".")
        .reduce((object, key) => object[key], layoutMessages[locale]);
      assert.equal(typeof value, "string", `${locale}.${path}`);
      assert.notEqual(value.trim(), "", `${locale}.${path}`);
    }
  }
});

/** Width and height from a PNG's IHDR chunk. */
const pngSize = (buffer) => {
  assert.equal(
    buffer.subarray(0, 8).toString("hex"),
    "89504e470d0a1a0a",
    "not a PNG",
  );
  assert.equal(buffer.subarray(12, 16).toString("latin1"), "IHDR");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
};

const readDistBuffer = (path) => readFileSync(join(dist, path));

test("C5: icon files are in dist/ with the expected sizes", () => {
  assert.deepEqual(pngSize(readDistBuffer("ogp.png")), {
    width: 1200,
    height: 630,
  });
  assert.deepEqual(pngSize(readDistBuffer("apple-touch-icon.png")), {
    width: 180,
    height: 180,
  });

  // favicon.ico: a directory of PNG images, one of them 32x32.
  const ico = readDistBuffer("favicon.ico");
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1, "not an icon");
  const sizes = [];
  for (let i = 0; i < ico.readUInt16LE(4); i++) {
    const entry = 6 + 16 * i;
    const size = ico.readUInt8(entry) || 256;
    const length = ico.readUInt32LE(entry + 8);
    const offset = ico.readUInt32LE(entry + 12);
    const image = ico.subarray(offset, offset + length);
    assert.deepEqual(pngSize(image), { width: size, height: size });
    sizes.push(size);
  }
  assert.ok(sizes.includes(32), `favicon.ico sizes: ${sizes}`);
});

test("C5: icon.svg is the brand symbol", () => {
  const symbol = readFileSync(
    join(root, "src/assets/brand/symbol.svg"),
    "utf8",
  );
  const icon = readDist("icon.svg");
  assert.match(icon, /^<svg width="512" height="512" /);
  assert.equal(
    icon.replace(' width="512" height="512"', "").trim(),
    symbol.trim(),
  );
});

test("C5: every page references the icons and the OGP image", () => {
  for (const file of htmlPages()) {
    const html = head(readDist(file));
    const links = [...html.matchAll(/<link\s[^>]*>/g)].map((m) => ({
      rel: attr(m[0], "rel"),
      href: attr(m[0], "href"),
    }));
    for (const [rel, href] of [
      ["icon", "/favicon.ico"],
      ["icon", "/icon.svg"],
      ["apple-touch-icon", "/apple-touch-icon.png"],
    ]) {
      assert.ok(
        links.some((l) => l.rel === rel && l.href === href),
        `${file}: <link rel="${rel}" href="${href}">`,
      );
      assert.ok(existsSync(join(dist, href.slice(1))), `dist${href}`);
    }
    const twitterImage = html.match(/<meta[^>]*name="twitter:image"[^>]*>/)[0];
    assert.equal(attr(twitterImage, "content"), `${SITE}/ogp.png`, file);
  }
});

test("C5: the old OGP frame image is removed", () => {
  assert.equal(existsSync(join(root, "assets/ogp-frame.png")), false);
});
