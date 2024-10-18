import OpenAI from "openai";
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
					"You are a movie expert that knows everything about movies. Suggest three movies to the user based on their prompt, if possible. The results should be presented in valid JSON format { movies: [{ title: string; year: number; }]}. Set an error if there aren't any movie results based on the prompt given. The results should be valid JSON and not markdown.",
			},
			{ role: "user", content: prompt },
			{
				role: "system",
				content:
					"The results need to be valid JSON without the markdown backticks.",
			},
		],
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
