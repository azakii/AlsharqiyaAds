"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import Stepper from "@/components/Stepper";
import { CITIES, CATEGORIES } from "@/lib/constants";
import { submitAdRequest } from "@/lib/actions";
import type { Influencer } from "@/lib/types";

const STEPS = ["بيانات الشركة", "تفاصيل الإعلان", "الميزانية والمؤثر"];

const empty = {
  company_name: "", contact_name: "", phone: "", email: "",
  category: "", city: "", details: "",
  budget: "", target_influencer: "",
};

export default function AdRequestForm({ influencers }: { influencers: Influencer[] }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const set = (k: keyof typeof empty, v: string) => setData((d) => ({ ...d, [k]: v }));

  async function handleSubmit() {
    setLoading(true);
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => fd.append(k, v));
    const res = await submitAdRequest(fd);
    setResult(res as any);
    setLoading(false);
  }

  if (result) {
    return (
      <div className="card mx-auto max-w-lg p-10 text-center">
        <div className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${result.ok ? "bg-gold-gradient text-black" : "bg-red-500/20 text-red-400"}`}>
          <Check className="h-7 w-7" />
        </div>
        <h3 className="mt-5 font-display text-2xl gold-text">{result.ok ? "تم إرسال طلبك" : "حدث خطأ"}</h3>
        <p className="mt-3 text-sm text-white/60">{result.message}</p>
        <a href="/" className="btn-outline mt-6">العودة للرئيسية</a>
      </div>
    );
  }

  const canNext =
    step === 0 ? data.company_name && data.contact_name && data.phone :
    step === 1 ? data.category && data.details :
    true;

  return (
    <div className="card mx-auto max-w-2xl p-8">
      <Stepper steps={STEPS} current={step} />

      {step === 0 && (
        <div className="space-y-5">
          <Field label="اسم الشركة">
            <input className="field" placeholder="مثال: شركة النخبة للتجارة" value={data.company_name} onChange={(e) => set("company_name", e.target.value)} />
          </Field>
          <Field label="اسم المسؤول">
            <input className="field" placeholder="الاسم الكامل" value={data.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
          </Field>
          <Field label="رقم الجوال">
            <input className="field" placeholder="05xxxxxxxx" value={data.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="البريد الإلكتروني">
            <input className="field" placeholder="email@example.com" value={data.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <Field label="تصنيف النشاط">
            <select className="field" value={data.category} onChange={(e) => set("category", e.target.value)}>
              <option value="">اختر...</option>
              {[...CATEGORIES, "عقارات", "مطاعم", "تجارة"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="المدينة">
            <select className="field" value={data.city} onChange={(e) => set("city", e.target.value)}>
              <option value="">اختر...</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="تفاصيل الإعلان">
            <textarea rows={4} className="field resize-none" placeholder="صف الحملة الإعلانية والهدف منها" value={data.details} onChange={(e) => set("details", e.target.value)} />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <Field label="الميزانية التقديرية (ر.س)">
            <input type="number" className="field" placeholder="مثال: 10000" value={data.budget} onChange={(e) => set("budget", e.target.value)} />
          </Field>
          <Field label="المؤثر المستهدف">
            <select className="field" value={data.target_influencer} onChange={(e) => set("target_influencer", e.target.value)}>
              <option value="">أي مؤثر مناسب</option>
              {influencers.map((i) => <option key={i.id} value={i.name}>{i.name} — {i.city}</option>)}
            </select>
          </Field>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        {step > 0 ? (
          <button onClick={() => setStep((s) => s - 1)} className="btn-outline">
            <ArrowRight className="h-4 w-4" /> السابق
          </button>
        ) : <span />}

        {step < STEPS.length - 1 ? (
          <button onClick={() => canNext && setStep((s) => s + 1)} disabled={!canNext} className="btn-gold disabled:opacity-40">
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
