"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import Stepper from "@/components/Stepper";
import { CITIES, CATEGORIES } from "@/lib/constants";
import { submitInfluencer } from "@/lib/actions";

const STEPS = ["البيانات الأساسية", "التفاصيل والمحتوى", "الصور والفيديو", "روابط التواصل"];

const empty = {
  name: "", phone: "", email: "", city: "",
  category: "", bio: "", followers: "",
  avatar_url: "",
  instagram: "", tiktok: "", x: "", whatsapp: "", snapchat: "",
};

export default function RegisterForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const set = (k: keyof typeof empty, v: string) => setData((d) => ({ ...d, [k]: v }));

  async function handleSubmit() {
    setLoading(true);
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => fd.append(k, v));
    const res = await submitInfluencer(fd);
    setResult(res as any);
    setLoading(false);
  }

  if (result) {
    return (
      <div className="card mx-auto max-w-lg p-10 text-center">
        <div className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${result.ok ? "bg-gold-gradient text-black" : "bg-red-500/20 text-red-400"}`}>
          <Check className="h-7 w-7" />
        </div>
        <h3 className="mt-5 font-display text-2xl gold-text">
          {result.ok ? "تم بنجاح" : "حدث خطأ"}
        </h3>
        <p className="mt-3 text-sm text-white/60">{result.message}</p>
        <a href="/" className="btn-outline mt-6">العودة للرئيسية</a>
      </div>
    );
  }

  const canNext =
    step === 0 ? data.name && data.phone && data.city :
    step === 1 ? data.category && data.bio :
    true;

  return (
    <div className="card mx-auto max-w-2xl p-8">
      <Stepper steps={STEPS} current={step} />

      {step === 0 && (
        <div className="space-y-5">
          <Field label="الاسم الكامل">
            <input className="field" placeholder="الاسم كما تريد أن يظهر" value={data.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="رقم الجوال">
            <input className="field" placeholder="05xxxxxxxx" value={data.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="البريد الإلكتروني">
            <input className="field" placeholder="email@example.com" value={data.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="المدينة">
            <select className="field" value={data.city} onChange={(e) => set("city", e.target.value)}>
              <option value="">اختر...</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <Field label="التصنيف">
            <select className="field" value={data.category} onChange={(e) => set("category", e.target.value)}>
              <option value="">اختر...</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="نبذة عنك">
            <textarea rows={4} className="field resize-none" placeholder="اكتب نبذة مختصرة عن المحتوى الذي تقدّمه" value={data.bio} onChange={(e) => set("bio", e.target.value)} />
          </Field>
          <Field label="عدد المتابعين (تقريبي)">
            <input type="number" className="field" placeholder="مثال: 50000" value={data.followers} onChange={(e) => set("followers", e.target.value)} />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <Field label="رابط الصورة الشخصية">
            <input className="field" placeholder="https://..." value={data.avatar_url} onChange={(e) => set("avatar_url", e.target.value)} />
          </Field>
          {data.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.avatar_url} alt="معاينة" className="mx-auto h-28 w-28 rounded-full border border-line object-cover" />
          )}
          <p className="text-xs text-white/40">
            يمكنك لاحقاً رفع الصور مباشرة بعد ربط التخزين. حالياً استخدم رابط صورة مباشر.
          </p>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Field label="Instagram"><input className="field" placeholder="https://instagram.com/..." value={data.instagram} onChange={(e) => set("instagram", e.target.value)} /></Field>
          <Field label="TikTok"><input className="field" placeholder="https://tiktok.com/@..." value={data.tiktok} onChange={(e) => set("tiktok", e.target.value)} /></Field>
          <Field label="X (تويتر)"><input className="field" placeholder="https://x.com/..." value={data.x} onChange={(e) => set("x", e.target.value)} /></Field>
          <Field label="WhatsApp"><input className="field" placeholder="https://wa.me/9665..." value={data.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></Field>
          <Field label="Snapchat"><input className="field" placeholder="https://snapchat.com/add/..." value={data.snapchat} onChange={(e) => set("snapchat", e.target.value)} /></Field>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        {step > 0 ? (
          <button onClick={() => setStep((s) => s - 1)} className="btn-outline">
            <ArrowRight className="h-4 w-4" /> السابق
          </button>
        ) : <span />}

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => canNext && setStep((s) => s + 1)}
            disabled={!canNext}
            className="btn-gold disabled:opacity-40"
          >
            التالي <ArrowLeft className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading} className="btn-gold disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            إرسال الطلب
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}
