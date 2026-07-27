"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Megaphone, Clock, CheckCircle2, Check, X, Trash2, LogOut, Search, Plus, Settings, Pencil, BadgeCheck, AlertTriangle, MoreVertical,
} from "lucide-react";
import { formatFollowers } from "@/lib/constants";
import {
  setInfluencerStatus, deleteInfluencer, setAdRequestStatus, deleteAdRequest, logout,
} from "@/lib/actions";
import SettingsForm from "./SettingsForm";
import AddInfluencerModal from "./AddInfluencerModal";
import type { Influencer, AdRequest } from "@/lib/types";
import type { Stats } from "@/lib/data";
import type { SiteSettings } from "@/lib/settings";

type ActionResult = { ok: boolean; message?: string };

const STATUS_LABEL: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
};

export default function AdminDashboard({
  influencers, adRequests, stats, settings, demo, missingServiceRole,
}: {
  influencers: Influencer[];
  adRequests: AdRequest[];
  stats: Stats;
  settings: SiteSettings;
  demo: boolean;
  missingServiceRole: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"influencers" | "ads" | "settings">("influencers");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);
  const [actionError, setActionError] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<ActionResult>) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setActionError(res.message || "حدث خطأ غير متوقع، حاول مرة أخرى.");
      } else {
        setActionError("");
        router.refresh();
      }
    });

  const filtered = influencers.filter((i) => {
    const mq = !q || i.name.includes(q) || i.city.includes(q);
    const ms = !statusFilter || i.status === statusFilter;
    return mq && ms;
  });

  return (
    <div className="container-max py-12">
      {/* DOM order: title first (renders right in RTL), controls last (renders left) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-right">
          <h1 className="font-display text-3xl font-bold gold-text">لوحة التحكم</h1>
          <p className="text-sm text-white/45">إدارة المؤثرين وطلبات الإعلانات</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowAdd(true)} className="btn-gold">
            <Plus className="h-4 w-4" /> إضافة مؤثر
          </button>
          <button onClick={() => run(() => logout())} className="btn-outline">
            <LogOut className="h-4 w-4" /> خروج
          </button>
        </div>
      </div>

      {(showAdd || editingInfluencer) && (
        <AddInfluencerModal
          influencer={editingInfluencer ?? undefined}
          onClose={() => {
            setShowAdd(false);
            setEditingInfluencer(null);
          }}
        />
      )}

      {demo && (
        <p className="mt-6 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-center text-xs text-gold">
          وضع تجريبي — لم يتم ربط قاعدة البيانات بعد. الإجراءات لن تُحفظ حتى تضيف مفاتيح Supabase.
        </p>
      )}

      {!demo && missingServiceRole && (
        <p className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-xs text-red-300">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          مفتاح SUPABASE_SERVICE_ROLE_KEY غير مضاف — القبول/الرفض/الحذف/التعديل ورفع الصور لن تعمل، وحتى عرض المؤثرين غير الموافق عليهم لن يظهر، حتى تضيف المفتاح في إعدادات البيئة على Vercel.
        </p>
      )}

      {actionError && (
        <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          <button onClick={() => setActionError("")} className="text-red-300/70 hover:text-red-200">✕</button>
          <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 flex-shrink-0" /> {actionError}</span>
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users />} value={stats.totalInfluencers} label="إجمالي المؤثرين" />
        <StatCard icon={<Megaphone />} value={stats.adRequests} label="طلبات الإعلان" />
        <StatCard icon={<CheckCircle2 />} value={stats.reviewing} label="بانتظار المراجعة" />
        <StatCard icon={<Clock />} value={stats.pending} label="طلبات معلقة" />
      </div>

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap justify-start gap-2">
        <TabBtn active={tab === "influencers"} onClick={() => setTab("influencers")}>
          المؤثرون <Badge>{influencers.length}</Badge>
        </TabBtn>
        <TabBtn active={tab === "ads"} onClick={() => setTab("ads")}>
          طلبات الإعلان <Badge>{adRequests.length}</Badge>
        </TabBtn>
        <TabBtn active={tab === "settings"} onClick={() => setTab("settings")}>
          <Settings className="h-3.5 w-3.5" /> إعدادات الموقع
        </TabBtn>
      </div>

      {tab === "settings" ? (
        <SettingsForm initial={settings} />
      ) : tab === "influencers" ? (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو المدينة..." className="field pr-11" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="field w-44">
              <option value="">كل الحالات</option>
              <option value="pending">قيد المراجعة</option>
              <option value="approved">مقبول</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>

          <div className="mt-5 space-y-3">
            {filtered.map((inf) => (
              <div key={inf.id} className="card flex flex-col items-start gap-4 p-4 sm:flex-row sm:items-center">
                {/* DOM order avatar → info → controls: RTL renders avatar on the right, controls on the left */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={inf.avatar_url || "/avatar-placeholder.svg"}
                  alt={inf.name}
                  className="h-14 w-14 flex-shrink-0 rounded-full border-2 border-gold/20 object-cover"
                />

                <div className="min-w-0 flex-1 text-right">
                  <div className="flex flex-wrap items-center justify-start gap-2">
                    <span className="font-semibold text-white">{inf.name}</span>
                    <StatusPill status={inf.status} />
                    {inf.verified && (
                      <span className="flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] text-gold">
                        <BadgeCheck className="h-3 w-3" /> موثّق
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-white/45">
                    {inf.city} • {inf.category} • {formatFollowers(inf.followers)} متابع
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === inf.id ? null : inf.id)}
                    className="glass flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:text-gold"
                    aria-label="خيارات"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {openMenuId === inf.id && (
                    <>
                      {/* backdrop to close on outside click */}
                      <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                      <div className="glass-card absolute left-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-xl py-1 text-right">
                        <MenuItem
                          onClick={() => {
                            setOpenMenuId(null);
                            setEditingInfluencer(inf);
                          }}
                          icon={<Pencil className="h-3.5 w-3.5" />}
                        >
                          تعديل
                        </MenuItem>

                        {/* لا نعرض إجراء الحالة الحالية نفسه — لو مقبول أصلاً منعرضش "قبول" تاني، وهكذا */}
                        {inf.status !== "approved" && (
                          <MenuItem
                            onClick={() => {
                              setOpenMenuId(null);
                              run(() => setInfluencerStatus(inf.id, "approved"));
                            }}
                            icon={<Check className="h-3.5 w-3.5" />}
                            tone="success"
                            disabled={isPending}
                          >
                            قبول
                          </MenuItem>
                        )}
                        {inf.status !== "rejected" && (
                          <MenuItem
                            onClick={() => {
                              setOpenMenuId(null);
                              run(() => setInfluencerStatus(inf.id, "rejected"));
                            }}
                            icon={<X className="h-3.5 w-3.5" />}
                            disabled={isPending}
                          >
                            رفض
                          </MenuItem>
                        )}

                        <MenuItem
                          onClick={() => {
                            setOpenMenuId(null);
                            if (confirm(`هل تريد حذف ${inf.name}؟`)) run(() => deleteInfluencer(inf.id));
                          }}
                          icon={<Trash2 className="h-3.5 w-3.5" />}
                          tone="danger"
                          disabled={isPending}
                        >
                          حذف
                        </MenuItem>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="py-10 text-center text-white/40">لا يوجد مؤثرون.</p>}
          </div>
        </>
      ) : (
        <div className="mt-5 space-y-3">
          {adRequests.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="text-right">
                  <div className="flex items-center justify-start gap-2">
                    <StatusPill status={r.status} />
                    <span className="font-semibold text-white">{r.company_name}</span>
                  </div>
                  <div className="mt-1 text-xs text-white/45">
                    المسؤول: {r.contact_name} • {r.category} • {r.city}
                  </div>
                  <div className="mt-1 text-xs text-white/45">المؤثر: {r.target_influencer || "غير محدد"}</div>
                  <p className="mt-2 max-w-md text-xs text-white/60">{r.details}</p>
                  <div className="mt-1 text-xs text-white/40">{r.phone} • {r.email}</div>
                </div>
                <span className="font-display text-lg text-gold">{r.budget.toLocaleString("en")} ر.س</span>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button onClick={() => run(() => setAdRequestStatus(r.id, "approved"))} className="inline-flex items-center gap-1 rounded-lg bg-green-500/15 px-3 py-1.5 text-xs text-green-400 hover:bg-green-500/25" disabled={isPending}>
                  <Check className="h-3.5 w-3.5" /> قبول
                </button>
                <button onClick={() => run(() => setAdRequestStatus(r.id, "rejected"))} className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10" disabled={isPending}>
                  <X className="h-3.5 w-3.5" /> رفض
                </button>
                <button onClick={() => { if (confirm(`هل تريد حذف طلب ${r.company_name}؟`)) run(() => deleteAdRequest(r.id)); }} className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20" disabled={isPending}>
                  <Trash2 className="h-3.5 w-3.5" /> حذف
                </button>
              </div>
            </div>
          ))}
          {adRequests.length === 0 && <p className="py-10 text-center text-white/40">لا توجد طلبات إعلان.</p>}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  children,
  icon,
  onClick,
  tone = "default",
  disabled = false,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "success" | "danger";
  disabled?: boolean;
}) {
  const toneClass =
    tone === "success" ? "text-green-400 hover:bg-green-500/10" :
    tone === "danger" ? "text-red-400 hover:bg-red-500/10" :
    "text-white/80 hover:bg-white/5";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-end gap-2 px-4 py-2.5 text-xs transition disabled:opacity-50 ${toneClass}`}
    >
      {children} {icon}
    </button>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="card flex items-center p-5 gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-gold/10 text-gold">{icon}</span>
      <div className="text-right">
        <div className="font-display text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-white/45">{label}</div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
        active ? "bg-gold-gradient font-semibold text-black" : "border border-line text-white/70 hover:text-gold"
      }`}
    >
      {children}
    </button>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="grid h-5 min-w-5 place-items-center rounded-full bg-black/20 px-1 text-[10px]">{children}</span>;
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "border-gold/40 bg-gold/10 text-gold",
    approved: "border-green-500/40 bg-green-500/10 text-green-400",
    rejected: "border-red-500/40 bg-red-500/10 text-red-400",
  };
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] ${map[status]}`}>{STATUS_LABEL[status]}</span>;
}
