import { GEMINI_API_KEY, GEMINI_MODEL } from "astro:env/server";
import { GoogleGenAI, Type } from "@google/genai";
import type { MovieFormData, MovieSuggestionResults } from "src/actions/movie";
import { getAllGenres } from "./tmdb";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

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

	try {
		const response = await ai.models.generateContent({
			model: GEMINI_MODEL,
			contents: parts.join("\n"),
			config: {
				systemInstruction:
					"You are a movie expert that knows everything about movies. Provide movie suggestions to the user based on their prompt, if possible. If no movies can be found, set the error property of movie suggestions and `hasResults` property to `false`. Ideally you would provide at least 10 movies.",
				responseMimeType: "application/json",
				responseSchema: {
					type: Type.OBJECT,
					properties: {
						movies: {
							type: Type.ARRAY,
							items: {
								type: Type.OBJECT,
								properties: {
									title: { type: Type.STRING },
									year: { type: Type.NUMBER },
								},
								required: ["title", "year"],
							},
						},
						hasResults: { type: Type.BOOLEAN },
						error: {
							type: Type.OBJECT,
							properties: {
								message: { type: Type.STRING },
								status: { type: Type.NUMBER },
								name: { type: Type.STRING },
							},
						},
					},
					required: ["movies", "hasResults"],
				},
			},
		});

		const text = response.text;
		if (!text) {
			return {
				movies: [],
				hasResults: false,
				error: {
					message: "Gemini returned no content.",
					status: 500,
					name: "EmptyResponse",
				},
			};
		}

		return JSON.parse(text) as MovieSuggestionResults;
	} catch (error) {
		console.error("Error fetching movie suggestions from Gemini:", error);
		return {
			movies: [],
			hasResults: false,
			error: {
				message: `Failed to find movies from prompt. [${error}]`,
				status: 500,
				name: "GeminiError",
			},
		};
	}
}
