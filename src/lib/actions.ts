"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin, supabaseEnabled } from "./supabase";
import { adminCreds, makeToken, ADMIN_COOKIE, isAdmin } from "./auth";
import { DEFAULT_SETTINGS, type SiteSettings } from "./settings";
import { isSaudiPhone, SAUDI_PHONE_ERROR } from "./validators";
import type { InfluencerStatus, AdRequestStatus } from "./types";

// ---------- Public submissions ----------

export async function submitInfluencer(formData: FormData) {
  const phone = String(formData.get("phone") || "");
  if (!isSaudiPhone(phone)) return { ok: false, message: SAUDI_PHONE_ERROR };

  const payload = {
    name: String(formData.get("name") || ""),
    phone,
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
  const { error } = await sb.from("influencers").insert(payload);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "تم إرسال طلب التسجيل بنجاح، سيتم مراجعته قريباً." };
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
  return { ok: true, message: "تم إرسال طلب الإعلان بنجاح، سنتواصل معك قريباً." };
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
