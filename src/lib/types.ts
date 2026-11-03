export type InfluencerStatus = "pending" | "approved" | "rejected";

export type InfluencerPlan = "free" | "pro" | "vip";

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
  verified: boolean;
  status: InfluencerStatus;
  socials: {
    instagram?: string;
    tiktok?: string;
    x?: string;
    whatsapp?: string;
    snapchat?: string;
  };
  auth_user_id?: string | null;
  /** رقم رخصة منصة "موثوق" — حقل خاص، يُعاد فقط للإدارة أو لصاحب الملف نفسه (لا يظهر عبر القراءة العامة). */
  license_number?: string | null;
  /** مشتق آمن للعرض العام: هل يوجد رقم رخصة أم لا، بدون كشف الرقم نفسه. */
  has_license?: boolean;
  created_at?: string;
  /** رابط صديق اختياري لصفحة المؤثر (/influencer/<slug>) بديل عن الـ UUID. */
  slug?: string | null;
  /** الباقة الفعّالة: تُحسب في data.ts وتصبح "free" تلقائياً بعد plan_expires_at. */
  plan?: InfluencerPlan;
  plan_expires_at?: string | null;
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
