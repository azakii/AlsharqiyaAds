import { getSupabase, supabaseEnabled } from "./supabase";

const MEDIA = "https://media.base44.com/images/public/6a568a5faa72478f74107d31";

export interface SiteSettings {
  brand_name: string;
  brand_name_en: string;
  logo_url: string; // optional image; empty => crown icon
  hero_badge: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  cta_title: string;
  cta_text: string;
  footer_about: string;
  contact_phone: string;
  contact_email: string;
  contact_location: string;
  support_whatsapp: string; // number for the floating support button, e.g. 9665xxxxxxxx
  color_bg: string;
  color_gold: string;
  color_gold_light: string;
  color_gold_dark: string;
  // ---- سيو عام (ديفولت لأي صفحة ما لهاش إعداد سيو خاص بها) ----
  favicon_url: string;
  default_og_image: string;
  default_meta_title: string;
  default_meta_description: string;
  default_meta_keywords: string;
  twitter_handle: string;
  google_site_verification: string;
  default_robots_index: boolean;
  default_robots_follow: boolean;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  brand_name: "إعلانات الشرقية",
  brand_name_en: "EASTERN PROVINCE ADS",
  logo_url: "",
  hero_badge: "المنصة الرسمية للمشاهير في المنطقة الشرقية",
  hero_title: "إعلانات الشرقية",
  hero_subtitle:
    "اكتشف أبرز الشخصيات المؤثرة وصنّاع المحتوى في المنطقة الشرقية، وتواصل معهم مباشرة عبر حساباتهم الرسمية الموثّقة.",
  hero_image: `${MEDIA}/294d4c796_generated_fa56ee43.png`,
  cta_title: "انضم إلى نخبة المؤثرين",
  cta_text:
    "هل أنت صانع محتوى في المنطقة الشرقية؟ سجّل الآن واحصل على شارة التوثيق الذهبية وصل لآلاف الشركات والمشاريع.",
  footer_about:
    "أكبر دليل للمشاهير وصنّاع المحتوى الموثّقين في المنطقة الشرقية، نربط الشركات والمشاريع بنخبة المؤثرين لتسهيل التعاون والتواصل المباشر.",
  contact_phone: "+966 50 000 0000",
  contact_email: "info@eastern-ads.sa",
  contact_location: "المنطقة الشرقية، المملكة العربية السعودية",
  support_whatsapp: "966500000000",
  color_bg: "#06080B",
  color_gold: "#D4A017",
  color_gold_light: "#F5D17E",
  color_gold_dark: "#B8860B",
  favicon_url: "",
  default_og_image: "",
  default_meta_title: "",
  default_meta_description: "",
  default_meta_keywords: "",
  twitter_handle: "",
  google_site_verification: "",
  default_robots_index: true,
  default_robots_follow: true,
};

/** حقول boolean داخل SiteSettings — تحتاج معاملة خاصة في نماذج الحفظ (checkbox) بدل الحقول النصية. */
export const BOOLEAN_SETTINGS_KEYS: (keyof SiteSettings)[] = ["default_robots_index", "default_robots_follow"];

const KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof SiteSettings)[];

/** Merge a partial row from DB over the defaults so missing fields stay populated. */
export function mergeSettings(row: Partial<SiteSettings> | null | undefined): SiteSettings {
  const out = { ...DEFAULT_SETTINGS };
  if (row) {
    for (const k of KEYS) {
      const v = row[k];
      if (v !== undefined && v !== null && v !== "") (out[k] as string) = v as string;
    }
  }
  return out;
}

export async function getSettings(): Promise<SiteSettings> {
  if (!supabaseEnabled) return DEFAULT_SETTINGS;
  const sb = getSupabase();
  if (!sb) return DEFAULT_SETTINGS;
  const { data } = await sb.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return mergeSettings(data as Partial<SiteSettings>);
}
