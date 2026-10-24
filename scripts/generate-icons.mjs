// Generates the site icons from the brand symbol. The OGP image
// (public/ogp.png) is made by hand and kept as it is.
//
//   npm run generate:icons
//
// Input:   src/assets/brand/symbol.svg
// Outputs (committed): public/favicon.svg, public/favicon.ico,
//   public/apple-touch-icon.png
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const symbolSvg = readFileSync(join(root, "src/assets/brand/symbol.svg"));

/** Background color of the symbol's circle. */
const symbolColor = "#27272a";

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

// favicon.svg: the symbol with an explicit size, as the previous icon had.
writeFileSync(
  join(publicDir, "favicon.svg"),
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

console.log("Generated favicon.svg, favicon.ico, apple-touch-icon.png");
