"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSupabase, getSupabaseAdmin, supabaseEnabled } from "./supabase";
import { adminCreds, makeToken, ADMIN_COOKIE, isAdmin } from "./auth";
import { makeUserToken, currentInfluencerId, USER_COOKIE } from "./userAuth";
import { DEFAULT_SETTINGS, type SiteSettings } from "./settings";
import { isSaudiPhone, SAUDI_PHONE_ERROR } from "./validators";
import type { InfluencerStatus, AdRequestStatus } from "./types";

// ---------- Public submissions ----------

export async function submitInfluencer(formData: FormData) {
  const phone = String(formData.get("phone") || "");
  if (!isSaudiPhone(phone)) return { ok: false, message: SAUDI_PHONE_ERROR };

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!email) return { ok: false, message: "البريد الإلكتروني مطلوب لإنشاء حساب الدخول." };
  if (password.length < 6) return { ok: false, message: "كلمة المرور يجب ألا تقل عن 6 أحرف." };

  const basePayload = {
    name: String(formData.get("name") || ""),
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

  if (!supabaseEnabled) {
    return { ok: true, demo: true, message: "تم استلام الطلب (وضع تجريبي — لم يتم ربط قاعدة البيانات بعد)." };
  }
  const sb = getSupabaseAdmin();
  if (!sb) return { ok: false, message: "قاعدة البيانات غير متاحة حالياً (مفتاح الخدمة غير مُعد)." };

  // ننشئ حساب الدخول (Supabase Auth) فور التسجيل حتى تكون كلمة المرور مُشفّرة من قِبل
  // سبابيز مباشرة (بدون تخزينها عندنا)، لكن تسجيل الدخول الفعلي يبقى مرفوضاً من السيرفر
  // (loginInfluencer) حتى توافق الإدارة على الطلب — راجع الملاحظة في schema.sql.
  const { data: authData, error: authError } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError || !authData.user) {
    const msg = authError?.message?.includes("already registered")
      ? "هذا البريد الإلكتروني مسجّل بالفعل، جرّب تسجيل الدخول بدلاً من ذلك."
      : authError?.message || "تعذر إنشاء حساب الدخول.";
    return { ok: false, message: msg };
  }

  const payload = { ...basePayload, auth_user_id: authData.user.id };
  const { error } = await sb.from("influencers").insert(payload);
  if (error) {
    // تراجع: احذف حساب الدخول اللي اتعمل عشان يقدر يسجل تاني بنفس البريد
    await sb.auth.admin.deleteUser(authData.user.id);
    return { ok: false, message: error.message };
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

  if (!supabaseEnabled) {
    return { ok: true, demo: true, message: "تم استلام طلب الإعلان (وضع تجريبي — لم يتم ربط قاعدة البيانات بعد)." };
  }
  const sb = getSupabaseAdmin();
  if (!sb) return { ok: false, message: "قاعدة البيانات غير متاحة حالياً (مفتاح الخدمة غير مُعد)." };
  const { error } = await sb.from("ad_requests").insert(payload);
  if (error) return { ok: false, message: error.message };

  // نحاول نزوّد عداد "طلبات الإعلان" بتاع المؤثر المستهدف — target_influencer مخزّن كاسم
  // نصي (من قائمة select في الفورم) مش id، فالمطابقة بالاسم أفضل حل متاح بالشكل الحالي.
  // لو حابب تتبع أدق مستقبلاً، ينفع نحوّل الحقل ده لـ id بدل الاسم.
  if (payload.target_influencer) {
    const { data: match } = await sb
      .from("influencers")
      .select("id")
      .ilike("name", payload.target_influencer.trim())
      .maybeSingle();
    if (match) {
      await sb.rpc("increment_influencer_stat", { influencer_id: match.id, stat_column: "ad_requests" });
    }
  }

  return { ok: true, message: "تم إرسال طلب الإعلان بنجاح، سنتواصل معك قريباً." };
}

/**
 * Public: bump a view/click/ad_requests counter. Runs via the service-role client since
 * anon-key writes are blocked by RLS on purpose — this is the one write visitors trigger
 * without being an admin or the profile owner, scoped to a safe atomic counter increment.
 */
