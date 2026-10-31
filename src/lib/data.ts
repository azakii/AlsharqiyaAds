import { dbEnabled, query, parseJson } from "./db";
import { MOCK_INFLUENCERS, MOCK_AD_REQUESTS } from "./mock";
import type { Influencer, AdRequest } from "./types";

/**
 * Strips the private license_number column and replaces it with a safe derived boolean
 * (has_license) before a row ever reaches a public page. RLS only filters rows, not
 * columns, so this application-layer step is what actually keeps the raw license number
 * out of anything sent to the browser on public pages.
 */
function fromRow(row: Influencer): Influencer {
  return { ...row, socials: parseJson(row.socials, {}) };
}

function toPublicInfluencer(row: Influencer & { license_number?: string | null }): Influencer {
  const { license_number, ...rest } = row;
  return { ...rest, has_license: Boolean(license_number) };
}

/** Public: only approved influencers, for the site grid + profiles. */
export async function getApprovedInfluencers(): Promise<Influencer[]> {
  if (!dbEnabled) return MOCK_INFLUENCERS.filter((i) => i.status === "approved");
  try {
    const rows = await query<Influencer>("SELECT * FROM influencers WHERE status = 'approved' ORDER BY created_at DESC");
    return rows.map((r) => toPublicInfluencer(fromRow(r)));
  } catch (e) {
    console.error("getApprovedInfluencers:", e);
    return [];
  }
}

/** Public: single influencer for the profile page — never exposes the raw license number. */
export async function getInfluencerById(id: string): Promise<Influencer | null> {
  if (!dbEnabled) return MOCK_INFLUENCERS.find((i) => i.id === id) ?? null;
  const [row] = await query<Influencer>("SELECT * FROM influencers WHERE id = ?", [id]);
  return row ? toPublicInfluencer(fromRow(row)) : null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Public: same as getInfluencerById but also resolves a friendly slug —
 * used by the /influencer/[id] route so it accepts either a UUID or a slug.
 */
export async function getInfluencerByIdOrSlug(idOrSlug: string): Promise<Influencer | null> {
  if (!dbEnabled) {
    return (
      MOCK_INFLUENCERS.find((i) => i.id === idOrSlug || i.slug === idOrSlug) ?? null
    );
  }
  // Next.js لا يفكّ ترميز الـ params في بعض الحالات (سلاق عربي)، فيوصل هنا كـ
  // "%D9%81%D9%87..." بدل "فهد-العنزي" ويفشل التطابق مع القيمة المخزنة في القاعدة.
  try {
    idOrSlug = decodeURIComponent(idOrSlug);
  } catch {
    // قيمة غير قابلة لفك الترميز (نادر) — نكمل بالقيمة الخام.
  }
  const column = UUID_RE.test(idOrSlug) ? "id" : "slug";
  const [row] = await query<Influencer>(`SELECT * FROM influencers WHERE ${column} = ?`, [idOrSlug]);
  return row ? toPublicInfluencer(fromRow(row)) : null;
}

/**
 * Owner-only: same row but keeps the raw license_number so the influencer can see/edit
 * their own submission on /account. Safe because account/page.tsx already verifies
 * ownership via the signed sq_user session cookie before calling this.
 */
export async function getOwnInfluencerProfile(id: string): Promise<Influencer | null> {
  if (!dbEnabled) return MOCK_INFLUENCERS.find((i) => i.id === id) ?? null;
  const [row] = await query<Influencer>("SELECT * FROM influencers WHERE id = ?", [id]);
  return row ? fromRow(row) : null;
}

/**
 * Admin: every influencer regardless of status. Callers (admin/page.tsx) gate this behind isAdmin().
 */
export async function getAllInfluencers(): Promise<Influencer[]> {
  if (!dbEnabled) return MOCK_INFLUENCERS;
  try {
    return (await query<Influencer>("SELECT * FROM influencers ORDER BY created_at DESC")).map(fromRow);
  } catch (e) {
    console.error("getAllInfluencers:", e);
    return [];
  }
}

/** Admin: every ad request. Admin-gated by the caller, like getAllInfluencers. */
export async function getAllAdRequests(): Promise<AdRequest[]> {
  if (!dbEnabled) return MOCK_AD_REQUESTS;
  try {
    return await query<AdRequest>("SELECT * FROM ad_requests ORDER BY created_at DESC");
  } catch (e) {
    console.error("getAllAdRequests:", e);
    return [];
  }
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
    pending: ads.filter((a) => a.status === "pending").length,
    reviewing: influencers.filter((i) => i.status === "pending").length,
    adRequests: ads.length,
    totalFollowers: approved.reduce((s, i) => s + (i.followers || 0), 0),
    cities: new Set(approved.map((i) => i.city)).size,
  };
}
