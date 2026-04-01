import {NextRequest, NextResponse} from "next/server";
import {verifyToken} from "@/lib/jwt";

//these dont require auth
const publicRoutes = ["/api/auth/login", "/api/auth/signup"];

export async function middleware(req: NextRequest) {
	const {pathname} = req.nextUrl;

	if (publicRoutes.some((route) => pathname.startsWith(route))) {
		return NextResponse.next();
	}

	if (!pathname.startsWith("/api")) {
		return NextResponse.next();
	}

	const token = req.cookies.get("token")?.value;

	if (!token) {
		return NextResponse.json({error: "turnstile auth required"}, {status: 401});
	}

	const payload = await verifyToken(token);

	if (!payload) {
		return NextResponse.json({error: "invalid/expired session"}, {status: 401});
	}

	const requestHeaders = new Headers(req.headers);
	requestHeaders.set("x-user-id", payload.userId);
	requestHeaders.set("x-username", payload.username);

	return NextResponse.next({
		request: {headers: requestHeaders},
	});
}

export const config = {
	matcher: "/api/:path*",
};
