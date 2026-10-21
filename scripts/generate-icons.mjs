// Generates the site icons and the OGP image from the brand symbol.
//
//   npm run generate:icons
//
// Inputs:  src/assets/brand/symbol.svg, Noto Sans JP from node_modules
// Outputs (committed): public/icon.svg, public/favicon.ico,
//   public/apple-touch-icon.png, public/ogp.png
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const symbolSvg = readFileSync(join(root, "src/assets/brand/symbol.svg"));

/** Background color of the symbol's circle. */
const symbolColor = "#27272a";

const fontFile = createRequire(import.meta.url).resolve(
  "@fontsource-variable/noto-sans-jp/files/noto-sans-jp-latin-wght-normal.woff2",
);

/** Rasterizes the symbol to a square PNG of the given size. */
const symbolPng = (size) =>
  sharp(symbolSvg, { density: (72 * size) / 512 })
    .resize(size, size)
    .png()
    .toBuffer();

/** ICO file holding PNG images (supported by all current browsers). */
const ico = (images) => {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, entry); // width
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1); // height
    header.writeUInt8(0, entry + 2); // palette colors
    header.writeUInt8(0, entry + 3); // reserved
    header.writeUInt16LE(1, entry + 4); // color planes
    header.writeUInt16LE(32, entry + 6); // bits per pixel
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((image) => image.data)]);
};

// icon.svg: the symbol with an explicit size, as the previous icon had.
writeFileSync(
  join(publicDir, "icon.svg"),
  symbolSvg
    .toString("utf8")
    .trim()
    .replace(/^<svg /, '<svg width="512" height="512" ') + "\n",
);

// favicon.ico: 16, 32, and 48 px.
const icoSizes = [16, 32, 48];
writeFileSync(
  join(publicDir, "favicon.ico"),
  ico(
    await Promise.all(
      icoSizes.map(async (size) => ({ size, data: await symbolPng(size) })),
    ),
  ),
);

// apple-touch-icon.png: iOS fills transparency with black and rounds the
// corners itself, so fill the corners with the circle's color.
await sharp(await symbolPng(180))
  .flatten({ background: symbolColor })
  .png()
  .toFile(join(publicDir, "apple-touch-icon.png"));

// ogp.png: 1200x630, the symbol and the site name side by side.
const width = 1200;
const height = 630;
const symbolSize = 160;
const gap = 40;
const text = await sharp({
  text: {
    text: `<span foreground="${symbolColor}">unlibra</span>`,
    font: "Noto Sans JP Semi-Bold 96",
    fontfile: fontFile,
    rgba: true,
    dpi: 72,
  },
})
  .png()
  .toBuffer({ resolveWithObject: true });
const groupWidth = symbolSize + gap + text.info.width;
const left = Math.round((width - groupWidth) / 2);
await sharp({
  create: { width, height, channels: 3, background: "#ffffff" },
})
  .composite([
    {
      input: await symbolPng(symbolSize),
      left,
      top: Math.round((height - symbolSize) / 2),
    },
    {
      input: text.data,
      left: left + symbolSize + gap,
      top: Math.round((height - text.info.height) / 2),
    },
  ])
  .removeAlpha()
  .png()
  .toFile(join(publicDir, "ogp.png"));

console.log("Generated icon.svg, favicon.ico, apple-touch-icon.png, ogp.png");
