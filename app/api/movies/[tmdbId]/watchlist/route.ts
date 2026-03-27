import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getAuthUser} from "@/lib/auth";

export async function POST(
	req: NextRequest,
	{params}: {params: Promise<{tmdbId: string}>},
) {
	const user = getAuthUser(req);
	if (!user) {
		return NextResponse.json({error: "unauthorized"}, {status: 401});
	}

	const {tmdbId: tmdbIdStr} = await params;
	const tmdbId = parseInt(tmdbIdStr);

	const movie = await prisma.movie.findUnique({where: {tmdbId}});
	if (!movie) {
		return NextResponse.json(
			{error: "movie not found, view movie page first"},
			{status: 404},
		);
	}

	const existing = await prisma.watchlistItem.findUnique({
		where: {
			userId_movieId: {
				userId: user.userId,
				movieId: movie.id,
			},
		},
	});

	if (existing) {
		return NextResponse.json({error: "already in watchlist"}, {status: 409});
	}

	const item = await prisma.watchlistItem.create({
		data: {
			userId: user.userId,
			movieId: movie.id,
		},
	});

	return NextResponse.json({item}, {status: 201});
}

export async function DELETE(
	req: NextRequest,
	{params}: {params: Promise<{tmdbId: string}>},
) {
	const user = getAuthUser(req);
	if (!user) {
		return NextResponse.json({error: "unauthorized"}, {status: 401});
	}

	const {tmdbId: tmdbIdStr} = await params;
	const tmdbId = parseInt(tmdbIdStr);

	const movie = await prisma.movie.findUnique({where: {tmdbId}});
	if (!movie) {
		return NextResponse.json({error: "movie not found"}, {status: 404});
	}

	await prisma.watchlistItem.delete({
		where: {
			userId_movieId: {
				userId: user.userId,
				movieId: movie.id,
			},
		},
	});
	return NextResponse.json({message: "removed from watchlist"});
}
