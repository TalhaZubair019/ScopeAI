import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
}

export async function signJwt(payload: JWTPayload) {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedSecret);
}

export async function verifyJwt(token: string) {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  
  if (!token) {
    return null;
  }
  
  return await verifyJwt(token);
}
