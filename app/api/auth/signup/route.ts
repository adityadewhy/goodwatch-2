import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import bcrypt from "bcryptjs";
import {prisma} from "@/lib/prisma";
import {createToken} from "@/lib/jwt";

const signupSchema = z.object({
	username: z
		.string()
		.min(3, "username chars must be >=3 characters")
		.max(20, "username chars must be <20 chars")
		.regex(/^[a-zA-z0-9]/, "username can only contain alphanumerics"),
	password: z
		.string()
		.min(8, "password >=8 chars")
		.max(72, "password must be <=72 chars"),
	captchaToken: z.string(), //	for turnstile
});

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const result = signupSchema.safeParse(body);

		if (!result.success) {
			return NextResponse.json(
				{error: result.error.issues[0].message},
				{status: 400},
			);
		}

		const {username, password, captchaToken} = result.data;

		// Validate Turnstile token
		const turnstileRes = await fetch(
			"https://challenges.cloudflare.com/turnstile/v0/siteverify",
			{
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({
					secret: process.env.TURNSTILE_SECRET,
					response: captchaToken,
				}),
			},
		);

		const turnstileData = await turnstileRes.json();
		if (!turnstileData.success) {
			return NextResponse.json(
				{error: "Captcha verification failed. Please try again."},
				{status: 400},
			);
		}

		const existing = await prisma.user.findUnique({
			where: {username},
		});

		if (existing) {
			return NextResponse.json(
				{error: "Username already taken"},
				{status: 409},
			);
		}

		const passwordHash = await bcrypt.hash(password, 12);

		const user = await prisma.user.create({
			data: {
				username,
				passwordHash,
			},
		});

		const token = await createToken({userId: user.id, username: user.username});

		const response = NextResponse.json(
			{message: "Account created successfully", username: user.username},
			{status: 201},
		);

		response.cookies.set("token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 60 * 60 * 24 * 7, // 7 days
			path: "/",
		});

		return response;
	} catch (error) {
		console.error("Signup error:", error);
		return NextResponse.json(
			{error: "Could not signup. Please try again later."},
			{status: 500},
		);
	}
}
