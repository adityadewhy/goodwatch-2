import {NextRequest, NextResponse} from "next/server";
import {searchMovies, getPosterUrl} from "@/lib/tmdb";
import next from "next";

export async function GET(req: NextRequest) {
	const {searchParams} = new URL(req.url);
	const query = searchParams.get("q");

	if (!query || query.trim().length === 0) {
		return NextResponse.json(
			{error: "search query is required"},
			{status: 400},
		);
	}

	if (query.trim().length < 2) {
		return NextResponse.json({error: "query chars must be >=2"}, {status: 400});
	}

	try {
		const results = await searchMovies(query.trim());

		const movies = results.slice(0, 10).map((movie) => ({
			tmdbId: movie.id,
			title: movie.title,
			year: movie.release_date
				? new Date(movie.release_date).getFullYear()
				: null,
			posterUrl: getPosterUrl(movie.poster_path),
			rating: movie.vote_average,
		}));

		return NextResponse.json({movies});
	} catch (error) {
		console.error("error searching movies", error);
		return NextResponse.json({error: "failed to search movie"}, {status: 500});
	}
}
