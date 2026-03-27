import {NextRequest, NextResponse} from "next/server";
import {getMovieDetails, getPosterUrl} from "@/lib/tmdb";
import {Prisma} from "@prisma/client";
import {prisma} from "@/lib/prisma";

export async function GET(
	req: NextRequest,
	{params}: {params: Promise<{tmdbId: string}>},
) {
	const {tmdbId: tmdbIdStr} = await params;
	const tmdbId = parseInt(tmdbIdStr);

	if (isNaN(tmdbId)) {
		return NextResponse.json({error: "invalid movie id"}, {status: 400});
	}

	try {
		const cached = await prisma.movie.findUnique({
			where: {tmdbId},
		});

		const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
		if (cached && cached.cachedAt > oneDayAgo) {
			return NextResponse.json({movie: cached});
		}

		//if not fetching from cache, proceed.
		const tmdbMovie = await getMovieDetails(tmdbId);
		const director =
			tmdbMovie.credits?.crew.find((person) => person.job === "Director")
				?.name ?? null;

		const cast =
			tmdbMovie.credits?.cast.slice(0, 5).map((person) => person.name) ?? [];

		//move fetched data to db. upsert = update if exists, create if not
		const movie = await prisma.movie.upsert({
			where: {tmdbId},
			update: {
				title: tmdbMovie.title,
				year: tmdbMovie.release_date
					? new Date(tmdbMovie.release_date).getFullYear()
					: null,
				posterPath: getPosterUrl(tmdbMovie.poster_path),
				plot: tmdbMovie.overview,
				cachedAt: new Date(),
			},
			create: {
				tmdbId,
				title: tmdbMovie.title,
				year: tmdbMovie.release_date
					? new Date(tmdbMovie.release_date).getFullYear()
					: null,
				posterPath: getPosterUrl(tmdbMovie.poster_path),
				plot: tmdbMovie.overview,
				tmdbRating: tmdbMovie.vote_average,
			},
		});

        //reached here without returning cacheData, now have to return freshData
        return NextResponse.json({
            movie: {
                ...movie,
                director,
                cast,
            }
        })
	} catch (error){
        console.error("movie details error:", error)
        return NextResponse.json(
            {error: "failed fetching movie details"},
            {status: 500}
        )
    }
}
