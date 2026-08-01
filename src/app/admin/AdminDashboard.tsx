"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Megaphone, Clock, CheckCircle2, Check, X, Trash2, Search, Plus, Settings, Pencil, BadgeCheck, AlertTriangle, MoreVertical, CalendarDays, MessageCircle, Phone, ChevronRight, ChevronLeft, FilterX, XCircle, Globe,
} from "lucide-react";
import { formatFollowers } from "@/lib/constants";
import { normalizePhone } from "@/lib/validators";
import {
  setInfluencerStatus, deleteInfluencer, deleteAdRequest, bulkSetInfluencerStatus, bulkDeleteInfluencers,
} from "@/lib/actions";
import SettingsForm from "./SettingsForm";
import AddInfluencerModal from "./AddInfluencerModal";
import SeoManager from "./SeoManager";
import type { Influencer, AdRequest, InfluencerStatus } from "@/lib/types";
import type { Stats } from "@/lib/data";
import type { SiteSettings } from "@/lib/settings";
import type { SeoPage } from "@/lib/seo-shared";

type ActionResult = { ok: boolean; message?: string };
type Tab = "influencers" | "ads" | "seo" | "settings";

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
};

/** يحوّل رقم جوال سعودي (محلي أو دولي) لصيغة wa.me: 9665XXXXXXXX بدون + أو أصفار مقدمة. */
function toWhatsAppNumber(phone: string): string {
  const v = normalizePhone(phone).replace(/^\+/, "").replace(/^00/, "");
  return v.startsWith("05") ? `966${v.slice(1)}` : v;
}

