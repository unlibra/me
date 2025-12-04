// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || "https://unlibra.com",
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
    esbuild: {
      drop: ["console", "debugger"],
    },
  },
});
