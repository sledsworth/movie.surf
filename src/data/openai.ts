import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

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

export async function getMovieSuggestions(prompt: string) {
	const completion = await openai.chat.completions.create({
		model: "gpt-4o",

		messages: [
			{
				role: "system",
				content:
					"You are a movie expert that knows everything about movies. Provide movie suggestions to the user based on their prompt, if possible. If no movies can be found, set the error property of movie suggestions.",
			},
			{ role: "user", content: prompt },
		],
		response_format: zodResponseFormat(MovieSuggestions, "movies"),
	});
	console.log(completion.choices.length);
	console.log(completion.choices[0].message);
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
