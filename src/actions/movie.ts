import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { getAiMovieSuggestions } from "@data/openai";
import { searchForMovie } from "@data/tmdb";

export const MovieSuggestionSchema = z.object({
	title: z.string(),
	year: z.coerce.number(),
});

export const MovieSuggestionResultsSchema = z.object({
	movies: z.array(MovieSuggestionSchema),
	hasResults: z.boolean(),
	error: z
		.object({
			message: z.string().optional(),
			status: z.number().optional(),
			name: z.string().optional(),
		})
		.optional(),
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
	url: z.string().optional(),
});

export const AllProvidersSchema = z.object({
	buy: z.array(ProviderSchema).optional(),
	stream: z.array(ProviderSchema).optional(),
});

export const MovieSchema = z.object({
	id: z.number(),
	imdb_id: z.union([z.string().optional(), z.null()]),
	title: z.string(),
	tagline: z.string(),
	overview: z.string(),
	poster_path: z.union([z.string().optional(), z.null()]),
	backdrop_path: z.union([z.string().optional(), z.null()]),
	release_date: z.string(),
	vote_average: z.number(),
	vote_count: z.number(),
	genres: z.array(GenreSchema),
	runtime: z.number(),
	providers: AllProvidersSchema,
});

export const LimitedMovieSchema = z.object({
	id: z.number(),
	title: z.string(),
	release_date: z.string(),
	poster_path: z.union([z.string().optional(), z.null()]),
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
export type LimitedMovie = z.infer<typeof LimitedMovieSchema>;
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
			context.session?.set("movieFormData", input);
			const seenMovies: Movie[] =
				(await context.session?.get("viewedMovies")) ?? [];
			try {
				const suggestions = await getAiMovieSuggestions({
					...input,
					seenMovies: seenMovies?.map((movie) => movie.title),
				});
				return suggestions;
			} catch (error) {
				// TODO: Redirect to open ai error page that asks for money on a 429
				console.error("Error getting AI movie suggestions.", error);
				throw new ActionError({
					message: "Error getting AI movie suggestions.",
					code: "INTERNAL_SERVER_ERROR",
				});
			}
		},
	}),
	find: defineAction({
		input: z.array(MovieSuggestionSchema),
		handler: async (input): Promise<Movie[]> => {
			try {
				return (
					await Promise.all(
						input.map((suggestion) => searchForMovie(suggestion)),
					)
				).filter((movie) => movie !== undefined && movie !== null);
			} catch (error) {
				console.error("Error finding movie from AI suggestions.", error);
				throw new ActionError({
					message: "Error finding movie from AI suggestions.",
					code: "INTERNAL_SERVER_ERROR",
				});
			}
		},
	}),
	select: defineAction({
		input: z.array(MovieSchema),
		handler: async (input, context) => {
			const viewedMovies: LimitedMovie[] =
				(await context.session?.get("viewedMovies")) ?? [];
			const formData = await context.session?.get("movieFormData");
			try {
				console.debug("select -> formData: ", formData);
				console.debug("select -> viewedMovies (session): ", viewedMovies);
				let availibleMovie: Movie | undefined;
				for (const movie of input) {
					if (
						formData?.providers === undefined ||
						([
							...(movie.providers?.stream ?? []),
							...(movie.providers?.buy ?? []),
						].filter(
							(provider: Provider) =>
								(formData?.providers ?? []).includes(provider.provider_id) ??
								false,
						).length ?? 0) > 0
					) {
						if (
							!viewedMovies.find((viewedMovie) => viewedMovie.id === movie.id)
						) {
							console.debug(
								"select -> viewedMovies (session) -> updated: ",
								viewedMovies,
							);
							return movie;
						}
						availibleMovie = movie;
					}
				}
				return availibleMovie ?? input[0];
			} catch (error) {
				console.error("Error selecting a movie from available options.", error);
				throw new ActionError({
					message: "Error selecting a movie from available options.",
					code: "INTERNAL_SERVER_ERROR",
				});
			}
		},
	}),
	previousSuggestions: defineAction({
		handler: async (_input, context) => {
			try {
				const viewedMovies: LimitedMovie[] =
					(await context.session?.get("viewedMovies")) ?? [];
				return viewedMovies;
			} catch (error) {
				console.error("Error getting previous suggestions.", error);
				throw new ActionError({
					message: "Error getting previous suggestions.",
					code: "INTERNAL_SERVER_ERROR",
				});
			}
		},
	}),
	resetSession: defineAction({
		handler: async (_input, context) => {
			try {
				context.session?.destroy();
				return true;
			} catch (error) {
				console.error("Error resetting session.", error);
				throw new ActionError({
					message: "Error resetting session.",
					code: "INTERNAL_SERVER_ERROR",
				});
			}
		},
	}),
};
