import { getSupabase, supabaseEnabled } from "./supabase";
import { MOCK_INFLUENCERS, MOCK_AD_REQUESTS } from "./mock";
import type { Influencer, AdRequest } from "./types";

/** Public: only approved influencers, for the site grid + profiles. */
export async function getApprovedInfluencers(): Promise<Influencer[]> {
  if (!supabaseEnabled) return MOCK_INFLUENCERS.filter((i) => i.status === "approved");
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("influencers")
    .select("*")
    .eq("status", "approved")
    .order("followers", { ascending: false });
  if (error) {
    console.error("getApprovedInfluencers:", error.message);
    return [];
  }
  return (data as Influencer[]) ?? [];
}

export async function getInfluencerById(id: string): Promise<Influencer | null> {
  if (!supabaseEnabled) return MOCK_INFLUENCERS.find((i) => i.id === id) ?? null;
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from("influencers").select("*").eq("id", id).single();
  if (error) return null;
  return data as Influencer;
}

/** Admin: every influencer regardless of status. */
export async function getAllInfluencers(): Promise<Influencer[]> {
  if (!supabaseEnabled) return MOCK_INFLUENCERS;
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from("influencers").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return (data as Influencer[]) ?? [];
}

export async function getAllAdRequests(): Promise<AdRequest[]> {
  if (!supabaseEnabled) return MOCK_AD_REQUESTS;
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from("ad_requests").select("*").order("created_at", { ascending: false });
  if (error) return [];
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
