export type InfluencerStatus = "pending" | "approved" | "rejected";

export interface Influencer {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  category: string;
  bio: string;
  followers: number;
  views: number;
  clicks: number;
  ad_requests: number;
  avatar_url: string;
  gallery: string[];
  verified: boolean;
  status: InfluencerStatus;
  socials: {
    instagram?: string;
    tiktok?: string;
    x?: string;
    whatsapp?: string;
    snapchat?: string;
  };
  created_at?: string;
}

export type AdRequestStatus = "pending" | "approved" | "rejected";

export interface AdRequest {
  id: string;
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
  category: string;
  city: string;
  details: string;
  budget: number;
  target_influencer: string;
  status: AdRequestStatus;
  created_at?: string;
}
