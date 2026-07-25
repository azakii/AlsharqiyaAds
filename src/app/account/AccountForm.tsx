"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, MousePointerClick, Megaphone, BadgeCheck, LogOut, Save, Loader2, Check } from "lucide-react";
import { CITIES, CATEGORIES } from "@/lib/constants";
import { updateOwnProfile, logoutInfluencer } from "@/lib/actions";
import { isSaudiPhone, SAUDI_PHONE_ERROR } from "@/lib/validators";
import AvatarUploader from "@/components/AvatarUploader";
import type { Influencer } from "@/lib/types";

export default function AccountForm({ influencer }: { influencer: Influencer }) {
  const router = useRouter();
  const [phone, setPhone] = useState(influencer.phone || "");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(influencer.avatar_url || "");
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const phoneValid = !phoneTouched || isSaudiPhone(phone);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPhoneTouched(true);
    if (!isSaudiPhone(phone)) return;
    setLoading(true);
    setMsg(null);

    const fd = new FormData(e.currentTarget);
    fd.set("avatar_url", avatarUrl);
    const res = await updateOwnProfile(fd);
    setMsg({ ok: !!res.ok, text: res.message || (res.ok ? "تم الحفظ" : "حدث خطأ") });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  async function onLogout() {
    setLoggingOut(true);
    await logoutInfluencer();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Stats + logout */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid flex-1 gap-4 sm:grid-cols-3">
          <StatCard icon={<Eye />} value={influencer.views} label="المشاهدات" />
          <StatCard icon={<MousePointerClick />} value={influencer.clicks} label="النقرات" />
          <StatCard icon={<Megaphone />} value={influencer.ad_requests} label="طلبات الإعلان" />
        </div>
        <button
          onClick={onLogout}
          disabled={loggingOut}
          className="btn-outline shrink-0 disabled:opacity-60"
        >
          {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          تسجيل الخروج
        </button>
      </div>

      {influencer.verified && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-gold">
          <BadgeCheck className="h-3.5 w-3.5" /> المنصة توصي به — شارة مضافة من الإدارة
        </span>
      )}

      {/* Edit form */}
      <form onSubmit={onSubmit} className="card space-y-5 p-6 sm:p-8">
        <AvatarUploader value={avatarUrl} onChange={setAvatarUrl} />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="الاسم الكامل">
            <input name="name" defaultValue={influencer.name} className="field" />
          </Field>
          <Field label="رقم الجوال">
            <input
              name="phone"
              dir="ltr"
              placeholder="05xxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => setPhoneTouched(true)}
              className={`field ${!phoneValid ? "border-red-500/60" : ""}`}
            />
            {!phoneValid && <p className="mt-1.5 text-xs text-red-400">{SAUDI_PHONE_ERROR}</p>}
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="البريد الإلكتروني">
            <input name="email" type="email" dir="ltr" defaultValue={influencer.email} className="field" />
          </Field>
          <Field label="عدد المتابعين (تقريبي)">
            <input name="followers" type="number" dir="ltr" defaultValue={influencer.followers} className="field" />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="المدينة">
            <select name="city" defaultValue={influencer.city} className="field">
              <option value="">اختر...</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="التصنيف">
            <select name="category" defaultValue={influencer.category} className="field">
              <option value="">اختر...</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        <Field label="نبذة عنك">
          <textarea name="bio" rows={4} defaultValue={influencer.bio} className="field resize-none" />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Instagram">
            <input name="instagram" dir="ltr" defaultValue={influencer.socials.instagram} className="field" />
          </Field>
          <Field label="TikTok">
            <input name="tiktok" dir="ltr" defaultValue={influencer.socials.tiktok} className="field" />
          </Field>
          <Field label="X (تويتر)">
            <input name="x" dir="ltr" defaultValue={influencer.socials.x} className="field" />
          </Field>
          <Field label="WhatsApp">
            <input name="whatsapp" dir="ltr" defaultValue={influencer.socials.whatsapp} className="field" />
          </Field>
          <Field label="Snapchat">
            <input name="snapchat" dir="ltr" defaultValue={influencer.socials.snapchat} className="field" />
          </Field>
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={loading} className="btn-gold disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ التعديلات
          </button>
          {msg && (
            <span className={`flex items-center gap-1 text-sm ${msg.ok ? "text-green-400" : "text-red-400"}`}>
              {msg.ok && <Check className="h-4 w-4" />} {msg.text}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="card flex items-center gap-3 p-5">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-gold/10 text-gold">{icon}</span>
      <div className="text-right">
        <div className="font-display text-2xl font-bold text-white">{value.toLocaleString("en")}</div>
        <div className="text-xs text-white/45">{label}</div>
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
