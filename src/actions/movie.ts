import { defineAction } from "astro:actions";
import { z } from "astro:schema";

export const MovieSuggestionSchema = z.object({
	title: z.string(),
	year: z.number(),
});

export const GenreSchema = z.object({
	id: z.number(),
	name: z.string(),
});

export const ProviderSchema = z.object({
	provider_id: z.number(),
	provider_name: z.string(),
	logo_path: z.string(),
	display_priority: z.number(),
});

export const MovieSchema = z.object({
	id: z.number(),
	imdb_id: z.number(),
	title: z.string(),
	tagline: z.string(),
	overview: z.string(),
	poster_path: z.string(),
	backdrop_path: z.string(),
	release_date: z.string(),
	vote_average: z.number(),
	vote_count: z.number(),
	genres: z.array(GenreSchema),
	runtime: z.number(),
	providers: z.array(ProviderSchema).optional(),
});

export const MovieFormDataSchema = z.object({
	prompt: z.string().default("One of the best movies ever made."),
	genres: z.array(z.coerce.number()),
	good: z.boolean().default(true),
	decade: z.number().optional(),
	page: z.coerce.number().default(1),
	providers: z.array(z.coerce.number()).optional(),
	seenMovies: z.array(z.string()).optional(),
});

export type Movie = z.infer<typeof MovieSchema>;
export type MovieFormData = z.infer<typeof MovieFormDataSchema>;
export type MovieSuggestion = z.infer<typeof MovieSuggestionSchema>;
export type Genre = z.infer<typeof GenreSchema>;
export type Provider = z.infer<typeof ProviderSchema>;

export const movie = {
	suggestion: defineAction({
		input: MovieFormDataSchema,
		handler: (input, context) => {},
	}),
	find: defineAction({
		input: MovieSuggestionSchema,
		handler: (input, context) => {},
	}),
	select: defineAction({
		input: MovieSchema,
		handler: (input, context) => {},
	}),
};
