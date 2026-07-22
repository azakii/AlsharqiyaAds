"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Megaphone, Clock, CheckCircle2, Check, X, Trash2, LogOut, Search, Plus,
} from "lucide-react";
import { formatFollowers } from "@/lib/constants";
import {
  setInfluencerStatus, deleteInfluencer, setAdRequestStatus, deleteAdRequest, logout,
} from "@/lib/actions";
import type { Influencer, AdRequest } from "@/lib/types";
import type { Stats } from "@/lib/data";

const STATUS_LABEL: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
};

export default function AdminDashboard({
  influencers, adRequests, stats, demo,
}: {
  influencers: Influencer[];
  adRequests: AdRequest[];
  stats: Stats;
  demo: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"influencers" | "ads">("influencers");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  const filtered = influencers.filter((i) => {
    const mq = !q || i.name.includes(q) || i.city.includes(q);
    const ms = !statusFilter || i.status === statusFilter;
    return mq && ms;
  });

  return (
    <div className="container-max py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a href="/register" className="btn-gold"><Plus className="h-4 w-4" /> إضافة مؤثر</a>
          <button onClick={() => run(async () => { await logout(); })} className="btn-outline">
            <LogOut className="h-4 w-4" /> خروج
          </button>
        </div>
        <div className="text-left">
          <h1 className="font-display text-3xl font-bold gold-text">لوحة التحكم</h1>
          <p className="text-sm text-white/45">إدارة المؤثرين وطلبات الإعلانات</p>
        </div>
      </div>

      {demo && (
        <p className="mt-6 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-center text-xs text-gold">
          وضع تجريبي — لم يتم ربط قاعدة البيانات بعد. الإجراءات لن تُحفظ حتى تضيف مفاتيح Supabase.
        </p>
      )}

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users />} value={stats.totalInfluencers} label="إجمالي المؤثرين" />
        <StatCard icon={<Megaphone />} value={stats.adRequests} label="طلبات الإعلان" />
        <StatCard icon={<CheckCircle2 />} value={stats.reviewing} label="بانتظار المراجعة" />
        <StatCard icon={<Clock />} value={stats.pending} label="طلبات معلقة" />
      </div>

      {/* Tabs */}
      <div className="mt-8 flex justify-end gap-2">
        <TabBtn active={tab === "ads"} onClick={() => setTab("ads")}>
          طلبات الإعلان <Badge>{adRequests.length}</Badge>
        </TabBtn>
        <TabBtn active={tab === "influencers"} onClick={() => setTab("influencers")}>
          المؤثرون <Badge>{influencers.length}</Badge>
        </TabBtn>
      </div>

      {tab === "influencers" ? (
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
              <div key={inf.id} className="card flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => run(() => setInfluencerStatus(inf.id, "approved"))}
                    className="inline-flex items-center gap-1 rounded-lg bg-green-500/15 px-3 py-1.5 text-xs text-green-400 hover:bg-green-500/25"
                    disabled={isPending}
                  >
                    <Check className="h-3.5 w-3.5" /> قبول
                  </button>
                  <button
                    onClick={() => run(() => setInfluencerStatus(inf.id, "rejected"))}
                    className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10"
                    disabled={isPending}
                  >
                    <X className="h-3.5 w-3.5" /> رفض
                  </button>
                  <button
                    onClick={() => run(() => deleteInfluencer(inf.id))}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20"
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> حذف
                  </button>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className="flex items-center justify-end gap-2">
                      <StatusPill status={inf.status} />
                      <span className="font-semibold text-white">{inf.name}</span>
                    </div>
                    <div className="mt-1 text-xs text-white/45">
                      {inf.city} • {inf.category} • {formatFollowers(inf.followers)} متابع
                    </div>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={inf.avatar_url || "/avatar-placeholder.svg"} alt={inf.name} className="h-12 w-12 rounded-full border border-line object-cover" />
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
                <span className="font-display text-lg text-gold">{r.budget.toLocaleString("en")} ر.س</span>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
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
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button onClick={() => run(() => setAdRequestStatus(r.id, "approved"))} className="inline-flex items-center gap-1 rounded-lg bg-green-500/15 px-3 py-1.5 text-xs text-green-400 hover:bg-green-500/25" disabled={isPending}>
                  <Check className="h-3.5 w-3.5" /> قبول
                </button>
                <button onClick={() => run(() => setAdRequestStatus(r.id, "rejected"))} className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10" disabled={isPending}>
                  <X className="h-3.5 w-3.5" /> رفض
                </button>
                <button onClick={() => run(() => deleteAdRequest(r.id))} className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20" disabled={isPending}>
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

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="card flex items-center justify-between p-5">
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
