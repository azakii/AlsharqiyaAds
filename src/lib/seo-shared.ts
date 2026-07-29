/**
 * أنواع وثوابت السيو الآمنة للاستيراد من مكونات client ("use client") — بدون أي اعتماد على
 * next/headers أو Supabase، عشان لا تُسحب أكواد سيرفر-فقط داخل حزمة المتصفح. الدوال اللي
 * بتتكلم مع القاعدة (getSeoForPath...) موجودة في lib/seo.ts وتُستورد فقط من مكونات السيرفر.
 */

export interface StructuredDataBlock {
  label: string;
  data: Record<string, unknown>;
}

export interface SeoPage {
  id: string;
  path: string;
  label: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_type: string | null;
  twitter_card: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  twitter_image: string | null;
  robots_index: boolean;
  robots_follow: boolean;
  structured_data: StructuredDataBlock[];
  created_at?: string;
  updated_at?: string;
}

/** المسارات الثابتة المعروفة — تُستخدم في لوحة الإدارة لـ"إضافة سريعة" بدون كتابة المسار يدوياً. */
export const KNOWN_PAGES: { path: string; label: string }[] = [
  { path: "/", label: "الصفحة الرئيسية" },
  { path: "/influencers", label: "صفحة المشاهير" },
  { path: "/ad-request", label: "طلب إعلان" },
  { path: "/register", label: "تسجيل كمؤثر" },
  { path: "/login", label: "تسجيل الدخول" },
  { path: "/forgot-password", label: "نسيت كلمة المرور" },
  { path: "/reset-password", label: "إعادة تعيين كلمة المرور" },
  { path: "/account", label: "حسابي" },
  { path: "/admin", label: "لوحة الإدارة" },
];

/** يحوّل اسماً (عربي أو إنجليزي) إلى slug صالح للرابط: يحتفظ بالحروف العربية/اللاتينية والأرقام فقط. */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
