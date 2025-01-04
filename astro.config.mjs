import { defineConfig } from "astro/config";

import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
	site: "https://movie.surf",
	server: {
		port: 3001,
	},
	prefetch: true,
	experimental: {
		session: {
			// The name of the unstorage driver is camelCase
			driver: "netlify-blobs",
			options: {
				name: "astro-sessions",
				// Sessions need strong consistency
				consistency: "strong",
			},
		},
		contentIntellisense: true,
	},
	adapter: netlify(),
});
