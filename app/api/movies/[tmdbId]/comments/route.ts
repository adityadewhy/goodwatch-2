import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {getAuthUser} from "@/lib/auth";

const commentSchema = z.object({
	content: z.string().min(1).max(500),
});

export async function GET(
	req: NextRequest,
	{params}: {params: Promise<{tmdbId: string}>},
) {
	const {tmdbId: tmdbIdStr} = await params;
	const tmdbId = parseInt(tmdbIdStr);

	const movie = await prisma.movie.findUnique({where: {tmdbId}});
	if (!movie) {
		return NextResponse.json({comments: []});
	}

	const user = getAuthUser(req);

	const comments = await prisma.comment.findMany({
		where: {movieId: movie.id},
		include: {
			user: {
				select: {username: true},
			},
		},
		orderBy: {createdAt: "desc"},
	});

	//find comments by current user
	const commentsWithOwnership = comments.map((comment) => ({
		id: comment.id,
		content: comment.content,
		username: comment.user.username,
		createdAt: comment.createdAt,
		isOwner: user ? comment.userId === user.userId : false,
	}));

	return NextResponse.json({comments: commentsWithOwnership});
}

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
		return NextResponse.json({error: "movie not found"}, {status: 404});
	}

	const body = await req.json();
	const result = commentSchema.safeParse(body);

	if (!result.success) {
		return NextResponse.json(
			{error: result.error.issues[0].message},
			{status: 400},
		);
	}

	// Check if the user already has a comment
	const existing = await prisma.comment.findFirst({
		where: {userId: user.userId, movieId: movie.id},
	});

	if (existing) {
		// UPDATE: If a comment exists, update its content instead of throwing a 409
		const updatedComment = await prisma.comment.update({
			where: {id: existing.id},
			data: {content: result.data.content},
			include: {user: {select: {username: true}}},
		});
		return NextResponse.json({comment: updatedComment}, {status: 200});
	}

	const comment = await prisma.comment.create({
		data: {
			userId: user.userId,
			movieId: movie.id,
			content: result.data.content,
		},
		include: {
			user: {select: {username: true}},
		},
	});
	return NextResponse.json({comment}, {status: 201});
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

	// We use deleteMany here because we are targeting the comment by the
	// combination of userId and movieId, rather than the comment's unique ID.
	await prisma.comment.deleteMany({
		where: {
			userId: user.userId,
			movieId: movie.id,
		},
	});

	return NextResponse.json({message: "comment deleted"}, {status: 200});
}
