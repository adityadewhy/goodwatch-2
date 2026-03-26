import {NextRequest} from "next/server";

export function getAuthUser(req: NextRequest) {
	const userId = req.headers.get("x-user-id");
	const username = req.headers.get("x-username");

	if (!userId || !username) {
		return null;
	}

	return {userId, username};
}
