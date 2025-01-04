import { getMovieDetails } from "@data/tmdb";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, request }) => {
	const id = params.id;

	if (!id) {
		return new Response(null, {
			status: 500,
			statusText: "`id` parameter is required.",
		});
	}

	const movie = await getMovieDetails(id);
	if (!movie) {
		return new Response(null, {
			status: 404,
			statusText: `Movie for \`id\` of ${id} not found.`,
		});
	}

	return new Response(JSON.stringify(getMovieDetails(id)));
};
