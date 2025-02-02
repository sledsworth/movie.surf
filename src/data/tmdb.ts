import type { Genre, Movie, Provider } from "src/actions/movie";

const TMDB_API_KEY = process.env.TMDB_API_KEY ?? import.meta.env.TMDB_API_KEY;

const PROVIDER_URLS: { [key: number]: string } = {
	8: "https://www.netflix.com/",
	9: "https://www.amazon.com/gp/video/",
	15: "https://www.hulu.com/",
	43: "https://www.starz.com/",
	283: "https://www.crunchyroll.com/",
	337: "https://www.disneyplus.com/",
	350: "https://www.apple.com/apple-tv-plus/",
	386: "https://www.peacocktv.com/",
	526: "https://www.amc.com/",
	531: "https://www.paramountplus.com/",
	1770: "https://www.paramountplus.com/",
	1899: "https://www.max.com/",
};

const MAIN_PROVIDERS = [
	8, // Netflix
	9, // Amazon Prime Video
	15, // Hulu
	43, // Starz
	// // 283, // Crunchyroll
	337, // Disney+
	350, // Apple TV+
	386, // Peacock
	526, // AMC+
	531, // Paramount+
	// 1770, // Paramount+ w/ Showtime
	1899, // Max
];

const genreCache: { [key: number]: Genre } = {};

export async function getAllGenres({ type }: { type: "movie" | "tv" }) {
	try {
		const response = await fetch(
			`https://api.themoviedb.org/3/genre/${type}/list?language=en&api_key=${TMDB_API_KEY}`,
		);
		const data = await response.json();
		for (const genre of data.genres) {
			genreCache[genre.id] = genre;
		}
		return data.genres as Genre[];
	} catch (error) {
		console.error("Error fetching movie genres:", error);
		throw error;
	}
}

export async function getGenreNameFromId(genreId: number) {
	if (genreCache[genreId]) {
		return genreCache[genreId].name;
	}
	const genres = await getAllGenres({ type: "movie" });
	return genres.find((g) => g.id === genreId)?.name;
}

export async function getMovieDetails(
	movieId: number | string,
): Promise<Movie | null> {
	try {
		const response = await fetch(
			`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}`,
		);
		const data = await response.json();
		const providers = await getMainMovieStreamProviders(movieId);
		return { ...data, providers };
	} catch (error) {
		console.error("Error fetching movie details:", error);
		throw error;
	}
}

export async function searchForMovie({
	title,
	year,
}: {
	title: string;
	year: number;
}): Promise<Movie | null> {
	try {
		const url = new URL("https://api.themoviedb.org/3/search/movie");
		url.searchParams.append("api_key", TMDB_API_KEY ?? "");
		url.searchParams.append("query", title);
		url.searchParams.append("primary_release_year", year.toString());
		const response = await fetch(url.toString());
		const data = await response.json();
		console.log(data);
		if (data.results.length > 0) {
			return getMovieDetails(data.results[0].id);
		}
	} catch (error) {
		console.error("Error fetching movie search results:", error);
	}
	return null;
}

export async function getAllMovieProviders() {
	try {
		const response = await fetch(
			`https://api.themoviedb.org/3/watch/providers/movie?api_key=${TMDB_API_KEY}`,
		);

		if (!response.ok) {
			throw new Error("Error fetching all movie providers");
		}
		const data = await response.json();
		return data.results.filter((provider: Provider) =>
			MAIN_PROVIDERS.includes(provider.provider_id),
		);
	} catch (error) {
		console.error("Error fetching all movie providers:", error);
		throw error;
	}
}

export async function getMainMovieStreamProviders(movieId: number | string) {
	const allProviders = await getMovieWatchProviders(movieId, []);
	return allProviders.flatrate.filter((provider) =>
		MAIN_PROVIDERS.includes(provider.provider_id),
	);
}

export async function getMovieWatchProviders(
	movieId: number | string,
	filteredProviders: number[],
) {
	try {
		const response = await fetch(
			`https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`,
		);
		const data = await response.json();
		const providers = data.results.US;
		return {
			flatrate: providers?.flatrate
				? filterProviders(providers.flatrate, filteredProviders)
				: [],
			buy: providers?.buy
				? filterProviders(providers.buy, filteredProviders)
				: [],
			rent: providers?.rent
				? filterProviders(providers.rent, filteredProviders)
				: [],
		};
	} catch (error) {
		console.error("Error fetching movie watch providers:", error);
		throw error;
	}
}

export function filterProviders(
	providers: Provider[],
	filteredProviders: number[] = [],
) {
	const ignoredProviderIds = [
		1825, // Amazon Channel for Max
		2077, // Plex Channel
		1796, // Netflix with Ads
		258, // Criterion Channel?
		268, // History Vault?
		2100, // Prime with Ads
		1968, // Crunchyroll on Amazon
		636, // MGM on Roku
		528, // AMC on Amazon
		...filteredProviders,
	];
	return providers.filter(
		(provider) => !ignoredProviderIds.includes(provider.provider_id),
	);
}
