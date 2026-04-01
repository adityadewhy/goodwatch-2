import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import bcrypt from "bcryptjs";
import {createToken} from "@/lib/jwt";
import {prisma} from "@/lib/prisma";

const loginSchema = z.object({
	username: z.string().min(1, "username is required"),
	password: z.string().min(1, "password is required"),
});

const rateLimitMap = new Map<string, {count: number; lastAttempt: number}>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME_MS = 15 * 60 * 1000; //15min in ms

export async function POST(req: NextRequest) {
	try {
		const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
		const now = Date.now();
		const record = rateLimitMap.get(ip);

		if (record) {
			if (record.count > MAX_ATTEMPTS) {
				const timePassed = now - record.lastAttempt;
				if (timePassed < LOCKOUT_TIME_MS) {
					const timeLeft = Math.ceil((LOCKOUT_TIME_MS - timePassed) / 60000);
					return NextResponse.json(
						{error: `Too many attempts, try again in ${timeLeft} minutes.`},
						{status: 429},
					);
				} else {
					//lockout time expired, reset counter
					rateLimitMap.set(ip, {count: 1, lastAttempt: now});
				}
			} else {
				//not locked out yet but increase the failure count
				rateLimitMap.set(ip, {count: record.count + 1, lastAttempt: now});
			}
		} else {
			//first attempt
			rateLimitMap.set(ip, {count: 1, lastAttempt: now});
		}

		const body = await req.json();
		const result = loginSchema.safeParse(body);

		if (!result.success) {
			return NextResponse.json(
				{error: result.error.issues[0].message},
				{status: 400},
			);
		}

		const {username, password} = result.data;

		const user = await prisma.user.findUnique({
			where: {username},
		});

		if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
			return NextResponse.json(
				{error: "invalid username or password"},
				{status: 401},
			);
		}

		//clear ratelimit if log in success
		rateLimitMap.delete(ip);

		const token = await createToken({userId: user.id, username: user.username});

		const response = NextResponse.json(
			{message: "logged in successfully", username: user.username},
			{status: 200},
		);

		response.cookies.set("token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 60 * 60 * 24 * 7, //7d in secs
			path: "/",
		});

		return response;
	} catch (error) {
		console.error("login error", error);
		return NextResponse.json(
			{error: "something went wrong, login, try later"},
			{status: 500},
		);
	}
}
