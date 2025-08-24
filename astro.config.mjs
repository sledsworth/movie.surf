import mdx from "@astrojs/mdx";
import netlify from "@astrojs/netlify";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://movie.surf",
	integrations: [mdx()],
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
		contentIntellisense: true,
	},
});
