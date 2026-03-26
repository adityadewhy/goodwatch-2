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

		const {username, password} = result.data;
		const existing = await prisma.user.findUnique({
			where: {username},
		});

		if (existing) {
			return NextResponse.json(
				{error: "username already taken"},
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
			{message: "account created successfully", username: user.username},
			{status: 201},
		);

		response.cookies.set("token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV == "production",
			sameSite: "strict",
			maxAge: 60 * 60 * 24 * 7, //7days
			path: "/",
		});

		return response;
	} catch (error) {
		console.error("signup error:", error);
		return NextResponse.json(
			{error: "couldnt signup. error. try again later"},
			{status: 500},
		);
	}
}
