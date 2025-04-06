import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
	type MovieFormData,
	type MovieSuggestionResults,
	MovieSuggestionResultsSchema,
} from "src/actions/movie";
import { getGenreNameFromId } from "./tmdb";

const apiKey = process.env.OPENAI_API_KEY ?? import.meta.env.OPENAI_API_KEY;
const aiModel: OpenAI.Chat.ChatModel =
	process.env.OPENAI_MODEL ?? import.meta.env.OPENAI_MODEL ?? "gpt-4o";

const openai = new OpenAI({
	apiKey,
	timeout: 25 * 1000, // 25 second timeout
	maxRetries: 3,
});

export async function getAiMovieSuggestions(
	movieFormData: MovieFormData,
): Promise<MovieSuggestionResults> {
	const prompts: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

	if (movieFormData.prompt) {
		prompts.push({
			content: movieFormData.prompt,
			role: "user",
		});
	}
	if (movieFormData.decade) {
		prompts.push({
			content: `Should be from the decade: ${movieFormData?.decade}s.`,
			role: "user",
		});
	}
	if (movieFormData.genres.length > 0) {
		const genres = await Promise.all(
			movieFormData.genres.map((genreId) => getGenreNameFromId(genreId)),
		);
		prompts.push({
			content: `Should be in the genres: ${genres.join(", ")}.`,
			role: "user",
		});
	}
	// if (movieFormData.good) {
	// 	prompts.push({
	// 		content: "Should be critically acclaimed movies only.",
	// 		role: "user",
	// 	});
	// }
	if (movieFormData.seenMovies && movieFormData.seenMovies.length > 0) {
		prompts.push({
			content: `Should not include movies: ${movieFormData.seenMovies.join(", ")}.`,
			role: "user",
		});
	}
	let completion: OpenAI.Chat.Completions.ChatCompletion;
	try {
		completion = await openai.chat.completions.create({
			model: aiModel,
			temperature: 1.5,
			// top_p: 1,
			messages: [
				{
					role: "system",
					content:
						"You are a movie expert that knows everything about movies. Provide movie suggestions to the user based on their prompt, if possible. If no movies can be found, set the error property of movie suggestions and `hasResults` property to `false`. Ideally you would provide at least 10 movies.",
				},
				...prompts,
			],
			response_format: zodResponseFormat(
				MovieSuggestionResultsSchema,
				"movies",
			),
			store: true,
			metadata: {
				source: "movie.surf",
			},
		});
	} catch (error) {
		if (error instanceof OpenAI.APIError) {
			console.error(
				`Error fetching movie suggestions: [${error.status}] ${error.message}`,
			);

			return {
				movies: [],
				hasResults: false,
				error: {
					message: error.message,
					status: error.status,
					name: error.name,
				},
			};
		}
		console.error("Error fetching movie suggestions:", error);
		return {
			movies: [],
			hasResults: false,
			error: {
				message: `Failed to find movies from prompt. [${error}]`,
			},
		};
	}

	try {
		const data = JSON.parse(
			completion.choices[0].message.content ??
				"{ movies: [], hasResults: false, error: 'OpenAI failed to produce results from input.' }",
		);
		return data as MovieSuggestionResults;
	} catch (error) {
		console.error("Error parsing movie suggestions:", error);
		return {
			movies: [],
			hasResults: false,
			error: {
				message: "Failed to find movies from prompt.",
			},
		};
	}
}
