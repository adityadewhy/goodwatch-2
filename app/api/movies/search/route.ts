import {NextRequest, NextResponse} from "next/server";
import {searchMulti, getPosterUrl} from "@/lib/tmdb";

export async function GET(req: NextRequest) {
	const {searchParams} = new URL(req.url);
	const query = searchParams.get("q");

	if (!query || query.trim().length < 2) {
		return NextResponse.json({error: "Query too short"}, {status: 400});
	}

	try {
		const results = await searchMulti(query.trim());

		const items = results.slice(0, 10).map((item) => {
			if (item.media_type === "movie") {
				return {
					tmdbId: item.id,
					mediaType: "movie" as const,
					title: item.title,
					year: item.release_date
						? new Date(item.release_date).getFullYear()
						: null,
					posterUrl: getPosterUrl(item.poster_path),
					rating: Math.round(item.vote_average * 10) / 10,
				};
			} else {
				return {
					tmdbId: item.id,
					mediaType: "tv" as const,
					title: item.name, // TV uses 'name'
					year: item.first_air_date
						? new Date(item.first_air_date).getFullYear()
						: null,
					posterUrl: getPosterUrl(item.poster_path),
					rating: Math.round(item.vote_average * 10) / 10,
				};
			}
		});

		return NextResponse.json({movies: items});
	} catch (error) {
		console.error("Search error:", error);
		return NextResponse.json({error: "Search failed"}, {status: 500});
	}
}
