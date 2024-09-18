import { getRandomMovie } from "@data/tmdb";
import { defineAction } from "astro:actions";
import { z } from "astro:schema";

export const server = {
	randomMovie: defineAction({
		accept: "form",
		input: z.object({
			genres: z.array(z.string()).default([]),
			good: z.boolean(),
			decade: z.string().default("0"),
			page: z.string().default("1"),
			providers: z.array(z.string()).default([]),
		}),
		async handler(input) {
			const movie = getRandomMovie(input);
			return { movie };
		},
	}),
};
