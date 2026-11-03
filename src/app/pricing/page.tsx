import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { Crown } from "@/components/Icons";
import { getSettings } from "@/lib/settings";
import { normalizePhone } from "@/lib/validators";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "باقات المؤثرين" };

type Tier = "free" | "pro" | "vip";

// كل صف = ميزة، وقيمة كل باقة: true / false
const FEATURES: { label: string; free: boolean; pro: boolean; vip: boolean }[] = [
  { label: "ظهور في قائمة المؤثرين", free: true, pro: true, vip: true },
  { label: "صفحة ملف شخصي وروابط حساباتك", free: true, pro: true, vip: true },
  { label: "ترتيب أعلى من الباقة المجانية", free: false, pro: true, vip: true },
  { label: "شارة «عضو مميز» فضية على الكارد", free: false, pro: true, vip: false },
  { label: "كارد بتصميم ذهبي خاص وتاج", free: false, pro: false, vip: true },
  { label: "قسم خاص في الصفحة الرئيسية", free: false, pro: false, vip: true },
  { label: "أولوية في ترشيح طلبات المعلنين", free: false, pro: false, vip: true },
];

const PLANS: { tier: Tier; name: string; price: string; unit: string; yearly: string; tagline: string }[] = [
  { tier: "free", name: "أساسية", price: "مجانية", unit: "", yearly: "", tagline: "ابدأ وكن ضمن الدليل" },
  { tier: "pro", name: "مميّز", price: "99", unit: "ريال / شهر", yearly: "أو 990 ريال سنوياً", tagline: "اظهر قبل غيرك" },
  { tier: "vip", name: "ذهبي", price: "249", unit: "ريال / شهر", yearly: "أو 2,490 ريال سنوياً", tagline: "كن أول ما يراه المعلن" },
];

const STEPS = ["اختر باقتك واضغط اشتراك عبر واتساب", "حوّل المبلغ وأرسل صورة التحويل", "نفعّل باقتك بعد التأكد من التحويل"];

export default async function PricingPage() {
  const s = await getSettings();
  const wa = normalizePhone(s.support_whatsapp).replace(/^\+/, "");
  const link = (plan: string) =>
    `https://wa.me/${wa}?text=${encodeURIComponent(`أرغب بالاشتراك في باقة ${plan}. سأرسل صورة التحويل هنا.`)}`;

  return (
    <div className="bg-gold-radial">
      <div className="container-max py-16">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="badge-gold mx-auto"><Crown className="h-3.5 w-3.5" /> باقات المؤثرين</span>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[1.3] gold-text sm:text-5xl">
            كل باقة تغيّر شكل ظهورك
          </h1>
          <p className="mt-4 text-sm leading-7 text-white/60">
            شوف الفرق بنفسك: هذا هو كارد ملفك أمام المعلنين في كل باقة.
          </p>
        </div>

        {/* منصة تتويج: الذهبي في المنتصف وأطول من الباقتين */}
        <div className="grid items-center gap-6 md:grid-cols-3">
          {PLANS.map((p) => {
            const vip = p.tier === "vip";
            const order = vip ? "order-first md:order-2" : p.tier === "free" ? "md:order-1" : "md:order-3";
            return (
              <div
                key={p.tier}
                className={`${order} relative flex flex-col rounded-2xl p-6 ${
                  vip ? "vip-card md:py-12" : p.tier === "pro" ? "silver-card" : "glass-card"
                }`}
              >
                {vip && (
                  <span className="absolute inset-x-0 -top-3 mx-auto flex w-fit items-center gap-1 rounded-full bg-gold-gradient px-3 py-1 text-[11px] font-bold text-black">
                    <Crown className="h-3 w-3" /> مقاعد محدودة
                  </span>
                )}

                <MiniCard tier={p.tier} />

                <h2 className={`mt-6 font-display text-2xl font-bold ${vip ? "gold-text" : p.tier === "pro" ? "silver-text" : "text-white"}`}>{p.name}</h2>
                <p className="mt-1 text-xs text-white/60">{p.tagline}</p>

                <p className="mt-4 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-bold text-white">{p.price}</span>
                  <span className="text-sm text-white/60">{p.unit}</span>
                </p>
                <p className="mt-1 h-4 text-xs text-gold-light">{p.yearly}</p>

                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {FEATURES.map((f) => {
                    const on = f[p.tier];
                    return (
                      <li key={f.label} className={`flex items-start gap-2 ${on ? "text-white/85" : "text-white/35"}`}>
                        {on ? (
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" aria-label="متضمّن" />
                        ) : (
                          <Minus className="mt-0.5 h-4 w-4 flex-shrink-0" aria-label="غير متضمّن" />
                        )}
                        {f.label}
                      </li>
                    );
                  })}
                </ul>

                {wa && p.tier !== "free" && (
                  <a
                    href={link(p.name)}
                    target="_blank"
                    rel="noreferrer"
                    className={`${vip ? "btn-gold" : "btn-outline"} mt-8 justify-center`}
                  >
                    اشترك في {p.name}
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {/* كيف تشترك: تسلسل حقيقي فالترقيم مقصود */}
        <ol className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-3">
          {STEPS.map((t, i) => (
            <li key={t} className="glass flex items-center gap-4 rounded-xl p-4">
              <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border border-gold/40 font-display text-gold">
                {i + 1}
              </span>
              <span className="text-sm leading-6 text-white/75">{t}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** معاينة مصغّرة لشكل الكارد في كل باقة (أشكال تجريدية، بلا أسماء أو أرقام وهمية). */
function MiniCard({ tier }: { tier: Tier }) {
  const vip = tier === "vip";
  return (
    <div
      aria-hidden
      className={`relative mx-auto flex w-full max-w-[200px] flex-col items-center rounded-xl px-4 pb-4 pt-6 ${
        vip ? "bg-gold/10 ring-1 ring-gold/50" : tier === "pro" ? "bg-silver/10 ring-1 ring-silver/50" : "bg-white/[0.03] ring-1 ring-white/10"
      }`}
    >
      {vip && <Crown className="absolute -top-3 h-6 w-6 text-gold-light drop-shadow-[0_0_8px_rgb(var(--c-gold)/0.8)]" />}
      <div className={`h-12 w-12 rounded-full ${vip ? "border-2 border-gold bg-gold/30" : tier === "pro" ? "border-2 border-silver bg-silver/20" : "border border-white/15 bg-white/10"}`} />
      <div className={`mt-3 h-2 w-20 rounded-full ${vip ? "bg-gold" : "bg-white/25"}`} />
      <div className="mt-2 h-1.5 w-28 rounded-full bg-white/10" />
      {tier === "pro" && <div className="mt-3 rounded-full bg-silver-gradient px-2 text-[9px] font-bold text-black">عضو مميز</div>}
      {vip && <div className="mt-3 rounded-full bg-gold-gradient px-2 text-[9px] font-bold text-black">عضو ذهبي</div>}
      <div className={`mt-3 h-5 w-full rounded-md ${vip ? "bg-gold-gradient" : "border border-white/10"}`} />
    </div>
  );
}
