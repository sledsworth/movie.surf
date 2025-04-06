import type { Genre, Movie, Provider } from "src/actions/movie";

const TMDB_API_KEY = process.env.TMDB_API_KEY ?? import.meta.env.TMDB_API_KEY;

const PROVIDER_URLS: { [key: number]: string } = {
	2: "https://www.apple.com/apple-tv-plus/",
	3: "https://play.google.com/store/search?q={search}&c=movies",
	8: "https://www.netflix.com/",
	9: "https://www.amazon.com/gp/video/",
	10: "https://www.amazon.com/s?k={search}&i=instant-video",
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

const PURCHASE_PROVIDERS = [
	2, // Apple TV
	3, // Google Play
	10, // Amazon Video
];

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
		const providers = await getMainMovieStreamProviders({
			movieId,
			search: data.title,
			year: new Date(data.release_date).getFullYear(),
		});
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
		const stream = data.results
			.filter((provider: Provider) =>
				MAIN_PROVIDERS.includes(provider.provider_id),
			)
			.map((provider: Provider) => ({
				...provider,
				url: PROVIDER_URLS[provider.provider_id],
			}));
		const buy = data.results
			.filter((provider: Provider) =>
				PURCHASE_PROVIDERS.includes(provider.provider_id),
			)
			.map((provider: Provider) => ({
				...provider,
				url: PROVIDER_URLS[provider.provider_id],
			}));
		return {
			stream,
			buy,
		};
	} catch (error) {
		console.error("Error fetching all movie providers:", error);
		throw error;
	}
}

export async function getMainMovieStreamProviders(options: {
	movieId: number | string;
	filteredProviders?: number[];
	search?: string;
	year?: number;
}) {
	const allProviders = await getMovieWatchProviders(options);
	return {
		stream: allProviders.flatrate.filter((provider) =>
			MAIN_PROVIDERS.includes(provider.provider_id),
		),
		buy: allProviders.buy.filter((provider) =>
			PURCHASE_PROVIDERS.includes(provider.provider_id),
		),
	};
}

export async function getMovieWatchProviders({
	movieId,
	filteredProviders = [],
	search = "",
	year,
}: {
	movieId: number | string;
	filteredProviders?: number[];
	search?: string;
	year?: number;
}) {
	try {
		const response = await fetch(
			`https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`,
		);
		const data = await response.json();
		const providers = data.results.US;
		return {
			flatrate: providers?.flatrate
				? await filterProviders(
						providers.flatrate,
						filteredProviders,
						search,
						year,
					)
				: [],
			buy: providers?.buy
				? await filterProviders(providers.buy, filteredProviders, search, year)
				: [],
			rent: providers?.rent
				? await filterProviders(providers.rent, filteredProviders, search, year)
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
	search = "",
	year?: number,
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

	const encodedSearch = encodeURIComponent(search);

	return Promise.all(
		providers
			.filter((provider) => !ignoredProviderIds.includes(provider.provider_id))
			.map(async (provider: Provider) => {
				let url = PROVIDER_URLS[provider.provider_id]?.replace(
					"{search}",
					encodedSearch,
				);
				if (provider.provider_id === 2) {
					url = (await getAppleTVStoreLink(search, year)) ?? "";
				}
				return {
					...provider,
					url,
				};
			}),
	);
}

export async function getAppleTVStoreLink(search: string, year?: number) {
	const searchURL = new URL("https://itunes.apple.com/search");

	searchURL.searchParams.set("media", "movie");
	searchURL.searchParams.set("entity", "movie");
	searchURL.searchParams.set("lang", "en_us");
	searchURL.searchParams.set("country", "US");
	searchURL.searchParams.set("term", search);

	try {
		const response = await fetch(searchURL);
		const data = await response.json();
		const filteredResults = data.results.filter(
			(movie: { releaseDate: string }) => {
				const releaseYear = new Date(movie.releaseDate).getFullYear();
				return releaseYear === year;
			},
		);
		return filteredResults.length > 0 ? filteredResults[0].trackViewUrl : null;
	} catch (error) {
		console.error("Error fetching Apple TV store link:", error);
		return null;
	}
}
