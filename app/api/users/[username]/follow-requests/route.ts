import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getAuthUser} from "@/lib/auth";

export async function GET(req: NextRequest) {
	const currentUser = getAuthUser(req);
	if (!currentUser) {
		return NextResponse.json({error: "Unauthorized"}, {status: 401});
	}

	const requests = await prisma.follow.findMany({
		where: {
			followingId: currentUser.userId,
			status: "PENDING",
		},
		include: {
			follower: {
				select: {username: true},
			},
		},
		orderBy: {createdAt: "desc"},
	});

	return NextResponse.json({
		requests: requests.map((r) => ({
			followId: r.id,
			fromUsername: r.follower.username,
			requestedAt: r.createdAt,
		})),
	});
}

export async function PATCH(req: NextRequest) {
	const currentUser = getAuthUser(req);
	if (!currentUser) {
		return NextResponse.json({error: "Unauthorized"}, {status: 401});
	}

	const body = await req.json();
	const {followId, action} = body;

	if (!followId || !["accept", "decline"].includes(action)) {
		return NextResponse.json({error: "Invalid request"}, {status: 400});
	}

	//if req is for current user
	const follow = await prisma.follow.findUnique({
		where: {id: followId},
		include: {
			follower: {select: {username: true}},
		},
	});

	if (!follow || follow.followerId !== currentUser.userId) {
		return NextResponse.json({error: "Request not found"}, {status: 404});
	}

	if (follow.status !== "PENDING") {
		return NextResponse.json({error: "req already handled"}, {status: 409});
	}

	if (action === "accept") {
		await prisma.follow.update({
			where: {id: followId},
			data: {status: "ACCEPTED"},
		});

		await prisma.notification.create({
			data: {
				userId: follow.followerId,
				type: "FOLLOW_ACCEPTED",
				payload: {
					byUsername: currentUser.username,
				},
			},
		});

		return NextResponse.json({message: "follow req accepted"});
	} else {
		await prisma.follow.delete({
			where: {id: followId},
		});
		return NextResponse.json({message: "Follow req declined"});
	}
}
