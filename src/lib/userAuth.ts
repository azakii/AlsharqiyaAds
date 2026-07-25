import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE = "sq_user";
const SECRET = process.env.AUTH_SECRET || "sharqia-influencer-secret-2026";

/** Signed session token: base64(influencerId.hmac) — prevents forging an arbitrary id in the cookie. */
export function makeUserToken(influencerId: string): string {
  const sig = crypto.createHmac("sha256", SECRET).update(influencerId).digest("hex");
  return Buffer.from(`${influencerId}.${sig}`).toString("base64");
}

export function verifyUserToken(token: string | undefined | null): string | null {
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const dot = decoded.lastIndexOf(".");
    if (dot < 0) return null;
    const id = decoded.slice(0, dot);
    const sig = decoded.slice(dot + 1);
    const expected = crypto.createHmac("sha256", SECRET).update(id).digest("hex");
    if (sig !== expected) return null;
    return id;
  } catch {
    return null;
  }
}

/** The logged-in influencer's row id, or null if no valid session cookie is present. */
export function currentInfluencerId(): string | null {
  const token = cookies().get(COOKIE)?.value;
  return verifyUserToken(token);
}

export const USER_COOKIE = COOKIE;
