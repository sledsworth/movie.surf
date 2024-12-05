import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { MovieFormData } from "./tmdb";

const Movie = z.object({
	title: z.string(),
	year: z.number(),
});

const MovieSuggestions = z.object({
	movies: z.array(Movie),
	error: z.string().optional(),
});

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY ?? import.meta.env.OPENAI_API_KEY,
});

export async function getAiMovieSuggestions(
	prompt: string,
	movieFormData?: MovieFormData,
) {
	const additionalPrompts: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
		[];
	if (movieFormData?.decade) {
		additionalPrompts.push({
			content: `Should be from the decade: ${movieFormData?.decade}s.`,
			role: "user",
		});
	}
	if (movieFormData?.genres) {
		additionalPrompts.push({
			content: `Should be in the genres: ${movieFormData?.genres.join(", ")}.`,
			role: "user",
		});
	}
	if (movieFormData?.good) {
		additionalPrompts.push({
			content: "Should be critically acclaimed movies only.",
			role: "user",
		});
	}
	if (movieFormData?.seenMovies) {
		additionalPrompts.push({
			content: `Should not include movies: ${movieFormData?.seenMovies.join(", ")}.`,
			role: "user",
		});
	}
	// console.log(additionalPrompts);
	const completion = await openai.chat.completions.create({
		model: "gpt-4o",
		temperature: 1.5,
		// top_p: 1,
		messages: [
			{
				role: "system",
				content:
					"You are a movie expert that knows everything about movies. Provide movie suggestions to the user based on their prompt, if possible. If no movies can be found, set the error property of movie suggestions.",
			},
			{ role: "user", content: prompt },
			...additionalPrompts,
		],
		response_format: zodResponseFormat(MovieSuggestions, "movies"),
		store: true,
		metadata: {
			source: "movie.surf",
		},
	});
	// console.log(completion.choices.length);
	// console.log(completion.choices[0].message);
	try {
		const data = JSON.parse(
			completion.choices[0].message.content ?? "{ movies: [] }",
		);
		return data;
	} catch (error) {
		console.error("Error parsing movie suggestions:", error);
		return { movies: [], error: "Failed to find movies from prompt." };
	}
}
