import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getAuthUser} from "@/lib/auth";

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

	const body = await req.json();
	const {featureType} = body; // expecting "PROFILE" or "COVER"

	if (featureType !== "PROFILE" && featureType !== "COVER") {
		return NextResponse.json({error: "Invalid feature type"}, {status: 400});
	}

	try {
		if (featureType === "PROFILE") {
			await prisma.user.update({
				where: {id: user.userId},
				data: {profileMovieId: tmdbId},
			});
		} else if (featureType === "COVER") {
			await prisma.user.update({
				where: {id: user.userId},
				data: {coverMovieId: tmdbId},
			});
		}

		return NextResponse.json({success: true}, {status: 200});
	} catch (error) {
		console.error("Failed to set feature:", error);
		return NextResponse.json({error: "Internal server error"}, {status: 500});
	}
}
