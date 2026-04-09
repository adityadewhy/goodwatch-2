import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getAuthUser} from "@/lib/auth";

export async function GET(
	req: NextRequest,
	{params}: {params: Promise<{username: string}>},
) {
	const currentUser = getAuthUser(req);
	const {username} = await params;

	const user = await prisma.user.findUnique({
		where: {username},
		include: {
			_count: {
				select: {
					ratings: true,
					comments: true,
					following: true,
					followers: true,
				},
			},
			ratings: {
				take: 5,
				orderBy: {createdAt: "desc"},
				include: {movie: true},
			},
			watchlist: {
				take: 5,
				orderBy: {addedAt: "desc"},
				include: {movie: true},
			},
			comments: {
				take: 5,
				orderBy: {createdAt: "desc"},
				include: {movie: true},
			},
		},
	});

	if (!user) {
		return NextResponse.json({error: "User not found"}, {status: 404});
	}

	let coverMovie = null;
	let profileMovie = null;

	if (user.coverMovieId) {
		coverMovie = await prisma.movie.findUnique({
			where: {tmdbId: user.coverMovieId},
		});
	}
	if (user.profileMovieId) {
		profileMovie = await prisma.movie.findUnique({
			where: {tmdbId: user.profileMovieId},
		});
	}

	const isOwnProfile = currentUser?.userId === user.id;

	let followStatus: "PENDING" | "ACCEPTED" | null = null;

	if (currentUser && !isOwnProfile) {
		const follow = await prisma.follow.findUnique({
			where: {
				followerId_followingId: {
					followerId: currentUser.userId,
					followingId: user.id,
				},
			},
		});
		if (follow) {
			followStatus = follow.status;
		}
	}

	// determine if they can see the sensitive data
	const canViewDetails = isOwnProfile || followStatus === "ACCEPTED";
	const {passwordHash, ...safeUser} = user;

	if (!canViewDetails) {
		// Strip out the private data before sending to the client!
		return NextResponse.json({
			user: {
				id: safeUser.id,
				username: safeUser.username,
				createdAt: safeUser.createdAt,
				_count: {ratings: 0, comments: 0, following: 0, followers: 0}, // Hidden
				ratings: [], // Hidden
				watchlist: [], // Hidden
				comments: [], // Hidden
			},
			coverMovie,
			profileMovie,
			followStatus,
			isOwnProfile,
			canViewDetails: false, // Tell the frontend it's locked
		});
	}

	// If they are allowed, send everything
	return NextResponse.json({
		user: safeUser,
		coverMovie,
		profileMovie,
		followStatus,
		isOwnProfile,
		canViewDetails: true,
	});
}
