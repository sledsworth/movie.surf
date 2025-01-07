import { defineConfig } from "astro/config";

import netlify from "@astrojs/netlify";

import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  site: "https://movie.surf",

  server: {
      port: 3001,
	},

  prefetch: true,
  adapter: netlify(),

  experimental: {
      session: {
          // The name of the unstorage driver is camelCase
          driver: "netlify-blobs",
          options: {
              name: "movie-surf-sessions",
              // Sessions need strong consistency
              consistency: "strong",
          },
      },
      contentIntellisense: true,
	},

  integrations: [svelte()],
});