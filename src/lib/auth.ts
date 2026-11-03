import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { dbEnabled, query } from "./db";

const COOKIE = "sq_admin";

export function adminCreds() {
  return {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "Sharqiah@2026",
  };
}

/** Signed token (HMAC) — a plain base64 of the username would be forgeable by anyone. Set AUTH_SECRET in production. */
export function makeToken(username: string) {
  const secret = process.env.AUTH_SECRET || "sharqia-admin-secret-2026";
  return crypto.createHmac("sha256", secret).update(`admin:${username}`).digest("hex");
}

/** كلمة المرور المخزّنة في القاعدة (بعد أول تغيير من اللوحة) تتقدّم على ADMIN_PASSWORD في الـ env. */
export async function checkAdminPassword(password: string): Promise<boolean> {
  if (dbEnabled) {
    try {
      const [row] = await query<{ password_hash: string }>("SELECT password_hash FROM admin_auth WHERE id = 1");
      if (row) return bcrypt.compare(password, row.password_hash);
    } catch (e) {
      // الجدول غير موجود بعد (لم تُغيَّر الكلمة من اللوحة) — نرجع لكلمة الـ env. أي خطأ آخر = رفض.
      if ((e as { code?: string }).code !== "ER_NO_SUCH_TABLE") return false;
    }
  }
  return password === adminCreds().password;
}

export function isAdmin(): boolean {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return false;
  return token === makeToken(adminCreds().username);
}

export const ADMIN_COOKIE = COOKIE;
