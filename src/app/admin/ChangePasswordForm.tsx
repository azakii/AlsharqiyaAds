"use client";

import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { changeAdminPassword } from "@/lib/actions";

export default function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const next = String(fd.get("next"));
    if (next !== String(fd.get("confirm"))) return setMsg({ ok: false, text: "تأكيد كلمة المرور غير مطابق." });
    setLoading(true);
    setMsg(null);
    const res = await changeAdminPassword(String(fd.get("current")), next);
    setMsg({ ok: !!res.ok, text: res.message || (res.ok ? "تم" : "خطأ") });
    setLoading(false);
    if (res.ok) form.reset();
  }

  return (
    <form onSubmit={onSubmit} className="card mt-8 max-w-lg space-y-4 p-6">
      <h3 className="flex items-center gap-2 font-display text-lg text-gold">
        <KeyRound className="h-5 w-5" /> تغيير كلمة مرور الأدمن
      </h3>
      <div>
        <label className="field-label">كلمة المرور الحالية</label>
        <input name="current" type="password" dir="ltr" autoComplete="current-password" className="field" required />
      </div>
      <div>
        <label className="field-label">كلمة المرور الجديدة</label>
        <input name="next" type="password" dir="ltr" autoComplete="new-password" minLength={8} className="field" placeholder="8 أحرف على الأقل" required />
      </div>
      <div>
        <label className="field-label">تأكيد كلمة المرور الجديدة</label>
        <input name="confirm" type="password" dir="ltr" autoComplete="new-password" minLength={8} className="field" required />
      </div>
      {msg && <p className={`text-sm ${msg.ok ? "text-green-400" : "text-red-400"}`}>{msg.text}</p>}
      <button type="submit" disabled={loading} className="btn-gold disabled:opacity-60">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />} حفظ كلمة المرور
      </button>
    </form>
  );
}
