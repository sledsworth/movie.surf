import { getAiMovieSuggestions } from "@data/openai.new";
import { searchForMovie } from "@data/tmdb.new";
import { defineAction } from "astro:actions";
import { z } from "astro:schema";

export const MovieSuggestionSchema = z.object({
	title: z.string(),
	year: z.coerce.number(),
});

export const MovieSuggestionResultsSchema = z.object({
	movies: z.array(MovieSuggestionSchema),
	hasResults: z.boolean(),
	error: z.string().optional(),
});

export const GenreSchema = z.object({
	id: z.coerce.number(),
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
	imdb_id: z.string().optional(),
	title: z.string(),
	tagline: z.string(),
	overview: z.string(),
	poster_path: z.string(),
	backdrop_path: z.string().optional(),
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
	providers: z.array(z.coerce.number()).optional(),
	seenMovies: z.array(z.string()).optional(),
});

export type Movie = z.infer<typeof MovieSchema>;
export type MovieFormData = z.infer<typeof MovieFormDataSchema>;
export type MovieSuggestion = z.infer<typeof MovieSuggestionSchema>;
export type MovieSuggestionResults = z.infer<
	typeof MovieSuggestionResultsSchema
>;
export type Genre = z.infer<typeof GenreSchema>;
export type Provider = z.infer<typeof ProviderSchema>;

export const movie = {
	suggestion: defineAction({
		input: MovieFormDataSchema,
		handler: async (input, context) => {
			console.log("movieFormData", input, context.session);
			await context.session?.set("movieFormData", input);
			const seenMovies: Movie[] =
				(await context.session?.get("viewedMovies")) ?? [];
			try {
				const suggestions = await getAiMovieSuggestions({
					...input,
					seenMovies: seenMovies?.map((movie) => movie.title),
				});
				// console.log(suggestions);
				return suggestions;
			} catch (error) {
				throw new Error("Error getting AI movie suggestions.");
			}
		},
	}),
	find: defineAction({
		input: z.array(MovieSuggestionSchema),
		handler: async (input, context): Promise<Movie[]> => {
			try {
				return (
					await Promise.all(
						input.map((suggestion) => searchForMovie(suggestion)),
					)
				).filter((movie) => movie !== undefined && movie !== null);
			} catch (error) {
				throw new Error("Error finding movie from AI suggestions.");
			}
		},
	}),
	select: defineAction({
		input: z.array(MovieSchema),
		handler: async (input, context) => {
			const viewedMovies: Partial<Movie>[] =
				(await context.session?.get("viewedMovies")) ?? [];
			const formData = await context.session?.get("movieFormData");
			try {
				console.log("formData", formData);
				console.log("viewed movie ids: ", viewedMovies);
				let availibleMovie: Movie | undefined;
				for (const movie of input) {
					console.log("provided", formData?.providers, movie.providers);
					if (
						formData?.providers === undefined ||
						(movie.providers?.filter(
							(provider: Provider) =>
								(formData?.providers ?? []).includes(provider.provider_id) ??
								false,
						).length ?? 0) > 0
					) {
						if (
							!viewedMovies.find((viewedMovie) => viewedMovie.id === movie.id)
						) {
							viewedMovies.push({
								id: movie.id,
								title: movie.title,
								release_date: movie.release_date,
							});
							console.log("viewed movie id added: ", viewedMovies);
							context.session?.set("viewedMovies", viewedMovies);
							return movie;
						}
						availibleMovie = movie;
					}
				}
				return availibleMovie ?? input[0];
			} catch (error) {
				throw new Error("Error selecting a movie from available options.");
			}
		},
	}),
};
