"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, MousePointerClick, Megaphone, BadgeCheck, LogOut, Save, Loader2, Check, KeyRound, Lock, Users } from "lucide-react";
import { CITIES, CATEGORIES } from "@/lib/constants";
import { updateOwnProfile, logoutInfluencer, changePassword } from "@/lib/actions";
import { isSaudiPhone, SAUDI_PHONE_ERROR, normalizePhone } from "@/lib/validators";
import AvatarUploader from "@/components/AvatarUploader";
import { Whatsapp } from "@/components/Icons";
import type { Influencer } from "@/lib/types";

export default function AccountForm({ influencer, supportWhatsapp }: { influencer: Influencer; supportWhatsapp: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState(influencer.phone || "");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(influencer.avatar_url || "");
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const phoneValid = !phoneTouched || isSaudiPhone(phone);

  async function onChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword !== confirmPassword) {
      setPwMsg({ ok: false, text: "كلمتا المرور الجديدتان غير متطابقتين." });
      return;
    }
    setPwLoading(true);
    const fd = new FormData();
    fd.set("current_password", currentPassword);
    fd.set("new_password", newPassword);
    const res = await changePassword(fd);
    setPwMsg({ ok: !!res.ok, text: res.message || (res.ok ? "تم الحفظ" : "حدث خطأ") });
    setPwLoading(false);
    if (res.ok) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

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
          <BadgeCheck className="h-3.5 w-3.5" /> موثّق — شارة مضافة من الإدارة
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
            <div className="field flex cursor-not-allowed items-center justify-between gap-2 text-white/60 opacity-70">
              <span dir="ltr" className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-white/30" />
                {influencer.followers.toLocaleString("en")}
              </span>
              <Users className="h-4 w-4 text-white/25" />
            </div>
            <p className="mt-1.5 text-xs text-white/35">
              لا يمكنك تعديل هذا الرقم بنفسك — يتم تحديثه من قبل الإدارة فقط. لطلب تحديث،{" "}
              <a
                href={`https://wa.me/${normalizePhone(supportWhatsapp).replace(/^\+/, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-gold underline underline-offset-2 hover:text-gold-light"
              >
                <Whatsapp className="h-3.5 w-3.5" /> تواصل مع الإدارة
              </a>
              .
            </p>
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

        <Field label="رقم رخصة منصة موثوق (اختياري)">
          <input
            name="license_number"
            dir="ltr"
            placeholder="اتركه فارغاً إن لم يتوفر"
            defaultValue={influencer.license_number || ""}
            className="field"
          />
          <p className="mt-1.5 text-xs text-white/35">
            سرّي ولا يظهر لأحد غيرك وغير الإدارة. وجوده يفعّل شارة "موثوق" في ملفك العام.
          </p>
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

      {/* تغيير كلمة المرور — فورم منفصل عن تعديل الملف الشخصي، بيتطلب كلمة المرور الحالية كتأكيد */}
      <form onSubmit={onChangePassword} className="card space-y-5 p-6 sm:p-8">
        <div className="flex items-center gap-2 border-r-2 border-gold pr-3">
          <KeyRound className="h-5 w-5 text-gold" />
          <h2 className="font-display text-lg font-bold text-white">تغيير كلمة المرور</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="كلمة المرور الحالية">
            <div className="relative">
              <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="password"
                dir="ltr"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="field pr-10"
                placeholder="••••••••"
                required
              />
            </div>
          </Field>
          <Field label="كلمة المرور الجديدة">
            <div className="relative">
              <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="password"
                dir="ltr"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="field pr-10"
                placeholder="••••••••"
                required
              />
            </div>
          </Field>
          <Field label="تأكيد كلمة المرور الجديدة">
            <div className="relative">
              <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="password"
                dir="ltr"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="field pr-10"
                placeholder="••••••••"
                required
              />
            </div>
          </Field>
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={pwLoading} className="btn-gold disabled:opacity-60">
            {pwLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            تحديث كلمة المرور
          </button>
          {pwMsg && (
            <span className={`flex items-center gap-1 text-sm ${pwMsg.ok ? "text-green-400" : "text-red-400"}`}>
              {pwMsg.ok && <Check className="h-4 w-4" />} {pwMsg.text}
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
