"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { banInfluencer } from "@/lib/actions";

export default function BanModal({ influencerId, name, onClose, onDone }: { influencerId: string; name: string; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await banInfluencer(influencerId, reason);
    setLoading(false);
    if (res.ok) onDone();
    else setError(res.message || "تعذّر الحظر.");
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-bg/90 p-4 backdrop-blur-xl" onClick={onClose}>
      <form onSubmit={onSubmit} className="glass-card w-full max-w-md space-y-4 rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">حظر {name}</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="glass flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-gold">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div>
          <label className="field-label">سبب الحظر</label>
          <textarea
            required
            minLength={3}
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="field"
            placeholder="اكتب السبب بوضوح"
          />
          <p className="mt-1.5 text-xs text-white/40">
            سيختفي من الموقع فوراً، ويظهر له هذا السبب في حسابه. تتوقف باقته أثناء الحظر وتتمدد بمدته عند رفعه.
          </p>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-full bg-red-500/90 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60">
          {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "تأكيد الحظر"}
        </button>
      </form>
    </div>
  );
}
