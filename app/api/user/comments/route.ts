import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getAuthUser} from "@/lib/auth";

export async function GET(req: NextRequest) {
	const user = getAuthUser(req);
	if (!user) return NextResponse.json({error: "Unauthorized"}, {status: 401});

	const {searchParams} = new URL(req.url);
	const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
	const sort = searchParams.get("sort") ?? "date-desc";
	const pageSize = 12;

	const where = {userId: user.userId};

	const orderBy =
		sort === "date-asc"
			? {createdAt: "asc" as const}
			: sort === "date-desc"
				? {createdAt: "desc" as const}
				: sort === "title-asc"
					? {movie: {title: "asc" as const}}
					: {movie: {title: "desc" as const}};

	const [comments, total] = await Promise.all([
		prisma.comment.findMany({
			where,
			orderBy,
			skip: (page - 1) * pageSize,
			take: pageSize,
			include: {
				movie: {
					select: {
						tmdbId: true,
						title: true,
						year: true,
						posterPath: true,
						mediaType: true,
					},
				},
			},
		}),
		prisma.comment.count({where}),
	]);

	return NextResponse.json({
		comments: comments.map((c) => ({
			comment: c.content,
			createdAt: c.createdAt,
			updatedAt: c.updatedAt,
			movie: c.movie,
		})),
		total,
		page,
		totalPages: Math.ceil(total / pageSize),
	});
}
