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

	// Watchlist only really needs date added or title sorting
	const orderBy =
		sort === "date-asc"
			? {addedAt: "asc" as const}
			: sort === "title-asc"
				? {movie: {title: "asc" as const}}
				: {addedAt: "desc" as const};

	const where = {userId: user.userId};

	const [items, total] = await Promise.all([
		prisma.watchlistItem.findMany({
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
		prisma.watchlistItem.count({where}),
	]);

	return NextResponse.json({
		items: items.map((i) => ({
			addedAt: i.addedAt,
			movie: i.movie,
		})),
		total,
		page,
		totalPages: Math.ceil(total / pageSize),
	});
}
