import { timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { jwtVerify, SignJWT } from "jose";
import { ENV } from "./_core/env";

export const ADMIN_SESSION_COOKIE = "flamingo_admin_session";
const SESSION_SECONDS = 60 * 60 * 8;
const fallbackSecret = "flamingo-local-session-secret";
const secret = () => new TextEncoder().encode(ENV.cookieSecret || fallbackSecret);
type RequestLike = Pick<IncomingMessage, "headers">;
type SessionResponse = { cookie: (name: string, value: string, options: Record<string, unknown>) => unknown; clearCookie: (name: string, options: Record<string, unknown>) => unknown };

export function isValidAdminPassword(value: string) {
  const expected = process.env.FLAMINGO_ADMIN_PASSWORD || "flamingo2026";
  if (!expected || value.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}
function cookie(request: RequestLike) { return (request.headers.cookie ?? "").split(";").map((part: string) => part.trim()).find((part: string) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`))?.slice(ADMIN_SESSION_COOKIE.length + 1); }
export async function verifyAdminSession(request: RequestLike) { const token = cookie(request); if (!token) return false; try { const { payload } = await jwtVerify(decodeURIComponent(token), secret(), { algorithms: ["HS256"] }); return payload.role === "flamingo-admin"; } catch { return false; } }
export async function createAdminSession(response: SessionResponse) { const token = await new SignJWT({ role: "flamingo-admin" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${SESSION_SECONDS}s`).sign(secret()); response.cookie(ADMIN_SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: ENV.isProduction, maxAge: SESSION_SECONDS * 1000, path: "/" }); }
export function clearAdminSession(response: SessionResponse) { response.clearCookie(ADMIN_SESSION_COOKIE, { httpOnly: true, sameSite: "lax", secure: ENV.isProduction, path: "/" }); }
