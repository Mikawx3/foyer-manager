import { SignJWT, jwtVerify } from "jose";

export interface JwtPayload {
  userId: string;
  householdId: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

function getExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN ?? "7d";
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId, householdId: payload.householdId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(getExpiresIn())
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  const userId = payload.userId;
  const householdId = payload.householdId;
  if (typeof userId !== "string" || typeof householdId !== "string") {
    throw new Error("Invalid token payload");
  }
  return { userId, householdId };
}
