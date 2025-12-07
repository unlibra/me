// @ts-check
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Load environment variables for config (Astro doesn't auto-load .env for config)
const { PUBLIC_SITE_URL } = loadEnv(
  process.env.NODE_ENV || "production",
  process.cwd(),
  "",
);

// https://astro.build/config
export default defineConfig({
  site: PUBLIC_SITE_URL || "https://unlibra.com",
  trailingSlash: "never",
  integrations: [sitemap()],
  vite: {
    // @ts-expect-error: @tailwindcss/vite uses Vite 7 types, but Astro uses Vite 6
    plugins: [tailwindcss()],
    esbuild: {
      drop: ["console", "debugger"],
    },
  },
});
