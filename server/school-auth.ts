import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { getUserById } from "./db";
import { ENV } from "./_core/env";

export const SCHOOL_COOKIE = "school_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function secretKey() {
  return new TextEncoder().encode(ENV.cookieSecret || "development-school-secret-change-me");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, stored] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !stored) return false;
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(stored, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export async function createSchoolToken(userId: number) {
  return new SignJWT({ kind: "school" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function getSchoolUserFromToken(token: string) {
  try {
    const result = await jwtVerify(token, secretKey());
    if (result.payload.kind !== "school" || !result.payload.sub) return null;
    const user = await getUserById(Number(result.payload.sub));
    return user?.loginMethod === "school" ? user : null;
  } catch {
    return null;
  }
}

export function schoolCookieOptions() {
  return {
    httpOnly: true,
    secure: ENV.isProduction,
    sameSite: ENV.isProduction ? ("none" as const) : ("lax" as const),
    maxAge: SESSION_MAX_AGE_SECONDS * 1000,
    path: "/",
  };
}
