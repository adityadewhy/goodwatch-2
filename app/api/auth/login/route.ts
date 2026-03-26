import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import bcrypt from "bcryptjs";
import {Prisma} from "@prisma/client";
import {createToken} from "@/lib/jwt";
import {prisma} from "@/lib/prisma";

const loginSchema = z.object({
	username: z.string().min(1, "username is required"),
	password: z.string().min(1, "password is required"),
});

export async function POST(req: NextRequest) {
	try {
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
				{error: "username password did not match"},
				{status: 401},
			);
		}

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
	} catch (error){
        console.error("login error", error)
        return NextResponse.json(
            {error: "something went wrong, login, try later"},
            {status: 500}
        )
    }
}
