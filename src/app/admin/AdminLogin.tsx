"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { Crown } from "@/components/Icons";
import { login } from "@/lib/actions";

export default function AdminLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await login(new FormData(e.currentTarget));
    if (res.ok) {
      router.refresh();
    } else {
      setError(res.message || "خطأ في تسجيل الدخول");
      setLoading(false);
    }
  }

  return (
    <div className="bg-gold-radial">
      <div className="container-max flex min-h-[80vh] flex-col items-center justify-center py-16">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-gold-gradient text-black shadow-gold">
          <Crown className="h-7 w-7" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold gold-text">لوحة تحكم الإدارة</h1>
        <p className="mt-2 text-sm text-white/50">تسجيل الدخول مطلوب للمتابعة</p>

        <form onSubmit={onSubmit} className="card mt-8 w-full max-w-md space-y-5 p-8">
          <div>
            <label className="field-label">اسم المستخدم</label>
            <div className="relative">
              <User className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input name="username" className="field pr-10" placeholder="أدخل اسم المستخدم" required />
            </div>
          </div>
          <div>
            <label className="field-label">كلمة المرور</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input name="password" type="password" className="field pr-10" placeholder="••••••••" required />
            </div>
          </div>

          {error && <p className="text-center text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}
            دخول
          </button>

          <p className="text-center text-xs text-white/30">
            بيانات الدخول الافتراضية: admin / Sharqiah@2026
          </p>
        </form>
      </div>
    </div>
  );
}
