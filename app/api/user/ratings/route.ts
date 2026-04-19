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

	// map "sort" string to prisma's orderBy format
	const orderBy =
		sort === "score-desc"
			? {score: "desc" as const}
			: sort === "score-asc"
				? {score: "asc" as const}
				: sort === "date-asc"
					? {createdAt: "asc" as const}
					: sort === "title-asc"
						? {movie: {title: "asc" as const}}
						: {createdAt: "desc" as const};

	// fetch paginated data AND total count
	const [ratings, total] = await Promise.all([
		prisma.rating.findMany({
			where,
			orderBy,
			skip: (page - 1) * pageSize, // E.g., Page 2 -> skip (2-1)*12 = 12 items
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
		prisma.rating.count({where}),
	]);

	return NextResponse.json({
		ratings: ratings.map((r) => ({
			score: r.score,
			createdAt: r.createdAt,
			updatedAt: r.updatedAt,
			movie: r.movie,
		})),
		total,
		page,
		totalPages: Math.ceil(total / pageSize),
	});
}
