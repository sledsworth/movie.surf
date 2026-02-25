import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://movie.surf",
	integrations: [mdx()],
	server: {
		port: 3002,
	},
	prefetch: true,
	adapter: cloudflare({
		platformProxy: { enabled: true },
	}),
	experimental: {
		contentIntellisense: true,
	},
});
