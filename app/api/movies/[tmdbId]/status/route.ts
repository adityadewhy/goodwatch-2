import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getAuthUser} from "@/lib/auth";

export async function GET(
	req: NextRequest,
	{params}: {params: Promise<{tmdbId: string}>},
) {
	const user = getAuthUser(req);
	const {tmdbId: tmdbIdStr} = await params;
	const tmdbId = parseInt(tmdbIdStr);

	const movie = await prisma.movie.findUnique({where: {tmdbId}});

	if (!movie) {
		return NextResponse.json({
			rating: null,
			inWatchlist: false,
			comment: null,
		});
	}
	if (!user) {
		return NextResponse.json({
			rating: null,
			inWatchlist: false,
			comment: null,
		});
	}

	const [rating, watchlistItem, comment, dbUser] = await Promise.all([
		prisma.rating.findUnique({
			where: {userId_movieId: {userId: user.userId, movieId: movie.id}},
		}),
		prisma.watchlistItem.findUnique({
			where: {userId_movieId: {userId: user.userId, movieId: movie.id}},
		}),
		prisma.comment.findFirst({
			where: {userId: user.userId, movieId: movie.id},
		}),

		// Fetch the user to check their profile/cover IDs
		prisma.user.findUnique({
			where: {id: user.userId},
			select: {profileMovieId: true, coverMovieId: true},
		}),
	]);

	return NextResponse.json({
		rating: rating?.score ?? null,
		inWatchlist: !!watchlistItem,
		comment: comment ? {id: comment.id, content: comment.content} : null,
		isProfile: dbUser?.profileMovieId === tmdbId,
		isCover: dbUser?.coverMovieId === tmdbId,
	});
}