/** Western-digit DD/MM/YYYY, matches the site's convention of Latin numerals in an RTL UI. */
function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AdminDashboard({
  influencers, adRequests, stats, settings, seoPages, demo, missingServiceRole, initialTab,
}: {
  influencers: Influencer[];
  adRequests: AdRequest[];
  stats: Stats;
  settings: SiteSettings;
  seoPages: SeoPage[];
  demo: boolean;
  missingServiceRole: boolean;
  initialTab?: Tab;
}) {
  const router = useRouter();
  const [tab, setTabState] = useState<Tab>(initialTab || "influencers");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);
  const [actionError, setActionError] = useState("");
  const [openMenu, setOpenMenu] = useState<{ id: string; top: number; left: number } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [infPage, setInfPage] = useState(1);
  const [adPage, setAdPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllOnPage(pageIds: string[]) {
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function runBulkStatus(status: InfluencerStatus) {
    const ids = Array.from(selected);
    startTransition(async () => {
      const res: ActionResult = await bulkSetInfluencerStatus(ids, status);
      if (!res.ok) {
        setActionError(res.message || "حدث خطأ غير متوقع، حاول مرة أخرى.");
      } else {
        setActionError("");
        setSelected(new Set());
        router.refresh();
      }
    });
  }

  function runBulkDelete() {
    const ids = Array.from(selected);
    if (!confirm(`هل تريد حذف ${ids.length} مؤثر؟`)) return;
    startTransition(async () => {
      const res: ActionResult = await bulkDeleteInfluencers(ids);
      if (!res.ok) {
        setActionError(res.message || "حدث خطأ غير متوقع، حاول مرة أخرى.");
      } else {
        setActionError("");
        setSelected(new Set());
        router.refresh();
      }
    });
  }

  // روابط الهيدر (المؤثرون/طلبات الإعلان/إعدادات الموقع) بتدخل بـ /admin?tab=... — لو الصفحة
  // كانت أصلاً مفتوحة على /admin ومتغيرش الراوت، الكومبوننت بيفضل نفسه فقط الـ prop بيتحدث.
  useEffect(() => {
    if (initialTab) setTabState(initialTab);
  }, [initialTab]);

  function setTab(t: Tab) {
    setTabState(t);
    router.replace(`/admin?tab=${t}`, { scroll: false });
  }

  useEffect(() => {
    setInfPage(1);
    setSelected(new Set());
  }, [q, statusFilter]);

  useEffect(() => {
    setAdPage(1);
  }, [dateFrom, dateTo]);

  // Menu is rendered as a single fixed-position instance outside every row card (see below) —
  // each ".card" row has backdrop-filter, which creates its own stacking context in CSS and
  // traps a nested z-index, so a dropdown positioned *inside* a row can render behind the next
  // row's card. Rendering it once, outside the list, with viewport coordinates avoids that.
  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [openMenu]);

  function toggleMenu(id: string, e: React.MouseEvent<HTMLButtonElement>) {
    if (openMenu?.id === id) {
      setOpenMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setOpenMenu({ id, top: rect.bottom + 8, left: rect.left });
  }

  const menuInfluencer = openMenu ? influencers.find((i) => i.id === openMenu.id) ?? null : null;

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
  const infTotalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const infPageClamped = Math.min(infPage, infTotalPages);
  const pagedInfluencers = filtered.slice((infPageClamped - 1) * PAGE_SIZE, infPageClamped * PAGE_SIZE);

  const filteredAds = adRequests.filter((r) => {
    if (!dateFrom && !dateTo) return true;
    if (!r.created_at) return false;
    const d = r.created_at.slice(0, 10);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  });
  const adTotalPages = Math.max(1, Math.ceil(filteredAds.length / PAGE_SIZE));
  const adPageClamped = Math.min(adPage, adTotalPages);
  const pagedAds = filteredAds.slice((adPageClamped - 1) * PAGE_SIZE, adPageClamped * PAGE_SIZE);

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
        </div>
      </div>

      {(showAdd || editingInfluencer) && (
        <AddInfluencerModal
          influencer={editingInfluencer ?? undefined}
          seo={editingInfluencer ? seoPages.find((s) => s.path === `/influencer/${editingInfluencer.id}`) ?? null : null}
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

      {tab === "settings" ? (
        <>
          <SectionTitle icon={<Settings className="h-5 w-5" />} title="تعديل إعدادات الموقع" />
          <SettingsForm initial={settings} />
        </>
      ) : tab === "seo" ? (
        <>
          <SectionTitle icon={<Globe className="h-5 w-5" />} title="إدارة السيو (SEO)" />
          <SeoManager seoPages={seoPages} />
        </>
      ) : tab === "influencers" ? (
        <>
          <SectionTitle icon={<Users className="h-5 w-5" />} title="قائمة المؤثرين" />

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

          {/* شريط التحديد الجماعي — يظهر بس لما يبقى فيه عنصر محدد على الأقل */}
          {selected.size > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3">
              <span className="text-sm font-semibold text-gold">{selected.size} محدد</span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => runBulkStatus("approved")}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/15 px-3 py-1.5 text-xs text-green-400 hover:bg-green-500/25 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" /> قبول المحدد
                </button>
                <button
                  onClick={() => runBulkStatus("rejected")}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" /> رفض المحدد
                </button>
                <button
                  onClick={runBulkDelete}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> حذف المحدد
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-white/50 hover:text-white/80"
                >
                  <XCircle className="h-3.5 w-3.5" /> إلغاء التحديد
                </button>
              </div>
            </div>
          )}

          {pagedInfluencers.length > 0 && (
            <label className="mt-4 flex w-fit items-center gap-2 text-xs text-white/50">
              <input
                type="checkbox"
                className="h-4 w-4 accent-gold"
                checked={pagedInfluencers.every((i) => selected.has(i.id))}
                onChange={() => toggleSelectAllOnPage(pagedInfluencers.map((i) => i.id))}
              />
              تحديد الكل في هذه الصفحة
            </label>
          )}

          <div className="mt-3 space-y-3">
            {pagedInfluencers.map((inf) => (
              <div key={inf.id} className="card flex flex-col items-start gap-4 p-4 sm:flex-row sm:items-center">
                {/* DOM order: checkbox → avatar → info → controls (RTL: checkbox أقصى اليمين، الكونترولز أقصى الشمال) */}
                <input
                  type="checkbox"
                  className="h-4 w-4 flex-shrink-0 accent-gold"
                  checked={selected.has(inf.id)}
                  onChange={() => toggleSelect(inf.id)}
                  aria-label={`تحديد ${inf.name}`}
                />
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
                        <BadgeCheck className="h-3 w-3" /> ملتزم
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-white/45">
                    {inf.city} • {inf.category} • {formatFollowers(inf.followers)} متابع
                  </div>
                  <div className="mt-1 flex items-center justify-start gap-1 text-[11px] text-white/35">
                    <CalendarDays className="h-3 w-3" /> تاريخ التسجيل: {formatDate(inf.created_at)}
                  </div>
                </div>

                <button
                  onClick={(e) => toggleMenu(inf.id, e)}
                  className="glass flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white/70 hover:text-gold"
                  aria-label="خيارات"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            ))}
            {filtered.length === 0 && <p className="py-10 text-center text-white/40">لا يوجد مؤثرون.</p>}
          </div>

          <Pagination page={infPageClamped} totalPages={infTotalPages} onChange={setInfPage} />

          {/* قائمة الإجراءات — عنصر واحد مشترك خارج كل الكروت (position: fixed بإحداثيات
              الزر المضغوط)، عشان ما يتحبسش جوه stacking context الكارد (backdrop-filter). */}
          {openMenu && menuInfluencer && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
              <div
                className="glass-card fixed z-50 w-40 overflow-hidden rounded-xl py-1 text-right"
                style={{ top: openMenu.top, left: openMenu.left }}
              >
                <MenuItem
                  onClick={() => {
                    setOpenMenu(null);
                    setEditingInfluencer(menuInfluencer);
                  }}
                  icon={<Pencil className="h-3.5 w-3.5" />}
                >
                  تعديل
                </MenuItem>

                {/* لا نعرض إجراء الحالة الحالية نفسه — لو مقبول أصلاً منعرضش "قبول" تاني، وهكذا */}
                {menuInfluencer.status !== "approved" && (
                  <MenuItem
                    onClick={() => {
                      setOpenMenu(null);
                      run(() => setInfluencerStatus(menuInfluencer.id, "approved"));
                    }}
                    icon={<Check className="h-3.5 w-3.5" />}
                    tone="success"
                    disabled={isPending}
                  >
                    قبول
                  </MenuItem>
                )}
                {menuInfluencer.status !== "rejected" && (
                  <MenuItem
                    onClick={() => {
                      setOpenMenu(null);
                      run(() => setInfluencerStatus(menuInfluencer.id, "rejected"));
                    }}
                    icon={<X className="h-3.5 w-3.5" />}
                    disabled={isPending}
                  >
                    رفض
                  </MenuItem>
                )}

                <MenuItem
                  onClick={() => {
                    setOpenMenu(null);
                    if (confirm(`هل تريد حذف ${menuInfluencer.name}؟`)) run(() => deleteInfluencer(menuInfluencer.id));
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
        </>
      ) : (
        <>
          <SectionTitle icon={<Megaphone className="h-5 w-5" />} title="قائمة طلبات الإعلان" />

          <div className="mt-5 flex flex-wrap items-end gap-3">
            <div>
              <label className="field-label">من تاريخ</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="field w-44" />
            </div>
            <div>
              <label className="field-label">إلى تاريخ</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="field w-44" />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-3 text-xs font-semibold text-white/60 transition hover:text-gold"
              >
                <FilterX className="h-3.5 w-3.5" /> مسح الفلتر
              </button>
            )}
          </div>

          <div className="mt-5 space-y-3">
            {pagedAds.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="text-right">
                    <span className="font-semibold text-white">{r.company_name}</span>
                    <div className="mt-1 text-xs text-white/45">
                      المسؤول: {r.contact_name} • {r.category} • {r.city}
                    </div>
                    <div className="mt-1 text-xs text-white/45">المؤثر: {r.target_influencer || "غير محدد"}</div>
                    <p className="mt-2 max-w-md text-xs text-white/60">{r.details}</p>
                    <div className="mt-1 text-xs text-white/40">{r.phone} • {r.email}</div>
                    <div className="mt-1 flex items-center justify-start gap-1 text-[11px] text-white/35">
                      <CalendarDays className="h-3 w-3" /> تاريخ التسجيل: {formatDate(r.created_at)}
                    </div>
                  </div>
                  <span className="font-display text-lg text-gold">{r.budget.toLocaleString("en")} ر.س</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                  <a
                    href={`https://wa.me/${toWhatsAppNumber(r.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-green-500/15 px-3 py-1.5 text-xs text-green-400 hover:bg-green-500/25"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> واتساب
                  </a>
                  <a
                    href={`tel:${normalizePhone(r.phone)}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-gold/10 px-3 py-1.5 text-xs text-gold hover:bg-gold/20"
                  >
                    <Phone className="h-3.5 w-3.5" /> اتصال
                  </a>
                  <button onClick={() => { if (confirm(`هل تريد حذف طلب ${r.company_name}؟`)) run(() => deleteAdRequest(r.id)); }} className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20" disabled={isPending}>
                    <Trash2 className="h-3.5 w-3.5" /> حذف
                  </button>
                </div>
              </div>
            ))}
            {filteredAds.length === 0 && (
              <p className="py-10 text-center text-white/40">
                {adRequests.length === 0 ? "لا توجد طلبات إعلان." : "لا توجد طلبات مطابقة لفلتر التاريخ."}
              </p>
            )}
          </div>

          <Pagination page={adPageClamped} totalPages={adTotalPages} onChange={setAdPage} />
        </>
      )}
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mt-8 flex items-center gap-2 border-r-2 border-gold pr-3">
      <span className="text-gold">{icon}</span>
      <h2 className="font-display text-xl font-bold text-white">{title}</h2>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="glass flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:text-gold disabled:opacity-30"
        aria-label="الصفحة السابقة"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <span className="text-xs text-white/60">
        صفحة <span className="font-semibold text-white">{page}</span> من <span className="font-semibold text-white">{totalPages}</span>
      </span>
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="glass flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:text-gold disabled:opacity-30"
        aria-label="الصفحة التالية"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
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
      className={`flex w-full items-center justify-start gap-2 px-4 py-2.5 text-xs transition disabled:opacity-50 ${toneClass}`}
    >
      {icon} {children}
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

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "border-gold/40 bg-gold/10 text-gold",
    approved: "border-green-500/40 bg-green-500/10 text-green-400",
    rejected: "border-red-500/40 bg-red-500/10 text-red-400",
  };
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] ${map[status]}`}>{STATUS_LABEL[status]}</span>;
}
