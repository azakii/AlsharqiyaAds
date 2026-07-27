"use client";

import { useEffect, useState } from "react";
import { Lock, Loader2, Check, AlertTriangle, ArrowLeft } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

type Status = "checking" | "ready" | "invalid" | "saving" | "success";

export default function ResetPasswordForm() {
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Supabase بيوصل بطريقتين حسب إعدادات المشروع: كود PKCE في ?code=... أو توكن مباشر في
  // الـ hash (#access_token=...&type=recovery). الأولى محتاجة exchangeCodeForSession صراحةً،
  // والتانية supabase-js بيعالجها لوحده عند إنشاء العميل (detectSessionInUrl الافتراضي).
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setStatus("invalid");
      return;
    }

    let active = true;

    async function init() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        const { error } = await supabase!.auth.exchangeCodeForSession(code);
        if (!active) return;
        if (error) {
          setStatus("invalid");
          return;
        }
      }
      const { data } = await supabase!.auth.getSession();
      if (!active) return;
      setStatus(data.session ? "ready" : "invalid");
    }

    init();
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("كلمة المرور يجب ألا تقل عن 6 أحرف.");
      return;
    }
    if (password !== confirm) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }
    setStatus("saving");
    const supabase = getSupabase();
    const { error: updateError } = await supabase!.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message || "تعذر تحديث كلمة المرور.");
      setStatus("ready");
      return;
    }
    await supabase!.auth.signOut();
    setStatus("success");
  }

  if (status === "checking") {
    return (
      <div className="card mt-8 flex w-full max-w-md items-center justify-center gap-2 p-8 text-sm text-white/60">
        <Loader2 className="h-4 w-4 animate-spin" /> جارِ التحقق من الرابط...
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="card mt-8 w-full max-w-md space-y-4 p-8 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-500/15 text-red-400">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <p className="text-sm text-white/70">الرابط غير صالح أو منتهي الصلاحية.</p>
        <a href="/forgot-password" className="inline-flex items-center gap-1.5 text-sm text-gold hover:underline">
          <ArrowLeft className="h-4 w-4" /> اطلب رابط جديد
        </a>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="card mt-8 w-full max-w-md space-y-4 p-8 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-green-500/15 text-green-400">
          <Check className="h-5 w-5" />
        </span>
        <p className="text-sm text-white/70">تم تغيير كلمة المرور بنجاح.</p>
        <a href="/login" className="inline-flex items-center gap-1.5 text-sm text-gold hover:underline">
          <ArrowLeft className="h-4 w-4" /> تسجيل الدخول
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card mt-8 w-full max-w-md space-y-5 p-8">
      <div>
        <label className="field-label">كلمة المرور الجديدة</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="password"
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field pr-10"
            placeholder="••••••••"
            required
          />
        </div>
      </div>
      <div>
        <label className="field-label">تأكيد كلمة المرور</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="password"
            dir="ltr"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="field pr-10"
            placeholder="••••••••"
            required
          />
        </div>
      </div>

      {error && <p className="text-center text-sm text-red-400">{error}</p>}

      <button type="submit" disabled={status === "saving"} className="btn-gold w-full disabled:opacity-60">
        {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        حفظ كلمة المرور الجديدة
      </button>
    </form>
  );
}
