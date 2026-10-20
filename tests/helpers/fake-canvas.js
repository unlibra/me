// A stand-in for <canvas> in Node. It records every call and property set on
// the 2D context, and `toBlob` returns that record as JSON instead of a PNG.
// Two implementations that make the same drawing calls produce the same
// "image", so the ported code can be compared with the former tool's.

const describe = (value) =>
  value && typeof value === "object"
    ? { image: [value.width, value.height] }
    : value;

const createCanvas = () => {
  const ops = [];
  const context = new Proxy(
    {},
    {
      get:
        (_, name) =>
        (...args) => {
          ops.push([name, ...args.map(describe)]);
        },
      set: (_, name, value) => {
        ops.push(["set", name, value]);
        return true;
      },
    },
  );
  const canvas = {
    width: 0,
    height: 0,
    getContext: (type) => (type === "2d" ? context : null),
    toBlob: (callback, type, quality) => {
      const record = {
        width: canvas.width,
        height: canvas.height,
        quality,
        ops,
      };
      callback(new Blob([JSON.stringify(record)], { type }));
    },
  };
  return canvas;
};

/** Replaces `document` with one whose canvases are fakes. Returns a restore function. */
export const installFakeCanvas = () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", {
    value: {
      createElement: (tag) => {
        if (tag !== "canvas") throw new Error(`unexpected <${tag}>`);
        return createCanvas();
      },
    },
    configurable: true,
    writable: true,
  });
  return () => {
    if (descriptor) Object.defineProperty(globalThis, "document", descriptor);
    else delete globalThis.document;
  };
};

/** Source images of the test cases (only width and height are read). */
export const images = {
  wide: { width: 100, height: 50 },
  tall: { width: 40, height: 80 },
  square: { width: 64, height: 64 },
};

/** Options passed to generateOutputSet in the test cases. */
export const outputOptions = {
  defaults: {},
  rounded: { sizes: [16, 32, 48, 256], borderRadiusPercent: 25 },
  circle: { sizes: [16], borderRadiusPercent: 100, backgroundColor: "#123456" },
  background: { sizes: [24, 64, 128], backgroundColor: "#abcdef" },
};

/** Options passed to processImage directly. */
export const processCases = [
  ["wide", 32, undefined, { preserveAspectRatio: true }],
  ["tall", 200, 100, { preserveAspectRatio: true, borderRadius: 4 }],
  ["square", 48, undefined, { borderRadius: 10 }],
  ["wide", 48, undefined, { borderRadius: 30 }],
  ["tall", 48, 24, { borderRadiusPercent: 50, backgroundColor: "#000" }],
];

/** Runs every case and returns { key: base64 of each output file }. */
export const runCases = async ({
  generateOutputSet,
  processImage,
  OUTPUT_SETS,
}) => {
  const results = {};
  const base64 = async (blob) =>
    Buffer.from(await blob.arrayBuffer()).toString("base64");
  for (const [imageName, image] of Object.entries(images)) {
    for (const set of OUTPUT_SETS) {
      for (const [optionName, options] of Object.entries(outputOptions)) {
        const files = await generateOutputSet(image, set.files, options);
        results[`${imageName}/${set.id}/${optionName}`] = await Promise.all(
          files.map(async ({ name, blob }) => [
            name,
            blob.type,
            await base64(blob),
          ]),
        );
      }
    }
  }
  for (const [
    index,
    [imageName, maxWidth, maxHeight, options],
  ] of processCases.entries()) {
    const blob = await processImage(
      images[imageName],
      maxWidth,
      maxHeight,
      options,
    );
    results[`processImage/${index}`] = [blob.type, await base64(blob)];
  }
  return results;
};
