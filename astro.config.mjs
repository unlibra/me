// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://unlibra.com",
  trailingSlash: "never",
  integrations: [react(), sitemap()],
  vite: {
    // @ts-expect-error: @tailwindcss/vite uses Vite 7 types, but Astro uses Vite 6
    plugins: [tailwindcss()],
    esbuild: {
      drop: ["console", "debugger"],
    },
  },
});
