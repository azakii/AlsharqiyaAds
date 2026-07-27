"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { loginInfluencer } from "@/lib/actions";

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await loginInfluencer(new FormData(e.currentTarget));
    if (res.ok) {
      router.push("/account");
      router.refresh();
    } else {
      setError(res.message || "تعذر تسجيل الدخول");
      setLoading(false);
    }
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
      <div>
        <div className="flex items-center justify-between">
          <label className="field-label">كلمة المرور</label>
          <a href="/forgot-password" className="mb-2 text-xs text-gold hover:underline">نسيت كلمة المرور؟</a>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input name="password" type="password" dir="ltr" className="field pr-10" placeholder="••••••••" required />
        </div>
      </div>

      {error && <p className="text-center text-sm text-red-400">{error}</p>}

      <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-60">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}
        دخول
      </button>

      <p className="text-center text-xs text-white/40">
        ليس لديك حساب؟{" "}
        <a href="/register" className="text-gold hover:underline">سجّل كمؤثر الآن</a>
      </p>
    </form>
  );
}
