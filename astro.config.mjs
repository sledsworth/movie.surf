import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import { defineConfig, envField } from "astro/config";

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
 env: {
    schema: {
      TMDB_API_KEY: envField.string({ context: "server", access: "secret"}),
      OPENAI_API_KEY: envField.string({ context: "server", access: "secret" }),
      OPENAI_MODEL: envField.string({ context: "server", access: "public", default: 'gpt-4.1-nano' }),
    }
  }
});
