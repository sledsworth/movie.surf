import { defineConfig } from "astro/config";
// import cloudflare from "@astrojs/cloudflare";

import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
	site: "https://movie.surf",
	prefetch: true,
	output: "static",
	experimental: {
		contentIntellisense: true,
	},
	adapter: netlify(),
});
