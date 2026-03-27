import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getAuthUser} from "@/lib/auth";

export async function GET(
	req: NextRequest,
	{params}: {params: Promise<{username: string}>},
) {
	const currentUser = getAuthUser(req);
	const {username} = await params;

	const targetUser = await prisma.user.findUnique({
		where: {username},
	});

	if (!targetUser) {
		return NextResponse.json({error: "User not found"}, {status: 404});
	}

	//only owner allowed to view follower list
	const isOwnProfile = currentUser?.userId === targetUser.id;
	if (!isOwnProfile) {
		return NextResponse.json({error: "unauthorized"}, {status: 401});
	}

	const followers = await prisma.follow.findMany({
		where: {
			followingId: targetUser.id,
			status: "ACCEPTED",
		},
		include: {
			follower: {
				select: {username: true},
			},
		},
		orderBy: {createdAt: "desc"},
	});

	return NextResponse.json({
		followers: followers.map((f) => ({
			username: f.follower.username,
			followingSince: f.createdAt,
		})),
	});
}

//remove follower
export async function DELETE(
	req: NextRequest,
	{params}: {params: Promise<{username: string}>},
) {
	const currentUser = getAuthUser(req);
	if (!currentUser) {
		return NextResponse.json({error: "Unauthorized"}, {status: 401});
	}

	const {username} = await params;

	//follower to remove
	const followerUser = await prisma.user.findUnique({
		where: {username},
	});

	if (!followerUser) {
		return NextResponse.json({error: "user not found"}, {status: 404});
	}

	await prisma.follow.delete({
		where: {
			followerId_followingId: {
				followerId: followerUser.id,
				followingId: currentUser.userId,
			},
		},
	});

	return NextResponse.json({message: "follower removed"});
}
