// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

import thirdPartyLicenses from "./scripts/third-party-licenses.mjs";

/**
 * Noto Sans JP's ascent (1.16em) is far larger than its descent (0.288em),
 * so its text sits about 0.07em below the middle of its line, and the icons
 * beside it look too high. These overrides keep the sum (1.448em, so the
 * line heights stay) and put the middle of the capitals and the kanji
 * (0.37em above the baseline) in the middle of the line.
 */
const notoSansJpMetrics = () => ({
  name: "noto-sans-jp-metrics",
  enforce: /** @type {const} */ ("pre"),
  /** @param {string} code @param {string} id */
  transform(code, id) {
    if (!/@fontsource-variable[\\/]noto-sans-jp[\\/].*\.css/.test(id)) return;
    if (!code.includes("@font-face {")) {
      throw new Error(`${id}: no @font-face to add the metric overrides to`);
    }
    return code.replaceAll(
      "@font-face {",
      "@font-face {\n  ascent-override: 109.4%;\n  descent-override: 35.4%;",
    );
  },
});

// https://astro.build/config
export default defineConfig({
  site: "https://unlibra.com",
  trailingSlash: "never",
  integrations: [react(), sitemap(), thirdPartyLicenses()],
  vite: {
    plugins: [notoSansJpMetrics(), tailwindcss()],
    build: {
      rolldownOptions: {
        output: {
          minify: {
            compress: {
              dropConsole: true,
              dropDebugger: true,
            },
          },
        },
      },
    },
  },
});