export async function incrementInfluencerStat(
  id: string,
  stat: "views" | "clicks" | "ad_requests"
): Promise<{ ok: boolean }> {
  if (!supabaseEnabled) return { ok: true };
  const sb = getSupabaseAdmin();
  if (!sb) return { ok: false };
  const { error } = await sb.rpc("increment_influencer_stat", { influencer_id: id, stat_column: stat });
  if (error) {
    console.error("incrementInfluencerStat:", error.message);
    return { ok: false };
  }
  return { ok: true };
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

  if (!supabaseEnabled) {
    return { ok: false, message: "تسجيل الدخول غير متاح حالياً (لم يتم ربط قاعدة البيانات بعد)." };
  }

  const anon = getSupabase();
  if (!anon) return { ok: false, message: "تعذر الاتصال بالخادم." };
  const { data: authData, error: authError } = await anon.auth.signInWithPassword({ email, password });
  if (authError || !authData.user) {
    return { ok: false, message: "البريد الإلكتروني أو كلمة المرور غير صحيحة." };
  }

  const sb = getSupabaseAdmin();
  if (!sb) return noServiceRoleError();

  const { data: inf } = await sb
    .from("influencers")
    .select("id,status")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();

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

/**
 * "نسيت كلمة المرور؟" — يرسل Supabase إيميل فيه رابط إعادة تعيين لو البريد مسجل فعلاً.
 * نرجّع رسالة نجاح ثابتة سواء كان البريد موجود أو لأ، عشان محدش يقدر يتأكد إن بريد معين مسجل عندنا.
 */
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  if (!email) return { ok: false, message: "البريد الإلكتروني مطلوب." };

  const genericMessage = "لو البريد الإلكتروني مسجّل عندنا، وصلك رابط لإعادة تعيين كلمة المرور خلال دقائق.";

  if (!supabaseEnabled) return { ok: true, message: genericMessage };
  const anon = getSupabase();
  if (!anon) return { ok: false, message: "تعذر الاتصال بالخادم." };

  const { error } = await anon.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteOrigin()}/reset-password`,
  });
  // ما نكشفش تفاصيل الخطأ للمستخدم (زي "البريد غير موجود") حفاظاً على الخصوصية — بس نسجله في اللوج.
  if (error) console.error("requestPasswordReset:", error.message);

  return { ok: true, message: genericMessage };
}

/** تغيير كلمة المرور من داخل صفحة "حسابي" — يتطلب معرفة كلمة المرور الحالية أولاً كتأكيد هوية. */
export async function changePassword(formData: FormData) {
  const uid = currentInfluencerId();
  if (!uid) return { ok: false, message: "يجب تسجيل الدخول أولاً." };

  const currentPassword = String(formData.get("current_password") || "");
  const newPassword = String(formData.get("new_password") || "");
  if (!currentPassword) return { ok: false, message: "أدخل كلمة المرور الحالية." };
  if (newPassword.length < 6) return { ok: false, message: "كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف." };

  if (!supabaseEnabled) return { ok: true, demo: true, message: "تم الحفظ (وضع تجريبي)." };
  const sb = getSupabaseAdmin();
  if (!sb) return noServiceRoleError();

  const { data: inf } = await sb.from("influencers").select("email,auth_user_id").eq("id", uid).maybeSingle();
  if (!inf || !inf.auth_user_id) return { ok: false, message: "تعذر العثور على حسابك." };

  // نتأكد إن كلمة المرور الحالية صح قبل ما نغيّرها — بمحاولة تسجيل دخول فعلي بيها.
  const anon = getSupabase();
  if (!anon) return { ok: false, message: "تعذر الاتصال بالخادم." };
  const { error: verifyError } = await anon.auth.signInWithPassword({ email: inf.email, password: currentPassword });
  if (verifyError) return { ok: false, message: "كلمة المرور الحالية غير صحيحة." };

  const { error } = await sb.auth.admin.updateUserById(inf.auth_user_id, { password: newPassword });
  if (error) return { ok: false, message: error.message };

  return { ok: true, message: "تم تغيير كلمة المرور بنجاح." };
}

// ---------- Admin mutations ----------
// Every mutation below requires the SUPABASE_SERVICE_ROLE_KEY (getSupabaseAdmin only returns a
// client when it's set — see supabase.ts). Without it, RLS blocks anon writes with zero rows
// affected and NO error, which used to make "accept/reject/delete" silently do nothing. Every
// action here now returns an explicit, visible error instead of pretending to succeed.

async function guard() {
  if (!isAdmin()) throw new Error("unauthorized");
}

function noServiceRoleError() {
  return {
    ok: false,
    message: "الإجراء فشل: مفتاح SUPABASE_SERVICE_ROLE_KEY غير مضاف في إعدادات البيئة (Vercel). أضفه ثم أعد النشر.",
  };
}

export async function setInfluencerStatus(id: string, status: InfluencerStatus) {
  await guard();
  if (!supabaseEnabled) return { ok: true, demo: true };
  const sb = getSupabaseAdmin();
  if (!sb) return noServiceRoleError();

  const { data, error } = await sb.from("influencers").update({ status }).eq("id", id).select("id");
  if (error) return { ok: false, message: error.message };
  if (!data || data.length === 0) return { ok: false, message: "لم يتم العثور على المؤثر أو لا يوجد صلاحية للتعديل." };

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

/** إجراء مجمع: تغيير حالة عدة مؤثرين مرة واحدة (تحديث واحد في قاعدة البيانات بدل حلقة). */
export async function bulkSetInfluencerStatus(ids: string[], status: InfluencerStatus) {
  await guard();
  if (!ids || ids.length === 0) return { ok: false, message: "لم يتم تحديد أي مؤثر." };
  if (!supabaseEnabled) return { ok: true, demo: true };
  const sb = getSupabaseAdmin();
  if (!sb) return noServiceRoleError();

  const { data, error } = await sb.from("influencers").update({ status }).in("id", ids).select("id");
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true, message: `تم تحديث حالة ${data?.length ?? 0} مؤثر.` };
}

/** إجراء مجمع: حذف عدة مؤثرين مرة واحدة. */
export async function bulkDeleteInfluencers(ids: string[]) {
  await guard();
  if (!ids || ids.length === 0) return { ok: false, message: "لم يتم تحديد أي مؤثر." };
  if (!supabaseEnabled) return { ok: true, demo: true };
  const sb = getSupabaseAdmin();
  if (!sb) return noServiceRoleError();

  const { data, error } = await sb.from("influencers").delete().in("id", ids).select("id");
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true, message: `تم حذف ${data?.length ?? 0} مؤثر.` };
}

export async function setVerified(id: string, verified: boolean) {
  await guard();
  if (!supabaseEnabled) return { ok: true, demo: true };
  const sb = getSupabaseAdmin();
  if (!sb) return noServiceRoleError();

  const { data, error } = await sb.from("influencers").update({ verified }).eq("id", id).select("id");
  if (error) return { ok: false, message: error.message };
  if (!data || data.length === 0) return { ok: false, message: "لم يتم العثور على المؤثر." };

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

function influencerPayloadFromForm(formData: FormData) {
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
  };
}

/** Admin-only: add an influencer directly from the dashboard (skips the public review queue). */
export async function adminCreateInfluencer(formData: FormData) {
  await guard();
  const payload = influencerPayloadFromForm(formData);

  if (!payload.name || !payload.phone) {
    return { ok: false, message: "الاسم ورقم الجوال مطلوبان." };
  }
  if (!isSaudiPhone(payload.phone)) {
    return { ok: false, message: SAUDI_PHONE_ERROR };
  }

  if (!supabaseEnabled) {
    return { ok: true, demo: true, message: "تمت الإضافة (وضع تجريبي — فعّل Supabase لحفظ البيانات فعلياً)." };
  }
  const sb = getSupabaseAdmin();
  if (!sb) return noServiceRoleError();

  const { error } = await sb.from("influencers").insert({
    ...payload,
    views: 0,
    clicks: 0,
    ad_requests: 0,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true, message: "تمت إضافة المؤثر بنجاح." };
}

/** Admin-only: edit an existing influencer's profile. */
export async function adminUpdateInfluencer(id: string, formData: FormData) {
  await guard();
  const payload = influencerPayloadFromForm(formData);

  if (!payload.name || !payload.phone) {
    return { ok: false, message: "الاسم ورقم الجوال مطلوبان." };
  }
  if (!isSaudiPhone(payload.phone)) {
    return { ok: false, message: SAUDI_PHONE_ERROR };
  }

  if (!supabaseEnabled) {
    return { ok: true, demo: true, message: "تم الحفظ (وضع تجريبي — فعّل Supabase لحفظ البيانات فعلياً)." };
  }
  const sb = getSupabaseAdmin();
  if (!sb) return noServiceRoleError();

  const { data, error } = await sb.from("influencers").update(payload).eq("id", id).select("id");
  if (error) return { ok: false, message: error.message };
  if (!data || data.length === 0) return { ok: false, message: "لم يتم العثور على المؤثر." };

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true, message: "تم حفظ التعديلات بنجاح." };
}

/** Fields an influencer may edit on their own profile — status/verified stay admin-only. */
function selfPayloadFromForm(formData: FormData) {
  return {
    name: String(formData.get("name") || ""),
    phone: String(formData.get("phone") || ""),
    email: String(formData.get("email") || ""),
    city: String(formData.get("city") || ""),
    category: String(formData.get("category") || ""),
    bio: String(formData.get("bio") || ""),
    // followers متعمداً غير موجود هنا: المؤثر لا يملك صلاحية تعديل عدد المتابعين،
    // هذه الخاصية حصرية للإدارة (راجع AccountForm.tsx).
    avatar_url: String(formData.get("avatar_url") || ""),
    socials: {
      instagram: String(formData.get("instagram") || ""),
      tiktok: String(formData.get("tiktok") || ""),
      x: String(formData.get("x") || ""),
      whatsapp: String(formData.get("whatsapp") || ""),
      snapchat: String(formData.get("snapchat") || ""),
    },
    license_number: String(formData.get("license_number") || "").trim() || null,
  };
}

/** Influencer-only: edit their own profile. Requires a valid sq_user session cookie. */
export async function updateOwnProfile(formData: FormData) {
  const uid = currentInfluencerId();
  if (!uid) return { ok: false, message: "يجب تسجيل الدخول أولاً." };

  const payload = selfPayloadFromForm(formData);
  if (!payload.name || !payload.phone) return { ok: false, message: "الاسم ورقم الجوال مطلوبان." };
  if (!isSaudiPhone(payload.phone)) return { ok: false, message: SAUDI_PHONE_ERROR };

  if (!supabaseEnabled) {
    return { ok: true, demo: true, message: "تم الحفظ (وضع تجريبي — فعّل Supabase لحفظ البيانات فعلياً)." };
  }
  const sb = getSupabaseAdmin();
  if (!sb) return noServiceRoleError();

  const { data, error } = await sb.from("influencers").update(payload).eq("id", uid).select("id");
  if (error) return { ok: false, message: error.message };
  if (!data || data.length === 0) return { ok: false, message: "تعذر العثور على ملفك الشخصي." };

  revalidatePath("/account");
  revalidatePath("/");
  return { ok: true, message: "تم حفظ التعديلات بنجاح." };
}

export async function deleteInfluencer(id: string) {
  await guard();
  if (!supabaseEnabled) return { ok: true, demo: true };
  const sb = getSupabaseAdmin();
  if (!sb) return noServiceRoleError();

  const { data, error } = await sb.from("influencers").delete().eq("id", id).select("id");
  if (error) return { ok: false, message: error.message };
  if (!data || data.length === 0) return { ok: false, message: "لم يتم العثور على المؤثر أو لا يوجد صلاحية للحذف." };

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

export async function setAdRequestStatus(id: string, status: AdRequestStatus) {
  await guard();
  if (!supabaseEnabled) return { ok: true, demo: true };
  const sb = getSupabaseAdmin();
  if (!sb) return noServiceRoleError();

  const { data, error } = await sb.from("ad_requests").update({ status }).eq("id", id).select("id");
  if (error) return { ok: false, message: error.message };
  if (!data || data.length === 0) return { ok: false, message: "لم يتم العثور على الطلب." };

  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteAdRequest(id: string) {
  await guard();
  if (!supabaseEnabled) return { ok: true, demo: true };
  const sb = getSupabaseAdmin();
  if (!sb) return noServiceRoleError();

  const { data, error } = await sb.from("ad_requests").delete().eq("id", id).select("id");
  if (error) return { ok: false, message: error.message };
  if (!data || data.length === 0) return { ok: false, message: "لم يتم العثور على الطلب أو لا يوجد صلاحية للحذف." };

  revalidatePath("/admin");
  return { ok: true };
}

// ---------- Site settings (CMS) ----------

export async function saveSettings(formData: FormData) {
  await guard();
  const payload: Record<string, string> = { id: "1" as unknown as string };
  (Object.keys(DEFAULT_SETTINGS) as (keyof SiteSettings)[]).forEach((k) => {
    payload[k] = String(formData.get(k) ?? "");
  });

  if (!supabaseEnabled) {
    return { ok: true, demo: true, message: "تم الحفظ (وضع تجريبي — فعّل Supabase لحفظ التغييرات فعلياً)." };
  }
  const sb = getSupabaseAdmin();
  if (!sb) return noServiceRoleError();

  const { error } = await sb.from("site_settings").upsert({ ...payload, id: 1 });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/", "layout");
  return { ok: true, message: "تم حفظ الإعدادات بنجاح." };
}
