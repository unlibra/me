// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || "https://unlibra.com",
  integrations: [sitemap()],
  vite: {
    // @ts-expect-error: @tailwindcss/vite uses Vite 7 types, but Astro uses Vite 6
    plugins: [tailwindcss()],
    esbuild: {
      drop: ["console", "debugger"],
    },
  },
});
