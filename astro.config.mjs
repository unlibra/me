// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

import thirdPartyLicenses from "./scripts/third-party-licenses.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://unlibra.com",
  trailingSlash: "never",
  integrations: [react(), sitemap(), thirdPartyLicenses()],
  vite: {
    plugins: [tailwindcss()],
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
