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

	const isOwnProfile = currentUser?.userId === targetUser.id;
	if (!isOwnProfile) {
		return NextResponse.json({error: "Unauthorized"}, {status: 401});
	}

	const following = await prisma.follow.findMany({
		where: {
			followerId: targetUser.id,
			status: "ACCEPTED",
		},
		include: {
			following: {select: {username: true}},
		},
		orderBy: {createdAt: "desc"},
	});

	return NextResponse.json({
		following: following.map((f) => ({
			username: f.following.username,
			followedAt: f.createdAt,
		})),
	});
}
