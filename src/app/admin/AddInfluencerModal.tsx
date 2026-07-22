"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { CITIES, CATEGORIES } from "@/lib/constants";
import { adminCreateInfluencer } from "@/lib/actions";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "approved", label: "مقبول" },
  { value: "pending", label: "قيد المراجعة" },
  { value: "rejected", label: "مرفوض" },
];

export default function AddInfluencerModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSave = name.trim() !== "" && phone.trim() !== "" && !loading;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSave) return;
    setLoading(true);
    setError("");
    const res = await adminCreateInfluencer(new FormData(e.currentTarget));
    setLoading(false);
    if (res.ok) {
      router.refresh();
      onClose();
    } else {
      setError(res.message || "حدث خطأ");
    }
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
          <h2 className="text-xl font-bold text-white">إضافة مؤثر جديد</h2>
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
          <Row>
            <Field label="الاسم">
              <input name="name" value={name} onChange={(e) => setName(e.target.value)} className="modal-field" />
            </Field>
            <Field label="الجوال">
              <input name="phone" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} className="modal-field" />
            </Field>
          </Row>

          <Row>
            <Field label="البريد">
              <input name="email" dir="ltr" className="modal-field" />
            </Field>
            <Field label="المتابعون">
              <input name="followers" type="number" dir="ltr" className="modal-field" />
            </Field>
          </Row>

          <Row>
            <Field label="المدينة">
              <select name="city" className="modal-field">
                <option value="">اختر...</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="التصنيف">
              <select name="category" className="modal-field">
                <option value="">اختر...</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </Row>

          <Field label="نبذة">
            <textarea name="bio" rows={3} className="modal-field resize-none" />
          </Field>

          <Field label="رابط الصورة الشخصية">
            <input name="avatar_url" dir="ltr" className="modal-field" />
          </Field>

          <Row>
            <Field label="Instagram">
              <input name="instagram" dir="ltr" className="modal-field" />
            </Field>
            <Field label="Snapchat">
              <input name="snapchat" dir="ltr" className="modal-field" />
            </Field>
          </Row>

          <Row>
            <Field label="TikTok">
              <input name="tiktok" dir="ltr" className="modal-field" />
            </Field>
            <Field label="X">
              <input name="x" dir="ltr" className="modal-field" />
            </Field>
          </Row>

          <Row>
            <Field label="WhatsApp">
              <input name="whatsapp" dir="ltr" className="modal-field" />
            </Field>
            <Field label="الحالة">
              <select name="status" defaultValue="approved" className="modal-field">
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
          </Row>

          {error && <p className="text-center text-sm text-red-400">{error}</p>}

          <div className="mt-6 flex items-center gap-3">
            <button type="button" onClick={onClose} className="glass flex-1 rounded-xl py-3 text-sm text-white/80 hover:text-gold">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!canSave}
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
