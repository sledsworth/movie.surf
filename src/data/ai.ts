import { AI_PROVIDER } from "astro:env/server";
import type { MovieFormData, MovieSuggestionResults } from "src/actions/movie";

export async function getAiMovieSuggestions(
	movieFormData: MovieFormData,
): Promise<MovieSuggestionResults> {
	if (AI_PROVIDER === "gemini") {
		const { getAiMovieSuggestions: gemini } = await import("./gemini");
		return gemini(movieFormData);
	}
	if (AI_PROVIDER === "claude") {
		const { getAiMovieSuggestions: claude } = await import("./claude");
		return claude(movieFormData);
	}
	const { getAiMovieSuggestions: openai } = await import("./openai");
	return openai(movieFormData);
}
