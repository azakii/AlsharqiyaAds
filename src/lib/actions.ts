"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { dbEnabled, query, exec, transaction, isDuplicate } from "./db";
import { sendMail } from "./mail";
import { adminCreds, makeToken, ADMIN_COOKIE, isAdmin } from "./auth";
import { makeUserToken, USER_COOKIE } from "./userAuth";
import { DEFAULT_SETTINGS, BOOLEAN_SETTINGS_KEYS, type SiteSettings } from "./settings";
import { isSaudiPhone, SAUDI_PHONE_ERROR } from "./validators";
import { slugify, type StructuredDataBlock } from "./seo-shared";
import type { InfluencerStatus, AdRequestStatus } from "./types";

// ---------- Public submissions ----------

export async function submitInfluencer(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return { ok: false, message: "الاسم الكامل مطلوب." };

  const phone = String(formData.get("phone") || "");
  if (!phone) return { ok: false, message: "رقم الجوال مطلوب." };
  if (!isSaudiPhone(phone)) return { ok: false, message: SAUDI_PHONE_ERROR };

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!email) return { ok: false, message: "البريد الإلكتروني مطلوب لإنشاء حساب الدخول." };
  if (password.length < 6) return { ok: false, message: "كلمة المرور يجب ألا تقل عن 6 أحرف." };

  const basePayload = {
    name,
    phone,
    email,
    city: String(formData.get("city") || ""),
    category: String(formData.get("category") || ""),
    bio: String(formData.get("bio") || ""),
    followers: Number(formData.get("followers") || 0),
    avatar_url: String(formData.get("avatar_url") || ""),
    socials: {
      instagram: String(formData.get("instagram") || ""),
      tiktok: String(formData.get("tiktok") || ""),
      x: String(formData.get("x") || ""),
      whatsapp: String(formData.get("whatsapp") || ""),
      snapchat: String(formData.get("snapchat") || ""),
    },
    // رقم رخصة منصة "موثوق" — اختياري، خاص تماماً (راجع data.ts/toPublicInfluencer).
    // وجوده فقط هو اللي بيفعّل شارة "موثوق" العامة — القيمة نفسها لا تظهر لغير الإدارة وصاحب الملف.
    license_number: String(formData.get("license_number") || "").trim() || null,
    verified: false,
    status: "pending" as InfluencerStatus,
    views: 0,
    clicks: 0,
    ad_requests: 0,
  };

  if (!dbEnabled) {
    return { ok: true, demo: true, message: "تم استلام الطلب (وضع تجريبي — لم يتم ربط قاعدة البيانات بعد)." };
  }

  // حساب الدخول يُنشأ فور التسجيل (كلمة المرور مُشفّرة bcrypt)، لكن تسجيل الدخول الفعلي يبقى
  // مرفوضاً من السيرفر (loginInfluencer) حتى توافق الإدارة على الطلب.
  const userId = crypto.randomUUID();
  const { socials, license_number, ...cols } = basePayload;
  try {
    const hash = await bcrypt.hash(password, 10);
    await transaction(async (run) => {
      await run("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)", [userId, email.toLowerCase(), hash]);
      await run(
        `INSERT INTO influencers (id, name, phone, email, city, category, bio, followers, avatar_url, verified, status,
           views, clicks, ad_requests, socials, license_number, auth_user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'pending', 0, 0, 0, ?, ?, ?)`,
        [crypto.randomUUID(), cols.name, cols.phone, cols.email, cols.city, cols.category, cols.bio, cols.followers,
         cols.avatar_url, JSON.stringify(socials), license_number, userId]
      );
    });
  } catch (e) {
    if (isDuplicate(e)) return { ok: false, message: "هذا البريد الإلكتروني مسجّل بالفعل، جرّب تسجيل الدخول بدلاً من ذلك." };
    return { ok: false, message: (e as Error).message };
  }
  return {
    ok: true,
    message: "تم إرسال طلب التسجيل بنجاح. بعد موافقة الإدارة، تقدر تسجّل الدخول بنفس البريد الإلكتروني وكلمة المرور.",
  };
}

