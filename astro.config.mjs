import { defineConfig } from "astro/config";
// import cloudflare from "@astrojs/cloudflare";

import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
	site: "https://movie.surf",
	server: {
		port: 3001,
		open: true,
	},
	prefetch: true,
	experimental: {
		contentIntellisense: true,
	},
	adapter: netlify(),
});
