import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";

export async function GET(req: NextRequest) {
	const {searchParams} = new URL(req.url);
	const query = searchParams.get("q");

	if (!query || query.trim().length < 2) {
		return NextResponse.json({users: []});
	}

	const users = await prisma.user.findMany({
		where: {
			username: {
				contains: query.trim(),
				mode: "insensitive",
			},
		},
		select: {
			username: true,
		},
		take: 5,
	});

	return NextResponse.json({users});
}
