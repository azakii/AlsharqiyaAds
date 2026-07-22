"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin, supabaseEnabled } from "./supabase";
import { adminCreds, makeToken, ADMIN_COOKIE, isAdmin } from "./auth";
import type { InfluencerStatus, AdRequestStatus } from "./types";

// ---------- Public submissions ----------

export async function submitInfluencer(formData: FormData) {
  const payload = {
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
    verified: false,
    status: "pending" as InfluencerStatus,
    views: 0,
    clicks: 0,
    ad_requests: 0,
    gallery: [],
  };

  if (!supabaseEnabled) {
    return { ok: true, demo: true, message: "تم استلام الطلب (وضع تجريبي — لم يتم ربط قاعدة البيانات بعد)." };
  }
  const sb = getSupabaseAdmin();
  if (!sb) return { ok: false, message: "قاعدة البيانات غير متاحة." };
  const { error } = await sb.from("influencers").insert(payload);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "تم إرسال طلب التسجيل بنجاح، سيتم مراجعته قريباً." };
}

export async function submitAdRequest(formData: FormData) {
  const payload = {
    company_name: String(formData.get("company_name") || ""),
    contact_name: String(formData.get("contact_name") || ""),
    phone: String(formData.get("phone") || ""),
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
  if (!sb) return { ok: false, message: "قاعدة البيانات غير متاحة." };
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

async function guard() {
  if (!isAdmin()) throw new Error("unauthorized");
}

export async function setInfluencerStatus(id: string, status: InfluencerStatus) {
  await guard();
  if (supabaseEnabled) {
    const sb = getSupabaseAdmin();
    await sb?.from("influencers").update({ status, verified: status === "approved" }).eq("id", id);
  }
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteInfluencer(id: string) {
  await guard();
  if (supabaseEnabled) {
    const sb = getSupabaseAdmin();
    await sb?.from("influencers").delete().eq("id", id);
  }
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

export async function setAdRequestStatus(id: string, status: AdRequestStatus) {
  await guard();
  if (supabaseEnabled) {
    const sb = getSupabaseAdmin();
    await sb?.from("ad_requests").update({ status }).eq("id", id);
  }
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteAdRequest(id: string) {
  await guard();
  if (supabaseEnabled) {
    const sb = getSupabaseAdmin();
    await sb?.from("ad_requests").delete().eq("id", id);
  }
  revalidatePath("/admin");
  return { ok: true };
}
