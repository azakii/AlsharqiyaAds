import { headers } from "next/headers";
import type { Metadata } from "next";
import { getSupabase, supabaseEnabled } from "./supabase";
import type { SiteSettings } from "./settings";
import { type SeoPage, type StructuredDataBlock } from "./seo-shared";

// أعِد تصدير الثوابت/الأنواع المشتركة عشان كود السيرفر يقدر يستوردها من مكان واحد (lib/seo) —
// أما مكونات client فلازم تستورد من lib/seo-shared مباشرة لتجنّب سحب next/headers لحزمة المتصفح.
export { KNOWN_PAGES, slugify } from "./seo-shared";
export type { SeoPage, StructuredDataBlock } from "./seo-shared";

/** الأصل (origin) الحالي من رأس الطلب — لبناء روابط canonical/OG مطلقة. */
export function siteOrigin(): string {
  const h = headers();
  const host = h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function normalizeRow(row: Record<string, unknown>): SeoPage {
  let structured: StructuredDataBlock[] = [];
  if (Array.isArray(row.structured_data)) {
    structured = (row.structured_data as unknown[]).filter(
      (b): b is StructuredDataBlock =>
        typeof b === "object" && b !== null && "data" in (b as Record<string, unknown>)
    );
  }
  return {
    id: String(row.id),
    path: String(row.path),
    label: (row.label as string) ?? null,
    meta_title: (row.meta_title as string) ?? null,
    meta_description: (row.meta_description as string) ?? null,
    meta_keywords: (row.meta_keywords as string) ?? null,
    canonical_url: (row.canonical_url as string) ?? null,
    og_title: (row.og_title as string) ?? null,
    og_description: (row.og_description as string) ?? null,
    og_image: (row.og_image as string) ?? null,
    og_type: (row.og_type as string) ?? "website",
    twitter_card: (row.twitter_card as string) ?? "summary_large_image",
    twitter_title: (row.twitter_title as string) ?? null,
    twitter_description: (row.twitter_description as string) ?? null,
    twitter_image: (row.twitter_image as string) ?? null,
    robots_index: row.robots_index !== false,
    robots_follow: row.robots_follow !== false,
    structured_data: structured,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

/** قراءة عامة (anon) لصف سيو مسار معيّن — يُستخدم من generateMetadata في كل صفحة عامة. */
export async function getSeoForPath(path: string): Promise<SeoPage | null> {
  if (!supabaseEnabled) return null;
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from("seo_pages").select("*").eq("path", path).maybeSingle();
  if (error || !data) return null;
  return normalizeRow(data);
}

/** لوحة الإدارة: كل صفوف السيو المحفوظة، مرتبة بالأحدث تعديلاً. */
export async function getAllSeoPages(): Promise<SeoPage[]> {
  if (!supabaseEnabled) return [];
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from("seo_pages").select("*").order("updated_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(normalizeRow);
}

interface BuildMetadataArgs {
  path: string;
  seo: SeoPage | null;
  settings: SiteSettings;
  fallback: { title: string; description: string; image?: string };
}

/** يدمج (تجاوز سيو مخصص ← احتياطي الصفحة ← ديفولت الموقع) وينتج كائن Metadata جاهز لـ Next. */
export function buildMetadata({ path, seo, settings, fallback }: BuildMetadataArgs): Metadata {
  const origin = (() => {
    try {
      return siteOrigin();
    } catch {
      return "";
    }
  })();

  const title = seo?.meta_title || fallback.title || settings.default_meta_title || settings.brand_name;
  const description =
    seo?.meta_description || fallback.description || settings.default_meta_description || settings.footer_about;
  const keywordsRaw = seo?.meta_keywords || settings.default_meta_keywords || "";
  const keywords = keywordsRaw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const ogImage = seo?.og_image || fallback.image || settings.default_og_image || "";
  const canonical = seo?.canonical_url || (origin ? `${origin}${path}` : undefined);

  const robotsIndex = seo ? seo.robots_index : settings.default_robots_index !== false;
  const robotsFollow = seo ? seo.robots_follow : settings.default_robots_follow !== false;

  const metadata: Metadata = {
    title,
    description,
    ...(keywords.length ? { keywords } : {}),
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      title: seo?.og_title || title,
      description: seo?.og_description || description,
      type: (seo?.og_type as "website" | "article" | undefined) || "website",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: (seo?.twitter_card as "summary" | "summary_large_image" | undefined) || "summary_large_image",
      title: seo?.twitter_title || seo?.og_title || title,
      description: seo?.twitter_description || seo?.og_description || description,
      ...(seo?.twitter_image || ogImage ? { images: [seo?.twitter_image || ogImage] } : {}),
      ...(settings.twitter_handle ? { site: settings.twitter_handle } : {}),
    },
    robots: { index: robotsIndex, follow: robotsFollow },
  };

  return metadata;
}
