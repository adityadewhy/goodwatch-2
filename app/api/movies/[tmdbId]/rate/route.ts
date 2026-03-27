import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {getAuthUser} from "@/lib/auth";

const ratingSchema = z.object({
	score: z.number().int().min(1).max(10),
});

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

	if (isNaN(tmdbId)) {
		return NextResponse.json({error: "invalid movie id"}, {status: 400});
	}

	const body = await req.json();
	const result = ratingSchema.safeParse(body);

	if (!result.success) {
		return NextResponse.json(
			{error: result.error.issues[0].message},
			{status: 400},
		);
	}

	const {score} = result.data;

	//visiting the movie page means it is cached. => can directly fetch from db
	const movie = await prisma.movie.findUnique({where: {tmdbId}});

	if (!movie) {
		return NextResponse.json(
			{error: "movie not found, view movie page first"},
			{status: 404},
		);
	}

	const rating = await prisma.rating.upsert({
		where: {
			userId_movieId: {
				userId: user.userId,
				movieId: movie.id,
			},
		},
		update: {score},
		create: {
			userId: user.userId,
			movieId: movie.id,
			score,
		},
	});
	return NextResponse.json({rating});
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

	await prisma.rating.delete({
		where: {
			userId_movieId: {
				userId: user.userId,
				movieId: movie.id,
			},
		},
	});

	return NextResponse.json({message: "rating removed"});
}