export async function submitAdRequest(formData: FormData) {
  const phone = String(formData.get("phone") || "");
  if (!isSaudiPhone(phone)) return { ok: false, message: SAUDI_PHONE_ERROR };

  const payload = {
    company_name: String(formData.get("company_name") || ""),
    contact_name: String(formData.get("contact_name") || ""),
    phone,
    email: String(formData.get("email") || ""),
    category: String(formData.get("category") || ""),
    city: String(formData.get("city") || ""),
    details: String(formData.get("details") || ""),
    budget: Number(formData.get("budget") || 0),
    target_influencer: String(formData.get("target_influencer") || ""),
    status: "pending" as AdRequestStatus,
  };

  if (!dbEnabled) {
    return { ok: true, demo: true, message: "تم استلام طلب الإعلان (وضع تجريبي — لم يتم ربط قاعدة البيانات بعد)." };
  }
  try {
    await exec(
      `INSERT INTO ad_requests (id, company_name, contact_name, phone, email, category, city, details, budget, target_influencer, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), payload.company_name, payload.contact_name, payload.phone, payload.email, payload.category,
       payload.city, payload.details, payload.budget, payload.target_influencer, payload.status]
    );

    // نزوّد عداد "طلبات الإعلان" بتاع المؤثر المستهدف — target_influencer مخزّن كاسم نصي
    // (من قائمة select في الفورم) مش id، فالمطابقة بالاسم أفضل حل متاح بالشكل الحالي.
    if (payload.target_influencer) {
      await exec("UPDATE influencers SET ad_requests = COALESCE(ad_requests, 0) + 1 WHERE name = ? LIMIT 1", [
        payload.target_influencer.trim(),
      ]);
    }
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  return { ok: true, message: "تم إرسال طلب الإعلان بنجاح، سنتواصل معك قريباً." };
}

const STAT_COLUMNS = { views: "views", clicks: "clicks", ad_requests: "ad_requests" } as const;

/** Public: atomically bump a view/click/ad_requests counter (the one write visitors trigger). */
export async function incrementInfluencerStat(
  id: string,
  stat: "views" | "clicks" | "ad_requests"
): Promise<{ ok: boolean }> {
  if (!dbEnabled) return { ok: true };
  const col = STAT_COLUMNS[stat];
  if (!col) return { ok: false };
  try {
    await exec(`UPDATE influencers SET ${col} = COALESCE(${col}, 0) + 1 WHERE id = ?`, [id]);
    return { ok: true };
  } catch (e) {
    console.error("incrementInfluencerStat:", e);
    return { ok: false };
  }
}

// ---------- Admin auth ----------

export async function login(formData: FormData) {
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");
  const creds = adminCreds();
  if (username === creds.username && password === creds.password) {
    cookies().set(ADMIN_COOKIE, makeToken(username), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return { ok: true };
  }
  return { ok: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة." };
}

export async function logout() {
  cookies().delete(ADMIN_COOKIE);
  return { ok: true };
}

// ---------- Influencer auth (separate from admin auth above) ----------

export async function loginInfluencer(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!email || !password) return { ok: false, message: "البريد الإلكتروني وكلمة المرور مطلوبان." };

  if (!dbEnabled) {
    return { ok: false, message: "تسجيل الدخول غير متاح حالياً (لم يتم ربط قاعدة البيانات بعد)." };
  }

  const [user] = await query<{ id: string; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE email = ?",
    [email.toLowerCase()]
  );
  // bcryptjs يقبل هاشات $2a$/$2b$ القادمة من Supabase Auth كما هي.
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return { ok: false, message: "البريد الإلكتروني أو كلمة المرور غير صحيحة." };
  }

  const [inf] = await query<{ id: string; status: string }>(
    "SELECT id, status FROM influencers WHERE auth_user_id = ?",
    [user.id]
  );

  if (!inf) return { ok: false, message: "لم يتم العثور على ملف مؤثر مرتبط بهذا الحساب." };
  if (inf.status !== "approved") {
    return {
      ok: false,
      message: "حسابك قيد المراجعة من الإدارة حالياً. سيتم تفعيل الدخول فور الموافقة على طلبك.",
    };
  }

  cookies().set(USER_COOKIE, makeUserToken(inf.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return { ok: true };
}

export async function logoutInfluencer() {
  cookies().delete(USER_COOKIE);
  return { ok: true };
}

/** الأصل (origin) الحالي من رأس الطلب — يستخدم في بناء رابط إعادة تعيين كلمة المرور. */
function siteOrigin(): string {
  const h = headers();
  const host = h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const RESET_TTL_MS = 60 * 60 * 1000;
const sha256 = (v: string) => crypto.createHash("sha256").update(v).digest("hex");

/**
 * "نسيت كلمة المرور؟" — يرسل إيميل فيه رابط إعادة تعيين (صالح ساعة) لو البريد مسجل فعلاً.
 * نرجّع رسالة نجاح ثابتة سواء كان البريد موجود أو لأ، عشان محدش يقدر يتأكد إن بريد معين مسجل عندنا.
 */
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return { ok: false, message: "البريد الإلكتروني مطلوب." };

  const genericMessage = "لو البريد الإلكتروني مسجّل عندنا، وصلك رابط لإعادة تعيين كلمة المرور خلال دقائق.";
  if (!dbEnabled) return { ok: true, message: genericMessage };

  try {
    const token = crypto.randomBytes(32).toString("hex");
    const n = await exec(
      "UPDATE users SET reset_token_hash = ?, reset_expires = ? WHERE email = ?",
      [sha256(token), new Date(Date.now() + RESET_TTL_MS).toISOString().slice(0, 19).replace("T", " "), email]
    );
    if (n > 0) {
      await sendMail(
        email,
        "إعادة تعيين كلمة المرور",
        `لإعادة تعيين كلمة المرور افتح الرابط التالي (صالح لمدة ساعة):\n${siteOrigin()}/reset-password?token=${token}`
      );
    }
  } catch (e) {
    // ما نكشفش تفاصيل الخطأ للمستخدم حفاظاً على الخصوصية — بس نسجله في اللوج.
    console.error("requestPasswordReset:", e);
  }
  return { ok: true, message: genericMessage };
}

/** يستهلك توكن إعادة التعيين (استخدام واحد) ويحفظ كلمة المرور الجديدة. */
export async function resetPassword(token: string, password: string) {
  if (password.length < 6) return { ok: false, message: "كلمة المرور يجب ألا تقل عن 6 أحرف." };
  if (!dbEnabled || !token) return { ok: false, message: "الرابط غير صالح أو منتهي الصلاحية." };
  const hash = await bcrypt.hash(password, 10);
  const n = await exec(
    `UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_expires = NULL
     WHERE reset_token_hash = ? AND reset_expires > UTC_TIMESTAMP()`,
    [hash, sha256(token)]
  );
  return n > 0 ? { ok: true } : { ok: false, message: "الرابط غير صالح أو منتهي الصلاحية." };
}

// ---------- Admin mutations ----------
// Every mutation is gated by guard() (admin cookie) — this replaces the old RLS + service-role split.
// Zero affected rows is reported as an explicit error instead of silently succeeding.

async function guard() {
  if (!isAdmin()) throw new Error("unauthorized");
}

/** DB error -> message; duplicate-key errors get the caller's friendlier text. */
function dbError(e: unknown, uniqueMessage?: string) {
  if (uniqueMessage && isDuplicate(e)) return { ok: false, message: uniqueMessage };
  return { ok: false, message: (e as Error).message };
}

export async function setInfluencerStatus(id: string, status: InfluencerStatus) {
  await guard();
  if (!dbEnabled) return { ok: true, demo: true };
  try {
    const n = await exec("UPDATE influencers SET status = ? WHERE id = ?", [status, id]);
    if (n === 0) return { ok: false, message: "لم يتم العثور على المؤثر." };
  } catch (e) {
    return dbError(e);
  }
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

/** إجراء مجمع: تغيير حالة عدة مؤثرين مرة واحدة (تحديث واحد في قاعدة البيانات بدل حلقة). */
export async function bulkSetInfluencerStatus(ids: string[], status: InfluencerStatus) {
  await guard();
  if (!ids || ids.length === 0) return { ok: false, message: "لم يتم تحديد أي مؤثر." };
  if (!dbEnabled) return { ok: true, demo: true };
  let n: number;
  try {
    n = await exec("UPDATE influencers SET status = ? WHERE id IN (?)", [status, ids]);
  } catch (e) {
    return dbError(e);
  }
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true, message: `تم تحديث حالة ${n} مؤثر.` };
}

/** إجراء مجمع: حذف عدة مؤثرين مرة واحدة. */
export async function bulkDeleteInfluencers(ids: string[]) {
  await guard();
  if (!ids || ids.length === 0) return { ok: false, message: "لم يتم تحديد أي مؤثر." };
  if (!dbEnabled) return { ok: true, demo: true };
  let n: number;
  try {
    n = await exec("DELETE FROM influencers WHERE id IN (?)", [ids]);
  } catch (e) {
    return dbError(e);
  }
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true, message: `تم حذف ${n} مؤثر.` };
}

export async function setVerified(id: string, verified: boolean) {
  await guard();
  if (!dbEnabled) return { ok: true, demo: true };
  try {
    const n = await exec("UPDATE influencers SET verified = ? WHERE id = ?", [verified, id]);
    if (n === 0) return { ok: false, message: "لم يتم العثور على المؤثر." };
  } catch (e) {
    return dbError(e);
  }
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

function influencerPayloadFromForm(formData: FormData) {
  const rawSlug = String(formData.get("slug") || "").trim();
  return {
    name: String(formData.get("name") || ""),
    phone: String(formData.get("phone") || ""),
    email: String(formData.get("email") || ""),
    city: String(formData.get("city") || ""),
    category: String(formData.get("category") || ""),
    bio: String(formData.get("bio") || ""),
    followers: Number(formData.get("followers") || 0),
    avatar_url: String(formData.get("avatar_url") || ""),
    socials: {
      instagram: String(formData.get("instagram") || ""),
      tiktok: String(formData.get("tiktok") || ""),
      x: String(formData.get("x") || ""),
      whatsapp: String(formData.get("whatsapp") || ""),
      snapchat: String(formData.get("snapchat") || ""),
    },
    license_number: String(formData.get("license_number") || "").trim() || null,
    verified: formData.get("verified") === "on" || formData.get("verified") === "true",
    status: (String(formData.get("status") || "approved") as InfluencerStatus) || "approved",
    // رابط صديق اختياري لصفحة المؤثر — يُطهَّر دائماً عبر slugify قبل الحفظ، فريد على مستوى القاعدة.
    slug: rawSlug ? slugify(rawSlug) : null,
  };
}

const SLUG_TAKEN = "هذا الرابط (Slug) مستخدم من قبل مؤثر آخر، اختر رابطاً مختلفاً.";

/** Admin-only: add an influencer directly from the dashboard (skips the public review queue). */
export async function adminCreateInfluencer(formData: FormData) {
  await guard();
  const p = influencerPayloadFromForm(formData);

  if (!p.name || !p.phone) {
    return { ok: false, message: "الاسم ورقم الجوال مطلوبان." };
  }
  if (!isSaudiPhone(p.phone)) {
    return { ok: false, message: SAUDI_PHONE_ERROR };
  }

  if (!dbEnabled) {
    return { ok: true, demo: true, message: "تمت الإضافة (وضع تجريبي — اربط قاعدة البيانات لحفظ البيانات فعلياً)." };
  }

  const id = crypto.randomUUID();
  try {
    await exec(
      `INSERT INTO influencers (id, name, phone, email, city, category, bio, followers, avatar_url, socials,
         license_number, verified, status, slug, views, clicks, ad_requests)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0)`,
      [id, p.name, p.phone, p.email, p.city, p.category, p.bio, p.followers, p.avatar_url, JSON.stringify(p.socials),
       p.license_number, p.verified, p.status, p.slug]
    );
  } catch (e) {
    return dbError(e, SLUG_TAKEN);
  }
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true, id, message: "تمت إضافة المؤثر بنجاح." };
}

/** Admin-only: edit an existing influencer's profile. */
export async function adminUpdateInfluencer(id: string, formData: FormData) {
  await guard();
  const p = influencerPayloadFromForm(formData);

  if (!p.name || !p.phone) {
    return { ok: false, message: "الاسم ورقم الجوال مطلوبان." };
  }
  if (!isSaudiPhone(p.phone)) {
    return { ok: false, message: SAUDI_PHONE_ERROR };
  }

  if (!dbEnabled) {
    return { ok: true, demo: true, message: "تم الحفظ (وضع تجريبي — اربط قاعدة البيانات لحفظ البيانات فعلياً)." };
  }

  try {
    const [row] = await query("SELECT id FROM influencers WHERE id = ?", [id]);
    if (!row) return { ok: false, message: "لم يتم العثور على المؤثر." };
    await exec(
      `UPDATE influencers SET name=?, phone=?, email=?, city=?, category=?, bio=?, followers=?, avatar_url=?,
         socials=?, license_number=?, verified=?, status=?, slug=? WHERE id = ?`,
      [p.name, p.phone, p.email, p.city, p.category, p.bio, p.followers, p.avatar_url, JSON.stringify(p.socials),
       p.license_number, p.verified, p.status, p.slug, id]
    );
  } catch (e) {
    return dbError(e, SLUG_TAKEN);
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true, message: "تم حفظ التعديلات بنجاح." };
}

export async function deleteInfluencer(id: string) {
  await guard();
  if (!dbEnabled) return { ok: true, demo: true };
  try {
    const n = await exec("DELETE FROM influencers WHERE id = ?", [id]);
    if (n === 0) return { ok: false, message: "لم يتم العثور على المؤثر." };
  } catch (e) {
    return dbError(e);
  }
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

export async function setAdRequestStatus(id: string, status: AdRequestStatus) {
  await guard();
  if (!dbEnabled) return { ok: true, demo: true };
  try {
    const n = await exec("UPDATE ad_requests SET status = ? WHERE id = ?", [status, id]);
    if (n === 0) return { ok: false, message: "لم يتم العثور على الطلب." };
  } catch (e) {
    return dbError(e);
  }
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteAdRequest(id: string) {
  await guard();
  if (!dbEnabled) return { ok: true, demo: true };
  try {
    const n = await exec("DELETE FROM ad_requests WHERE id = ?", [id]);
    if (n === 0) return { ok: false, message: "لم يتم العثور على الطلب." };
  } catch (e) {
    return dbError(e);
  }
  revalidatePath("/admin");
  return { ok: true };
}

// ---------- Site settings (CMS) ----------

export async function saveSettings(formData: FormData) {
  await guard();
  const keys = Object.keys(DEFAULT_SETTINGS) as (keyof SiteSettings)[];
  // حقول boolean (زي robots) تُرسل كـ checkbox — لازم قيمة true/false فعلية، مش نص فاضي أو "on" الخام.
  const values = keys.map((k) => (BOOLEAN_SETTINGS_KEYS.includes(k) ? formData.get(k) === "on" : String(formData.get(k) ?? "")));

  if (!dbEnabled) {
    return { ok: true, demo: true, message: "تم الحفظ (وضع تجريبي — اربط قاعدة البيانات لحفظ التغييرات فعلياً)." };
  }
  try {
    // keys come from DEFAULT_SETTINGS (a constant), never from user input.
    await exec(
      `INSERT INTO site_settings (id, ${keys.join(", ")}) VALUES (1, ${keys.map(() => "?").join(", ")})
       ON DUPLICATE KEY UPDATE ${keys.map((k) => `${k} = VALUES(${k})`).join(", ")}`,
      values
    );
  } catch (e) {
    return dbError(e);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "تم حفظ الإعدادات بنجاح." };
}

// ---------- SEO management ----------

/** يتحقق أن قيمة النص إما فارغة، أو مسار نسبي يبدأ بـ /، أو رابط مطلق صالح. */
function isValidUrlOrPath(v: string): boolean {
  if (!v) return true;
  if (v.startsWith("/")) return true;
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
}

/** Admin-only: إضافة أو تعديل إعدادات سيو لمسار معيّن (صفحة ثابتة، صفحة مؤثر، أو أي مسار). */
export async function upsertSeoPage(formData: FormData) {
  await guard();

  const id = String(formData.get("id") || "").trim();
  const path = String(formData.get("path") || "").trim();
  if (!path || !path.startsWith("/")) {
    return { ok: false, message: "المسار (Path) مطلوب ويجب أن يبدأ بـ /." };
  }

  const canonical = String(formData.get("canonical_url") || "").trim();
  if (canonical && !isValidUrlOrPath(canonical)) {
    return { ok: false, message: "رابط الـ Canonical غير صالح." };
  }

  const structuredData: StructuredDataBlock[] = [];
  try {
    const rawBlocks = JSON.parse(String(formData.get("structured_data_json") || "[]")) as {
      label: string;
      json: string;
    }[];
    for (const b of rawBlocks) {
      if (!b.json || !b.json.trim()) continue;
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(b.json);
      } catch {
        return { ok: false, message: `كتلة Structured Data "${b.label || "بدون اسم"}" تحتوي JSON غير صالح.` };
      }
      structuredData.push({ label: b.label || "بدون اسم", data });
    }
  } catch {
    return { ok: false, message: "تعذر قراءة بيانات Structured Data." };
  }

  const payload = {
    path,
    label: String(formData.get("label") || "").trim() || null,
    meta_title: String(formData.get("meta_title") || "").trim() || null,
    meta_description: String(formData.get("meta_description") || "").trim() || null,
    meta_keywords: String(formData.get("meta_keywords") || "").trim() || null,
    canonical_url: canonical || null,
    og_title: String(formData.get("og_title") || "").trim() || null,
    og_description: String(formData.get("og_description") || "").trim() || null,
    og_image: String(formData.get("og_image") || "").trim() || null,
    og_type: String(formData.get("og_type") || "website").trim() || "website",
    twitter_card: String(formData.get("twitter_card") || "summary_large_image").trim() || "summary_large_image",
    twitter_title: String(formData.get("twitter_title") || "").trim() || null,
    twitter_description: String(formData.get("twitter_description") || "").trim() || null,
    twitter_image: String(formData.get("twitter_image") || "").trim() || null,
    robots_index: formData.get("robots_index") === "on",
    robots_follow: formData.get("robots_follow") === "on",
    structured_data: structuredData,
  };

  if (!dbEnabled) {
    return { ok: true, demo: true, message: "تم الحفظ (وضع تجريبي — اربط قاعدة البيانات لحفظ التغييرات فعلياً)." };
  }

  const cols = Object.keys(payload) as (keyof typeof payload)[];
  const vals = cols.map((c) => (c === "structured_data" ? JSON.stringify(payload[c]) : payload[c]));
  try {
    if (id) {
      await exec(`UPDATE seo_pages SET ${cols.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`, [...vals, id]);
    } else {
      await exec(`INSERT INTO seo_pages (id, ${cols.join(", ")}) VALUES (?, ${cols.map(() => "?").join(", ")})`, [
        crypto.randomUUID(),
        ...vals,
      ]);
    }
  } catch (e) {
    return dbError(e, "هذا المسار مستخدم بالفعل في سجل سيو آخر.");
  }

  revalidatePath(path);
  revalidatePath("/admin");
  return { ok: true, message: "تم حفظ إعدادات السيو بنجاح." };
}

/** Admin-only: حذف إعدادات سيو مسار معيّن (الصفحة بعدها ترجع تستخدم القيم الافتراضية بالكود). */
export async function deleteSeoPage(id: string, path?: string) {
  await guard();
  if (!dbEnabled) return { ok: true, demo: true };
  try {
    const n = await exec("DELETE FROM seo_pages WHERE id = ?", [id]);
    if (n === 0) return { ok: false, message: "لم يتم العثور على السجل." };
  } catch (e) {
    return dbError(e);
  }

  if (path) revalidatePath(path);
  revalidatePath("/admin");
  return { ok: true, message: "تم حذف إعدادات السيو." };
}
