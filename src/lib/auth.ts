import { cookies } from "next/headers";

const COOKIE = "sq_admin";

export function adminCreds() {
  return {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "Sharqiah@2026",
  };
}

/** Simple token = base64(username). Good enough for a single-admin gate. */
export function makeToken(username: string) {
  return Buffer.from(`${username}:sharqia`).toString("base64");
}

export function isAdmin(): boolean {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return false;
  return token === makeToken(adminCreds().username);
}

export const ADMIN_COOKIE = COOKIE;
