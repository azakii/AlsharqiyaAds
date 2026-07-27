"use client";

import { useState } from "react";
import { Mail, Send, Loader2, Check, ArrowLeft } from "lucide-react";
import { requestPasswordReset } from "@/lib/actions";

export default function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const res = await requestPasswordReset(new FormData(e.currentTarget));
    setLoading(false);
    if (res.ok) {
      setSent(true);
      setMsg(res.message || "");
    } else {
      setMsg(res.message || "حدث خطأ، حاول مرة أخرى.");
    }
  }

  if (sent) {
    return (
      <div className="card mt-8 w-full max-w-md space-y-4 p-8 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-green-500/15 text-green-400">
          <Check className="h-5 w-5" />
        </span>
        <p className="text-sm text-white/70">{msg}</p>
        <a href="/login" className="inline-flex items-center gap-1.5 text-sm text-gold hover:underline">
          <ArrowLeft className="h-4 w-4" /> رجوع لتسجيل الدخول
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card mt-8 w-full max-w-md space-y-5 p-8">
      <div>
        <label className="field-label">البريد الإلكتروني</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input name="email" type="email" dir="ltr" className="field pr-10" placeholder="email@example.com" required />
        </div>
      </div>

      {msg && <p className="text-center text-sm text-red-400">{msg}</p>}

      <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-60">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        إرسال رابط إعادة التعيين
      </button>

      <p className="text-center text-xs text-white/40">
        تذكرت كلمة المرور؟{" "}
        <a href="/login" className="text-gold hover:underline">تسجيل الدخول</a>
      </p>
    </form>
  );
}
