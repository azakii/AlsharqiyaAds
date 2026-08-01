"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, ChevronDown, Wand2 } from "lucide-react";
import { CITIES, CATEGORIES } from "@/lib/constants";
import { adminCreateInfluencer, adminUpdateInfluencer, upsertSeoPage } from "@/lib/actions";
import { isSaudiPhone, SAUDI_PHONE_ERROR } from "@/lib/validators";
import { slugify, type SeoPage } from "@/lib/seo-shared";
import AvatarUploader from "@/components/AvatarUploader";
import SeoFieldsEditor from "./SeoFieldsEditor";
import type { Influencer } from "@/lib/types";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "approved", label: "مقبول" },
  { value: "pending", label: "قيد المراجعة" },
  { value: "rejected", label: "مرفوض" },
];

/** هل الفورم فيه أي حقل سيو اتملى فعلاً؟ لو لأ، منحفظش صف seo_pages فاضي بلا داعي. */
function hasSeoContent(fd: FormData): boolean {
  const textFields = [
    "meta_title", "meta_description", "meta_keywords", "canonical_url",
    "og_title", "og_description", "og_image",
    "twitter_title", "twitter_description", "twitter_image",
  ];
  if (textFields.some((f) => String(fd.get(f) || "").trim())) return true;
  const blocks = String(fd.get("structured_data_json") || "[]");
  return blocks !== "[]" && blocks !== "";
}

