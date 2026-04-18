import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getAuthUser} from "@/lib/auth";

export async function GET(
	req: NextRequest,
	{params}: {params: Promise<{tmdbId: string}>},
) {
	const user = getAuthUser(req);
	if (!user) {
		return NextResponse.json({friends: []});
	}

	const {tmdbId: tmdbIdStr} = await params;
	const tmdbId = parseInt(tmdbIdStr);

	const movie = await prisma.movie.findUnique({where: {tmdbId}});
	if (!movie) {
		return NextResponse.json({friends: []});
	}

	const following = await prisma.follow.findMany({
		where: {followerId: user.userId, status: "ACCEPTED"},
		select: {followingId: true},
	});
	const followingIds = following.map((f) => f.followingId);
	if (followingIds.length === 0) {
		NextResponse.json({friends: []});
	}

	const [ratings, comments, watchlistItems, friendsProfiles] =
		await Promise.all([
			prisma.rating.findMany({
				where: {movieId: movie.id, userId: {in: followingIds}},
				include: {user: {select: {username: true}}},
			}),
			prisma.comment.findMany({
				where: {movieId: movie.id, userId: {in: followingIds}},
				include: {user: {select: {username: true}}},
			}),
			prisma.watchlistItem.findMany({
				where: {movieId: movie.id, userId: {in: followingIds}},
				include: {user: {select: {username: true}}},
			}),
			prisma.user.findMany({
				where: {id: {in: followingIds}},
				select: {
					id: true,
					username: true,
					profileMovieId: true,
					coverMovieId: true,
				},
			}),
		]);

	const friendMap = new Map<string, any>();

	for (const p of friendsProfiles) {
		friendMap.set(p.id, {
			username: p.username,
			rating: null,
			comment: null,
			inWatchlist: false,
			isProfile: p.profileMovieId === tmdbId,
			isCover: p.coverMovieId === tmdbId,
		});
	}

	for (const r of ratings) {
		const f = friendMap.get(r.userId);
		if (f) f.rating = r.score;
	}
	for (const c of comments) {
		const f = friendMap.get(c.userId);
		if (f) f.comment = c.content;
	}
	for (const w of watchlistItems) {
		const f = friendMap.get(w.userId);
		if (f) f.inWatchlist = true;
	}

	// filtering out followings who have zero interaction with this movie
	const result = Array.from(friendMap.values()).filter(
		(f) =>
			f.rating !== null ||
			f.comment !== null ||
			f.inWatchlist ||
			f.isProfile ||
			f.isCover,
	);

	return NextResponse.json({friends: result});
}
