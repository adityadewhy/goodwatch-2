import {SignJWT, jwtVerify} from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function createToken(payload: {userId: string; username: string}) {
	return await new SignJWT(payload)
		.setProtectedHeader({alg: "HS256"})
		.setIssuedAt()
		.setExpirationTime("7d")
		.sign(secret);
}

export async function verifyToken(token: string) {
	try {
		const {payload} = await jwtVerify(token, secret);
		return payload as {userId: string; username: string};
	} catch {
		return null;
	}
}
