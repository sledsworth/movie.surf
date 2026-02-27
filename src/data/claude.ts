import { CLAUDE_API_KEY, CLAUDE_MODEL } from "astro:env/server";
import Anthropic from "@anthropic-ai/sdk";
import {
	type MovieFormData,
	type MovieSuggestionResults,
	MovieSuggestionResultsSchema,
} from "src/actions/movie";
import { getAllGenres } from "./tmdb";

const client = new Anthropic({ apiKey: CLAUDE_API_KEY });

export async function getAiMovieSuggestions(
	movieFormData: MovieFormData,
): Promise<MovieSuggestionResults> {
	const parts: string[] = [];

	if (movieFormData.prompt) {
		parts.push(movieFormData.prompt);
	}
	if (movieFormData.decade) {
		parts.push(`Should be from the decade: ${movieFormData.decade}s.`);
	}
	if (movieFormData.genres.length > 0) {
		const allGenres = await getAllGenres({ type: "movie" });
		const genres = movieFormData.genres
			.map((genreId) => allGenres.find((g) => g.id === genreId)?.name)
			.filter(Boolean);
		parts.push(`Should be in the genres: ${genres.join(", ")}.`);
	}
	if (movieFormData.seenMovies && movieFormData.seenMovies.length > 0) {
		parts.push(
			`Should not include movies: ${movieFormData.seenMovies.join(", ")}.`,
		);
	}

	const resultSchema = {
		type: "object" as const,
		properties: {
			movies: {
				type: "array" as const,
				items: {
					type: "object" as const,
					properties: {
						title: { type: "string" as const },
						year: { type: "number" as const },
					},
					required: ["title", "year"],
				},
			},
			hasResults: { type: "boolean" as const },
			error: {
				type: "object" as const,
				properties: {
					message: { type: "string" as const },
					status: { type: "number" as const },
					name: { type: "string" as const },
				},
			},
		},
		required: ["movies", "hasResults"],
	};

	try {
		const response = await client.messages.create({
			model: CLAUDE_MODEL,
			max_tokens: 4096,
			system:
				"You are a movie expert that knows everything about movies. Provide movie suggestions to the user based on their prompt, if possible. If no movies can be found, set the error property of movie suggestions and `hasResults` property to `false`. Ideally you would provide at least 10 movies.",
			messages: [{ role: "user", content: parts.join("\n") }],
			tools: [
				{
					name: "movie_suggestions",
					description: "Return structured movie suggestions",
					input_schema: resultSchema,
				},
			],
			tool_choice: { type: "tool", name: "movie_suggestions" },
		});

		const toolUse = response.content.find((block) => block.type === "tool_use");
		if (!toolUse || toolUse.type !== "tool_use") {
			return {
				movies: [],
				hasResults: false,
				error: {
					message: "Claude returned no tool use.",
					status: 500,
					name: "EmptyResponse",
				},
			};
		}

		const parsed = MovieSuggestionResultsSchema.safeParse(toolUse.input);
		if (!parsed.success) {
			console.error(
				"Failed to validate:",
				JSON.stringify(parsed.error.issues, null, 2),
			);
			// Attempt a lenient parse: pick only title/year from each movie
			const raw = toolUse.input as { movies?: unknown[]; hasResults?: boolean };
			const movies = (raw.movies ?? [])
				.map((m) => {
					const movie = m as Record<string, unknown>;
					return {
						title: String(movie.title ?? ""),
						year: Number(movie.year ?? 0),
					};
				})
				.filter((m) => m.title);
			return {
				movies,
				hasResults: movies.length > 0,
				error: { message: "", status: 0, name: "" },
			};
		}

		return parsed.data;
	} catch (error) {
		if (error instanceof Anthropic.APIError) {
			console.error(
				`Error fetching movie suggestions from Claude: [${error.status}] ${error.message}`,
			);
			return {
				movies: [],
				hasResults: false,
				error: {
					message: error.message,
					status: error.status ?? 500,
					name: error.name,
				},
			};
		}
		console.error("Error fetching movie suggestions from Claude:", error);
		return {
			movies: [],
			hasResults: false,
			error: {
				message: `Failed to find movies from prompt. [${error}]`,
				status: 500,
				name: "ClaudeError",
			},
		};
	}
}
