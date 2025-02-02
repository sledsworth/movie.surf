import type { Movie } from "@actions/movie";

export function getSharingDetails(movie?: Movie | null) {
	return {
		title: movie
			? `🍿 Movie night!\n\n Let's watch "${movie?.title}"`
			: "Movie Surf",
		url: movie ? `https://movie.surf/movie/${movie?.id}` : "https://movie.surf",
		imageUrl: movie
			? `https://image.tmdb.org/t/p/w500${movie?.poster_path}`
			: "",
	};
}