export default function AddInfluencerModal({
  influencer,
  seo,
  onClose,
}: {
  influencer?: Influencer;
  seo?: SeoPage | null;
  onClose: () => void;
}) {
  const isEdit = Boolean(influencer);
  const router = useRouter();
  const [name, setName] = useState(influencer?.name || "");
  const [phone, setPhone] = useState(influencer?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(influencer?.avatar_url || "");
  const [slug, setSlug] = useState(influencer?.slug || "");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [showSeo, setShowSeo] = useState(Boolean(seo));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const phoneValid = !phoneTouched || isSaudiPhone(phone);
  const nameValid = !nameTouched || name.trim() !== "";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNameTouched(true);
    setPhoneTouched(true);
    setError("");

    // نتحقق هنا (مش بتعطيل الزر) عشان الزر يفضل قابل للضغط دايماً ويوضح سبب الرفض
    // بدل ما يفضل معطّل بصمت — ده كان السبب في إن زر الحفظ "مايفعلش" مع مؤثرين
    // مسجّلين من غير رقم جوال (زي بيانات البذر الأولية في schema.sql).
    if (!name.trim()) {
      setError("الاسم مطلوب.");
      return;
    }
    if (!isSaudiPhone(phone)) {
      setError(SAUDI_PHONE_ERROR);
      return;
    }

    setLoading(true);

    const fd = new FormData(e.currentTarget);
    fd.set("avatar_url", avatarUrl);
    fd.set("slug", slug);

    let id = influencer?.id;
    if (isEdit) {
      const res = await adminUpdateInfluencer(influencer!.id, fd);
      if (!res.ok) {
        setLoading(false);
        setError(res.message || "حدث خطأ");
        return;
      }
    } else {
      const res = await adminCreateInfluencer(fd);
      if (!res.ok) {
        setLoading(false);
        setError(res.message || "حدث خطأ");
        return;
      }
      id = "id" in res ? res.id : undefined;
    }

    // حفظ إعدادات السيو الخاصة بهذا المؤثر (لو الأدمن عدّل فيها فعلاً) — بمسار ثابت مبني على
    // الـ id (مش الـ slug) عشان الربط ما ينكسرش لو غيّر الأدمن الـ slug لاحقاً.
    if (id && showSeo && hasSeoContent(fd)) {
      fd.set("path", `/influencer/${id}`);
      fd.set("label", name);
      if (seo?.id) fd.set("id", seo.id);
      else fd.delete("id");
      const seoRes = await upsertSeoPage(fd);
      if (!seoRes.ok) {
        setLoading(false);
        setError(`تم حفظ بيانات المؤثر، لكن تعذر حفظ إعدادات السيو: ${seoRes.message}`);
        router.refresh();
        return;
      }
    }

    setLoading(false);
    router.refresh();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-bg/90 p-4 backdrop-blur-xl"
      onClick={onClose}
    >
      <div
        className="glass-card max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{isEdit ? "تعديل الملف الشخصي" : "إضافة مؤثر جديد"}</h2>
          <button
            type="button"
            onClick={onClose}
            className="glass flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-gold"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <AvatarUploader value={avatarUrl} onChange={setAvatarUrl} />

          <Row>
            <Field label="الاسم">
              <input
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setNameTouched(true)}
                className={`modal-field ${!nameValid ? "border-red-500/60" : ""}`}
              />
              {!nameValid && <p className="mt-1 text-[11px] text-red-400">الاسم مطلوب.</p>}
            </Field>
            <Field label="الجوال">
              <input
                name="phone"
                dir="ltr"
                placeholder="05xxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => setPhoneTouched(true)}
                className={`modal-field ${!phoneValid ? "border-red-500/60" : ""}`}
              />
              {!phoneValid && <p className="mt-1 text-[11px] text-red-400">{SAUDI_PHONE_ERROR}</p>}
            </Field>
          </Row>

          <Row>
            <Field label="البريد">
              <input name="email" dir="ltr" defaultValue={influencer?.email} className="modal-field" />
            </Field>
            <Field label="المتابعون">
              <input name="followers" type="number" dir="ltr" defaultValue={influencer?.followers} className="modal-field" />
            </Field>
          </Row>

          <Row>
            <Field label="المدينة">
              <select name="city" defaultValue={influencer?.city || ""} className="modal-field">
                <option value="">اختر...</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="التصنيف">
              <select name="category" defaultValue={influencer?.category || ""} className="modal-field">
                <option value="">اختر...</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </Row>

          <Field label="نبذة">
            <textarea name="bio" rows={3} defaultValue={influencer?.bio} className="modal-field resize-none" />
          </Field>

          <Field label="الرابط الصديق (Slug) — يظهر في /influencer/<slug>">
            <div className="flex items-center gap-2">
              <input
                name="slug"
                dir="ltr"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="اتركه فارغاً لاستخدام رابط عشوائي"
                className="modal-field flex-1"
              />
              <button
                type="button"
                onClick={() => setSlug(slugify(name))}
                disabled={!name.trim()}
                className="glass flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-muted hover:text-gold disabled:opacity-40"
                title="توليد من الاسم"
                aria-label="توليد الرابط من الاسم"
              >
                <Wand2 className="h-4 w-4" />
              </button>
            </div>
          </Field>

          <Field label="رقم رخصة منصة موثوق (خاص — لا يظهر إلا هنا)">
            <input
              name="license_number"
              dir="ltr"
              placeholder="اتركه فارغاً إن لم يوجد"
              defaultValue={influencer?.license_number || ""}
              className="modal-field"
            />
          </Field>

          <Row>
            <Field label="Instagram">
              <input name="instagram" dir="ltr" defaultValue={influencer?.socials.instagram} className="modal-field" />
            </Field>
            <Field label="Snapchat">
              <input name="snapchat" dir="ltr" defaultValue={influencer?.socials.snapchat} className="modal-field" />
            </Field>
          </Row>

          <Row>
            <Field label="TikTok">
              <input name="tiktok" dir="ltr" defaultValue={influencer?.socials.tiktok} className="modal-field" />
            </Field>
            <Field label="X">
              <input name="x" dir="ltr" defaultValue={influencer?.socials.x} className="modal-field" />
            </Field>
          </Row>

          <Row>
            <Field label="WhatsApp">
              <input name="whatsapp" dir="ltr" defaultValue={influencer?.socials.whatsapp} className="modal-field" />
            </Field>
            <Field label="الحالة">
              <select name="status" defaultValue={influencer?.status || "approved"} className="modal-field">
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
          </Row>

          <label className="glass flex cursor-pointer items-center justify-between rounded-xl px-4 py-3">
            <span className="text-sm text-white/80">ملتزم (تفعيل الشارة الذهبية)</span>
            <input
              type="checkbox"
              name="verified"
              defaultChecked={influencer?.verified ?? true}
              className="h-5 w-5 accent-[rgb(212,160,23)]"
            />
          </label>

          <div>
            <button
              type="button"
              onClick={() => setShowSeo((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-line px-4 py-3 text-sm text-white/80 hover:text-gold"
            >
              إعدادات السيو الخاصة بهذا المؤثر (اختياري)
              <ChevronDown className={`h-4 w-4 transition-transform ${showSeo ? "rotate-180" : ""}`} />
            </button>
            {showSeo && (
              <div className="mt-4">
                <SeoFieldsEditor initial={seo} ogImageFolder="seo" />
              </div>
            )}
          </div>

          {error && <p className="text-center text-sm text-red-400">{error}</p>}

          <div className="mt-6 flex items-center gap-3">
            <button type="button" onClick={onClose} className="glass flex-1 rounded-xl py-3 text-sm text-white/80 hover:text-gold">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-gold py-3 text-sm font-semibold text-bg transition-opacity disabled:opacity-50"
            >
              {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "حفظ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted">{label}</label>
      {children}
    </div>
  );
}
