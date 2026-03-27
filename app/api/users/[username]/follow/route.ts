import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getAuthUser} from "@/lib/auth";

export async function POST(
	req: NextRequest,
	{params}: {params: Promise<{username: string}>},
) {
	const currentUser = getAuthUser(req);
	if (!currentUser) {
		return NextResponse.json({error: "unauthorized"}, {status: 401});
	}

	const {username} = await params;

	const targetUser = await prisma.user.findUnique({
		where: {username},
	});

	if (!targetUser) {
		return NextResponse.json({error: "user not found"}, {status: 404});
	}

	//cant follow yourself
	if (targetUser.id === currentUser.userId) {
		return NextResponse.json(
			{error: "you cannot follow yourself"},
			{status: 400},
		);
	}

	const existing = await prisma.follow.findUnique({
		where: {
			followerId_followingId: {
				followerId: currentUser.userId,
				followingId: targetUser.id,
			},
		},
	});

	if (existing) {
		const message =
			existing.status === "PENDING"
				? "follow req already sent"
				: "already following";
		return NextResponse.json({error: message}, {status: 409});
	}

	const follow = await prisma.follow.create({
		data: {
			followerId: currentUser.userId,
			followingId: targetUser.id,
			status: "PENDING",
		},
	});

	//creating notification for target user
	await prisma.notification.create({
		data: {
			userId: targetUser.id,
			type: "FOLLOW_REQUEST",
			payload: {
				fromUserId: currentUser.userId,
				fromUsername: currentUser.username,
			},
		},
	});

	return NextResponse.json({follow}, {status: 201});
}

//unfollow
export async function DELETE(
	req: NextRequest,
	{params}: {params: Promise<{username: string}>},
) {
	const currentUser = getAuthUser(req);
	if (!currentUser) {
		return NextResponse.json({error: "unauthorized"}, {status: 401});
	}

	const {username} = await params;
	const targetUser = await prisma.user.findUnique({where: {username}});

	if (!targetUser) {
		return NextResponse.json({error: "user not found"}, {status: 404});
	}

	await prisma.follow.delete({
		where: {
			followerId_followingId: {
				followerId: currentUser.userId,
				followingId: targetUser.id,
			},
		},
	});

	return NextResponse.json({message: "unfollowed successfully"});
}
