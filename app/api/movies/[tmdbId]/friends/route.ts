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

	const [ratings, comments, watchlistItems] = await Promise.all([
		prisma.rating.findMany({
			where: {movieId: movie.id, userId: {in: followingIds}},
			include: {user: {select: {username: true}}},
		}),
		prisma.comment.findMany({
			where: {movieId: movie.id, userId: {in: followingIds}},
			include: {user: {select: {username: true}}},
		}),
		prisma.watchlistItem.findMany({
			where: {movieid: movie.id, userId: {in: followingIds}},
			include: {user: {select: {username: true}}},
		}),
	]);

	const friendMap = new Map<
		string,
		{
			username: string;
			rating: number | null;
			comment: string | null;
			inWatchlist: boolean;
		}
	>();

	for (const r of ratings) {
		friendMap.set(r.userId, {
			username: r.user.username,
			rating: r.score,
			comment: null,
			inWatchlist: false,
		});
	}

	for (const c of comments) {
		const existing = friendMap.get(c.userId);
		if (existing) {
			existing.comment = c.content;
		} else {
			friendMap.set(c.userId, {
				username: c.user.username,
				rating: null,
				comment: c.content,
				inWatchlist: false,
			});
		}
	}

	for (const w of watchlistItems) {
		const existing = friendMap.get(w.userId);
		if (existing) {
			existing.inWatchlist = true;
		} else {
			friendMap.set(w.userId, {
				username: w.user.username,
				rating: null,
				comment: null,
				inWatchlist: true,
			});
		}
	}

	return NextResponse.json({friends: Array.from(friendMap.values())});
}
