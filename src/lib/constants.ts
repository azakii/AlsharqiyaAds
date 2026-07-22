export const CITIES = [
  "الدمام",
  "الخبر",
  "الظهران",
  "الأحساء",
  "الجبيل",
  "قطيف",
  "حفر الباطن",
  "رفحاء",
];

export const CATEGORIES = [
  "لايف ستايل",
  "طبخ",
  "أزياء",
  "تقنية",
  "رياضة",
  "ترفيه",
  "تعليمي",
  "تسويق",
  "صحة",
  "سياحة",
];

export const SITE = {
  name: "إعلانات الشرقية",
  nameEn: "EASTERN PROVINCE ADS",
  phone: "+966 50 000 0000",
  email: "info@eastern-ads.sa",
  location: "المنطقة الشرقية، المملكة العربية السعودية",
  description:
    "أكبر دليل للمشاهير وصناع المحتوى الموثّقين في المنطقة الشرقية، نربط الشركات والمشاريع بنخبة المؤثرين لتسهيل التعاون والتواصل المباشر.",
};

export function formatFollowers(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}
