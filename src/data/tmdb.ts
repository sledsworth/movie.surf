export interface Genre {
	id: number;
	name: string;
}

export interface Provider {
	name: string;
	id: number;
}

const TMDB_API_KEY = "9397736d8fdb6eb4dcb7ddf979963019";

const PROVIDER_URLS = {
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

export async function getAllGenres({ type }: { type: "movie" | "tv" }) {
	try {
		const response = await fetch(
			`https://api.themoviedb.org/3/genre/${type}/list?language=en&api_key=${TMDB_API_KEY}`,
		);
		const data = await response.json();
		return data.genres as Genre[];
	} catch (error) {
		console.error("Error fetching movie genres:", error);
		throw error;
	}
}

export async function getMoviesByGenre(genreIds: number[]) {
	try {
		const response = await fetch(
			`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreIds.join("|")}`,
		);
		const data = await response.json();
		return data.results;
	} catch (error) {
		console.error("Error fetching movies by genre:", error);
		throw error;
	}
}

export async function getMovieSuggestions({
	genres,
	good = true,
	decade,
	page = 1,
}: { genres: number[]; good: boolean; decade?: number; page: number }) {
	try {
		const url = new URL("https://api.themoviedb.org/3/discover/movie");
		url.searchParams.append("api_key", TMDB_API_KEY);
		url.searchParams.append("with_genres", genres.join(","));
		url.searchParams.append("page", page.toString());
		url.searchParams.append("watch_region", "US");
		url.searchParams.append("with_watch_providers", MAIN_PROVIDERS.join("|"));
		url.searchParams.append("with_watch_monetization_types", "flatrate");
		if (decade) {
			url.searchParams.append("primary_release_date.gte", `${decade}-01-01`);
			url.searchParams.append(
				"primary_release_date.lte",
				`${decade + 9}-12-31`,
			);
		}
		if (good) {
			url.searchParams.append("vote_average.gte", "7");
			url.searchParams.append("vote_count.gte", "200");
			url.searchParams.append("sort_by", "vote_average.desc");
		} else {
			url.searchParams.append("vote_average.lte", "3");
			url.searchParams.append("vote_count.gte", "50");
			url.searchParams.append("sort_by", "vote_average.asc");
		}
		const response = await fetch(url.toString());
		if (response.ok) {
			const data = await response.json();
			return {
				movies: data.results,
				totalPages: data.total_pages,
				totalResults: data.total_results,
			};
		}
		return {
			movies: [],
			totalPages: 0,
			totalResults: 0,
		};
	} catch (error) {
		console.error("Error fetching movie suggestions:", error);
		throw error;
	}
}

export async function getMovieDetails(movieId: number) {
	try {
		const response = await fetch(
			`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}`,
		);
		const data = await response.json();
		console.log(data);
		return data;
	} catch (error) {
		console.error("Error fetching movie details:", error);
		throw error;
	}
}

export function filterProviders(
	providers: any[],
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

export async function getAllMovieProviders() {
	try {
		const response = await fetch(
			`https://api.themoviedb.org/3/watch/providers/movie?api_key=${TMDB_API_KEY}`,
		);
		const data = await response.json();
		return data.results
			.filter((provider) => MAIN_PROVIDERS.includes(provider.provider_id))
			.map((provider) => ({
				name: provider.provider_name,
				id: provider.provider_id,
				url: PROVIDER_URLS[provider.provider_id],
				logo: provider.logo_path,
			}));
	} catch (error) {
		console.error("Error fetching all movie providers:", error);
		throw error;
	}
}

export async function getMainMovieStreamProviders(movieId: number) {
	const allProviders = await getMovieWatchProviders(movieId, []);
	return allProviders.flatrate.filter((provider) =>
		MAIN_PROVIDERS.includes(provider.provider_id),
	);
}

export async function getMovieWatchProviders(
	movieId: number,
	filteredProviders: number[],
) {
	try {
		const response = await fetch(
			`https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`,
		);
		console.log(response);
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
