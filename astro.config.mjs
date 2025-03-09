import { defineConfig } from "astro/config";

import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
	site: "https://movie.surf",

	server: {
		port: 3002,
	},

	prefetch: true,
	adapter: netlify(),
	session: {
		// The name of the unstorage driver is camelCase
		driver: "netlify-blobs",
		options: {
			name: "movie-surf-sessions",
			// Sessions need strong consistency
			consistency: "strong",
		},
	},
	experimental: {
		session: true,
		contentIntellisense: true,
	},
});
