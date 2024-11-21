import { getAiMovieSuggestions } from "./openai";
import {
	getAllGenres,
	searchForMovie,
	type Movie,
	type MovieFormData,
} from "./tmdb";

export async function getMovieSuggestion(
	data: FormData,
): Promise<Movie | undefined> {
	try {
		const movieGenres = await getAllGenres({ type: "movie" });

		if (data) {
			console.log(data);
			if (data.has("prompt")) {
				const formInfo: MovieFormData = {
					genres:
						(data.getAll("genres") as unknown as string[]).map(
							// biome-ignore lint/style/noNonNullAssertion: <explanation>
							(id) => movieGenres.find((g) => g.id.toString() === id)!.name,
						) || [],
					good: true,
					decade: data.has("decade")
						? Number.parseInt(data.get("decade")?.toString() || "0", 10)
						: undefined,
					page: 1,
					providers: (data.getAll("providers") as unknown as string[]) ?? [],
				};
				const suggestions = await getAiMovieSuggestions(
					data.get("prompt")?.toString() || "Blank Check",
					formInfo,
				);
				const movies = await Promise.all(
					suggestions.movies.map(
						(suggestion: { title: string; year: number }) => {
							return searchForMovie(suggestion);
						},
					),
				);
				// console.log(movies);
				let availibleMovie;
				const seenMovies = JSON.parse(data.get("seenMovies") as string) ?? [];
				for (const movie of movies) {
					console.log(
						movie.title,
						movie.providers,
						movie.id,
						seenMovies,
						seenMovies.includes(movie.id.toString()),
					);
					console.log(formInfo.providers, movie.providers);
					if (
						formInfo.providers &&
						movie.providers?.filter((provider) =>
							formInfo.providers?.includes(provider.provider_id.toString()),
						).length > 0
					) {
						if (!seenMovies.includes(movie.id.toString())) {
							return movie;
						}
						availibleMovie = movie;
					}
				}
				console.log(availibleMovie);
				return availibleMovie ?? movies[0];
			}
		}
	} catch (error) {
		if (error instanceof Error) {
			console.error(error.message);
		}
	}
}
