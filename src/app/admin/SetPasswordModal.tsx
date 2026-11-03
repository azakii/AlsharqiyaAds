"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { adminSetInfluencerPassword } from "@/lib/actions";

export default function SetPasswordModal({ influencerId, name, onClose }: { influencerId: string; name: string; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await adminSetInfluencerPassword(influencerId, password);
    setMsg({ ok: !!res.ok, text: res.message || (res.ok ? "تم" : "خطأ") });
    setLoading(false);
    if (res.ok) setPassword("");
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-bg/90 p-4 backdrop-blur-xl" onClick={onClose}>
      <form onSubmit={onSubmit} className="glass-card w-full max-w-md space-y-4 rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">كلمة مرور {name}</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="glass flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-gold">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div>
          <label className="field-label">كلمة المرور الجديدة</label>
          <input
            type="text"
            dir="ltr"
            autoComplete="off"
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
            placeholder="6 أحرف على الأقل"
          />
          <p className="mt-1.5 text-xs text-white/40">ستظهر لك أثناء الكتابة لتبلّغها للمؤثر. لا يمكن عرضها لاحقاً.</p>
        </div>
        {msg && <p className={`text-sm ${msg.ok ? "text-green-400" : "text-red-400"}`}>{msg.text}</p>}
        <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-60">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} حفظ كلمة المرور
        </button>
      </form>
    </div>
  );
}
