import type { Config, CustomPlugin } from "svgo/browser";

/**
 * SVGO plugin options
 */
export type SvgoOptions = {
  // Numeric options
  floatPrecision: number;
  transformPrecision: number;

  // Plugin toggles
  removeDoctype: boolean;
  removeComments: boolean;
  removeMetadata: boolean;
  removeTitle: boolean;
  removeDesc: boolean;
  removeUselessDefs: boolean;
  removeEditorsNSData: boolean;
  removeEmptyAttrs: boolean;
  removeHiddenElems: boolean;
  removeEmptyText: boolean;
  removeEmptyContainers: boolean;
  removeViewBox: boolean;
  cleanupEnableBackground: boolean;
  minifyStyles: boolean;
  convertStyleToAttrs: boolean;
  convertColors: boolean;
  convertPathData: boolean;
  convertTransform: boolean;
  removeUnknownsAndDefaults: boolean;
  removeNonInheritableGroupAttrs: boolean;
  removeUselessStrokeAndFill: boolean;
  removeUnusedNS: boolean;
  cleanupIds: boolean;
  cleanupNumericValues: boolean;
  cleanupListOfValues: boolean;
  moveElemsAttrsToGroup: boolean;
  moveGroupAttrsToElems: boolean;
  collapseGroups: boolean;
  removeRasterImages: boolean;
  mergePaths: boolean;
  convertShapeToPath: boolean;
  sortAttrs: boolean;
  removeDimensions: boolean;

  // Dangerous options (inverted flags - default: false = safe)
  keepScripts: boolean;
  keepStyleElement: boolean;
};

/**
 * SVGO's removeRasterImages for SVG 2's `href`: removes an `<image>` whose
 * `href` refers to a JPEG, PNG or GIF, with the same test SVGO's plugin makes
 * on `xlink:href`.
 */
const removeRasterImagesHref: CustomPlugin = {
  name: "removeRasterImagesHref",
  fn: () => ({
    element: {
      enter: (node, parentNode) => {
        const href = node.attributes.href;
        if (
          node.name === "image" &&
          href != null &&
          /(\.|image\/)(jpe?g|png|gif)/.test(href)
        ) {
          parentNode.children = parentNode.children.filter(
            (child) => child !== node,
          );
        }
      },
    },
  }),
};

/**
 * Convert our custom options format to SVGO config
 */
export function buildSvgoConfig(options: SvgoOptions): Config {
  // Build plugins array with overrides for preset-default plugins
  const plugins: Array<Record<string, unknown>> = [
    // Start with preset-default but customize specific plugins
    {
      name: "preset-default",
      params: {
        overrides: {
          // Numeric precision overrides (false = disable)
          cleanupNumericValues: options.cleanupNumericValues && {
            floatPrecision: options.floatPrecision,
          },
          // Path data follows the same slider as the other numbers.
          convertPathData: options.convertPathData && {
            floatPrecision: options.floatPrecision,
          },
          mergePaths: options.mergePaths && {
            floatPrecision: options.floatPrecision,
          },
          convertShapeToPath: options.convertShapeToPath && {
            floatPrecision: options.floatPrecision,
          },
          // Angles too: SVGO would otherwise round them to at most 3 places.
          convertTransform: options.convertTransform && {
            floatPrecision: options.transformPrecision,
            degPrecision: options.transformPrecision,
          },
          // Boolean plugin overrides (false = disable, true = use default params)
          removeDoctype: options.removeDoctype,
          removeComments: options.removeComments,
          removeMetadata: options.removeMetadata,
          removeUselessDefs: options.removeUselessDefs,
          removeEditorsNSData: options.removeEditorsNSData,
          removeEmptyAttrs: options.removeEmptyAttrs,
          removeHiddenElems: options.removeHiddenElems,
          removeEmptyText: options.removeEmptyText,
          removeEmptyContainers: options.removeEmptyContainers,
          cleanupEnableBackground: options.cleanupEnableBackground,
          minifyStyles: options.minifyStyles,
          convertColors: options.convertColors,
          removeUnknownsAndDefaults: options.removeUnknownsAndDefaults,
          removeNonInheritableGroupAttrs:
            options.removeNonInheritableGroupAttrs,
          removeUselessStrokeAndFill: options.removeUselessStrokeAndFill,
          removeUnusedNS: options.removeUnusedNS,
          cleanupIds: options.cleanupIds,
          moveElemsAttrsToGroup: options.moveElemsAttrsToGroup,
          moveGroupAttrsToElems: options.moveGroupAttrsToElems,
          collapseGroups: options.collapseGroups,
          sortAttrs: options.sortAttrs,
          // Also in preset-default, where it removes only empty and editor
          // descriptions; switched off, it must not run there either. The
          // standalone removeDesc below removes the others.
          removeDesc: options.removeDesc,
        },
      },
    },
  ];

  // Standalone plugins (not part of preset-default). A plugin that is switched
  // off is left out: SVGO 4 ignores `active: false` and would still run it.
  const standalonePlugins: Array<
    [plugin: Record<string, unknown>, enabled: boolean]
  > = [
    [{ name: "removeViewBox" }, options.removeViewBox],
    [{ name: "convertStyleToAttrs" }, options.convertStyleToAttrs],
    [
      {
        name: "cleanupListOfValues",
        params: { floatPrecision: options.floatPrecision },
      },
      options.cleanupListOfValues,
    ],
    [{ name: "removeTitle" }, options.removeTitle],
    // Every <desc>, not only empty ones and those an editor wrote.
    [{ name: "removeDesc", params: { removeAny: true } }, options.removeDesc],
    [{ name: "removeDimensions" }, options.removeDimensions],
    // SVGO's plugin looks at xlink:href only; the second one at SVG 2's href.
    [{ name: "removeRasterImages" }, options.removeRasterImages],
    [removeRasterImagesHref, options.removeRasterImages],
    // Security plugins (inverted logic: keepScripts=false means remove)
    [{ name: "removeScripts" }, !options.keepScripts],
    [{ name: "removeStyleElement" }, !options.keepStyleElement],
  ];

  for (const [plugin, enabled] of standalonePlugins) {
    if (enabled) plugins.push(plugin);
  }

  return {
    plugins: plugins as unknown as Config["plugins"],
    multipass: true,
  };
}

/**
 * Optimize SVG using SVGO with the given options
 */
export async function optimizeSvg(
  svgString: string,
  options: SvgoOptions,
): Promise<string> {
  const config = buildSvgoConfig(options);

  try {
    // Lazy-load SVGO only when needed (~200KB)
    const { optimize } = await import("svgo/browser");
    const result = optimize(svgString, config);
    return result.data;
  } catch (error) {
    console.error("SVGO optimization failed:", error);
    throw new Error("SVGの最適化に失敗しました");
  }
}
