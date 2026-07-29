import { getSupabase, getSupabaseAdmin, supabaseEnabled } from "./supabase";
import { MOCK_INFLUENCERS, MOCK_AD_REQUESTS } from "./mock";
import type { Influencer, AdRequest } from "./types";

/**
 * Strips the private license_number column and replaces it with a safe derived boolean
 * (has_license) before a row ever reaches a public page. RLS only filters rows, not
 * columns, so this application-layer step is what actually keeps the raw license number
 * out of anything sent to the browser on public pages.
 */
function toPublicInfluencer(row: Influencer & { license_number?: string | null }): Influencer {
  const { license_number, ...rest } = row;
  return { ...rest, has_license: Boolean(license_number) };
}

/** Public: only approved influencers, for the site grid + profiles. */
export async function getApprovedInfluencers(): Promise<Influencer[]> {
  if (!supabaseEnabled) return MOCK_INFLUENCERS.filter((i) => i.status === "approved");
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("influencers")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getApprovedInfluencers:", error.message);
    return [];
  }
  return ((data as Influencer[]) ?? []).map(toPublicInfluencer);
}

/** Public: single influencer for the profile page — never exposes the raw license number. */
export async function getInfluencerById(id: string): Promise<Influencer | null> {
  if (!supabaseEnabled) return MOCK_INFLUENCERS.find((i) => i.id === id) ?? null;
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from("influencers").select("*").eq("id", id).single();
  if (error) return null;
  return toPublicInfluencer(data as Influencer);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Public: same as getInfluencerById but also resolves a friendly slug —
 * used by the /influencer/[id] route so it accepts either a UUID or a slug.
 */
export async function getInfluencerByIdOrSlug(idOrSlug: string): Promise<Influencer | null> {
  if (!supabaseEnabled) {
    return (
      MOCK_INFLUENCERS.find((i) => i.id === idOrSlug || i.slug === idOrSlug) ?? null
    );
  }
  const sb = getSupabase();
  if (!sb) return null;
  // Next.js لا يفكّ ترميز الـ params في بعض الحالات (سلاق عربي)، فيوصل هنا كـ
  // "%D9%81%D9%87..." بدل "فهد-العنزي" ويفشل التطابق مع القيمة المخزنة في القاعدة.
  try {
    idOrSlug = decodeURIComponent(idOrSlug);
  } catch {
    // قيمة غير قابلة لفك الترميز (نادر) — نكمل بالقيمة الخام.
  }
  const column = UUID_RE.test(idOrSlug) ? "id" : "slug";
  const { data, error } = await sb.from("influencers").select("*").eq(column, idOrSlug).maybeSingle();
  if (error || !data) return null;
  return toPublicInfluencer(data as Influencer);
}

/**
 * Owner-only: same row but keeps the raw license_number so the influencer can see/edit
 * their own submission on /account. Safe because account/page.tsx already verifies
 * ownership via the signed sq_user session cookie before calling this.
 */
export async function getOwnInfluencerProfile(id: string): Promise<Influencer | null> {
  if (!supabaseEnabled) return MOCK_INFLUENCERS.find((i) => i.id === id) ?? null;
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb.from("influencers").select("*").eq("id", id).single();
  if (error) return null;
  return data as Influencer;
}

/**
 * Admin: every influencer regardless of status. Must use the service-role client —
 * the RLS policy "public read approved influencers" only allows the anon key to see
 * status='approved' rows. Using the anon key here silently hid pending/rejected rows
 * from the admin dashboard entirely (e.g. rejecting someone made them "disappear").
 */
export async function getAllInfluencers(): Promise<Influencer[]> {
  if (!supabaseEnabled) return MOCK_INFLUENCERS;
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data, error } = await sb.from("influencers").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("getAllInfluencers:", error.message);
    return [];
  }
  return (data as Influencer[]) ?? [];
}

/** Admin: every ad request. Same reasoning as getAllInfluencers — needs the service role. */
export async function getAllAdRequests(): Promise<AdRequest[]> {
  if (!supabaseEnabled) return MOCK_AD_REQUESTS;
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data, error } = await sb.from("ad_requests").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("getAllAdRequests:", error.message);
    return [];
  }
  return (data as AdRequest[]) ?? [];
}

export interface Stats {
  totalInfluencers: number;
  pending: number;
  reviewing: number;
  adRequests: number;
  totalFollowers: number;
  cities: number;
}

export async function getStats(): Promise<Stats> {
  const [influencers, ads] = await Promise.all([getAllInfluencers(), getAllAdRequests()]);
  const approved = influencers.filter((i) => i.status === "approved");
  return {
    totalInfluencers: influencers.length,
    pending: influencers.filter((i) => i.status === "pending").length,
    reviewing: influencers.filter((i) => i.status === "pending").length,
    adRequests: ads.length,
    totalFollowers: approved.reduce((s, i) => s + (i.followers || 0), 0),
    cities: new Set(approved.map((i) => i.city)).size,
  };
}
