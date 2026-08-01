"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, MousePointerClick, Megaphone, BadgeCheck, LogOut, Loader2, Lock, Clock, XCircle } from "lucide-react";
import { logoutInfluencer } from "@/lib/actions";
import { normalizePhone } from "@/lib/validators";
import { Whatsapp } from "@/components/Icons";
import type { Influencer } from "@/lib/types";

export default function AccountForm({ influencer, supportWhatsapp }: { influencer: Influencer; supportWhatsapp: string }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function onLogout() {
    setLoggingOut(true);
    await logoutInfluencer();
    router.push("/");
    router.refresh();
  }

  const whatsappHref = `https://wa.me/${normalizePhone(supportWhatsapp).replace(/^\+/, "")}`;

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
          <BadgeCheck className="h-3.5 w-3.5" /> ملتزم — شارة مضافة من الإدارة
        </span>
      )}

      {influencer.status === "pending" && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          <Clock className="h-4 w-4 shrink-0" /> طلبك قيد المراجعة من الإدارة حالياً.
        </div>
      )}
      {influencer.status === "rejected" && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <XCircle className="h-4 w-4 shrink-0" /> تم رفض طلبك من الإدارة. للاستفسار، تواصل مع الإدارة عبر واتساب.
        </div>
      )}

      {/* Read-only profile — لا يملك المؤثر صلاحية تعديل بياناته؛ أي تحديث يتم عبر الإدارة فقط */}
      <div className="card space-y-5 p-6 sm:p-8">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
          <Lock className="h-4 w-4 shrink-0 text-white/30" />
          بياناتك مقفلة ولا يمكن تعديلها من هنا. لتحديث أي معلومة،{" "}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-gold underline underline-offset-2 hover:text-gold-light"
          >
            <Whatsapp className="h-3.5 w-3.5" /> تواصل مع الإدارة
          </a>
          .
        </div>

        <div className="flex items-center gap-4">
          {influencer.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={influencer.avatar_url} alt={influencer.name} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full bg-white/5 text-white/30">
              {influencer.name.slice(0, 1)}
            </div>
          )}
          <div>
            <div className="font-display text-lg font-bold text-white">{influencer.name}</div>
            <div className="text-xs text-white/45">{influencer.category}</div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <ReadOnlyField label="رقم الجوال" value={influencer.phone} dir="ltr" />
          <ReadOnlyField label="البريد الإلكتروني" value={influencer.email} dir="ltr" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <ReadOnlyField label="المدينة" value={influencer.city} />
          <ReadOnlyField label="عدد المتابعين (تقريبي)" value={influencer.followers.toLocaleString("en")} dir="ltr" />
        </div>

        <ReadOnlyField label="نبذة عنك" value={influencer.bio} multiline />

        {influencer.license_number && (
          <ReadOnlyField label="رقم رخصة منصة موثوق" value={influencer.license_number} dir="ltr" />
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {influencer.socials.instagram && <ReadOnlyField label="Instagram" value={influencer.socials.instagram} dir="ltr" />}
          {influencer.socials.tiktok && <ReadOnlyField label="TikTok" value={influencer.socials.tiktok} dir="ltr" />}
          {influencer.socials.x && <ReadOnlyField label="X (تويتر)" value={influencer.socials.x} dir="ltr" />}
          {influencer.socials.whatsapp && <ReadOnlyField label="WhatsApp" value={influencer.socials.whatsapp} dir="ltr" />}
          {influencer.socials.snapchat && <ReadOnlyField label="Snapchat" value={influencer.socials.snapchat} dir="ltr" />}
        </div>
      </div>
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

function ReadOnlyField({
  label,
  value,
  dir,
  multiline,
}: {
  label: string;
  value: string;
  dir?: "ltr" | "rtl";
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div
        dir={dir}
        className={`field flex cursor-not-allowed items-center text-white/60 opacity-70 ${multiline ? "min-h-[6rem] whitespace-pre-wrap py-3" : ""}`}
      >
        {value || "—"}
      </div>
    </div>
  );
}
