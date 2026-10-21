import type { Config } from "svgo/browser";

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
          convertTransform: options.convertTransform && {
            floatPrecision: options.transformPrecision,
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
          convertPathData: options.convertPathData,
          removeUnknownsAndDefaults: options.removeUnknownsAndDefaults,
          removeNonInheritableGroupAttrs:
            options.removeNonInheritableGroupAttrs,
          removeUselessStrokeAndFill: options.removeUselessStrokeAndFill,
          removeUnusedNS: options.removeUnusedNS,
          cleanupIds: options.cleanupIds,
          moveElemsAttrsToGroup: options.moveElemsAttrsToGroup,
          moveGroupAttrsToElems: options.moveGroupAttrsToElems,
          collapseGroups: options.collapseGroups,
          mergePaths: options.mergePaths,
          convertShapeToPath: options.convertShapeToPath,
          sortAttrs: options.sortAttrs,
          // Also in preset-default, where it removes only empty and editor
          // descriptions; switched off, it must not run there either.
          removeDesc: options.removeDesc,
        },
      },
    },
  ];

  // Standalone plugins (not part of preset-default). A plugin that is switched
  // off is left out: SVGO 4 ignores `active: false` and would still run it.
  const standalonePlugins: Array<[name: string, enabled: boolean]> = [
    ["removeViewBox", options.removeViewBox],
    ["convertStyleToAttrs", options.convertStyleToAttrs],
    ["cleanupListOfValues", options.cleanupListOfValues],
    ["removeTitle", options.removeTitle],
    ["removeDesc", options.removeDesc],
    ["removeDimensions", options.removeDimensions],
    ["removeRasterImages", options.removeRasterImages],
    // Security plugins (inverted logic: keepScripts=false means remove)
    ["removeScripts", !options.keepScripts],
    ["removeStyleElement", !options.keepStyleElement],
  ];

  for (const [name, enabled] of standalonePlugins) {
    if (enabled) plugins.push({ name });
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
