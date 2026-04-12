import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getAuthUser} from "@/lib/auth";

export async function GET(
	req: NextRequest,
	{params}: {params: Promise<{username: string}>},
) {
	const currentUser = getAuthUser(req);
	const {username} = await params;

	const targetUser = await prisma.user.findUnique({where: {username}});

	if (!targetUser) {
		return NextResponse.json({error: "User not found"}, {status: 404});
	}

	if (currentUser?.userId !== targetUser.id) {
		return NextResponse.json({error: "Unauthorized"}, {status: 401});
	}

	const outgoing = await prisma.follow.findMany({
		where: {
			followerId: targetUser.id,
			status: "PENDING",
		},
		include: {
			following: {select: {username: true}},
		},
		orderBy: {createdAt: "desc"},
	});

	return NextResponse.json({
		requests: outgoing.map((r) => ({
			followId: r.id,
			toUsername: r.following.username,
			requestedAt: r.createdAt,
		})),
	});
}
