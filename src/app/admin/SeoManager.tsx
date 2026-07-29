"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Loader2, Globe } from "lucide-react";
import { upsertSeoPage, deleteSeoPage } from "@/lib/actions";
import { KNOWN_PAGES, type SeoPage } from "@/lib/seo-shared";
import SeoFieldsEditor from "./SeoFieldsEditor";

export default function SeoManager({ seoPages }: { seoPages: SeoPage[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<{ path: string; seo: SeoPage | null } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const knownWithoutRecord = KNOWN_PAGES.filter((p) => !seoPages.some((s) => s.path === p.path));

  async function onDelete(seo: SeoPage) {
    if (!confirm(`حذف إعدادات السيو لمسار "${seo.path}"؟`)) return;
    setError("");
    setBusyId(seo.id);
    const res = await deleteSeoPage(seo.id, seo.path);
    setBusyId(null);
    if (res.ok) router.refresh();
    else setError(("message" in res && res.message) || "تعذر الحذف");
  }

  return (
    <div className="mt-5 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-gold">إدارة السيو لكل صفحة</h3>
        <button
          type="button"
          onClick={() => setEditing({ path: "", seo: null })}
          className="btn-gold !px-4 !py-2 text-xs"
        >
          <Plus className="h-3.5 w-3.5" /> إضافة مسار مخصص
        </button>
      </div>

      {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-300">{error}</p>}

      {knownWithoutRecord.length > 0 && (
        <div className="card p-4">
          <h4 className="mb-3 text-sm text-white/60">إضافة سريعة لصفحات الموقع الثابتة</h4>
          <div className="flex flex-wrap gap-2">
            {knownWithoutRecord.map((p) => (
              <button
                key={p.path}
                type="button"
                onClick={() => setEditing({ path: p.path, seo: null })}
                className="chip hover:border-gold/40 hover:text-gold"
              >
                <Globe className="h-3 w-3" /> {p.label} <span dir="ltr" className="text-white/30">{p.path}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-x-auto p-4">
        <h4 className="mb-3 text-sm text-white/60">السجلات المحفوظة ({seoPages.length})</h4>
        {seoPages.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">لا توجد إعدادات سيو محفوظة بعد.</p>
        ) : (
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-white/40">
                <th className="pb-2 font-normal">المسار</th>
                <th className="pb-2 font-normal">العنوان</th>
                <th className="pb-2 font-normal">Index</th>
                <th className="pb-2 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {seoPages.map((s) => (
                <tr key={s.id} className="border-b border-line/50 last:border-0">
                  <td className="py-2.5">
                    <div dir="ltr" className="text-left text-xs text-white/70">{s.path}</div>
                    {s.label && <div className="text-xs text-white/40">{s.label}</div>}
                  </td>
                  <td className="max-w-[220px] truncate py-2.5 text-xs text-white/70">{s.meta_title || "—"}</td>
                  <td className="py-2.5 text-xs">
                    <span className={s.robots_index ? "text-green-400" : "text-red-400"}>
                      {s.robots_index ? "index" : "noindex"}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing({ path: s.path, seo: s })}
                        className="glass flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-gold"
                        aria-label="تعديل"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={busyId === s.id}
                        onClick={() => onDelete(s)}
                        className="glass flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-red-400 disabled:opacity-50"
                        aria-label="حذف"
                      >
                        {busyId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && <SeoPageModal path={editing.path} seo={editing.seo} onClose={() => setEditing(null)} />}
    </div>
  );
}

function SeoPageModal({ path, seo, onClose }: { path: string; seo: SeoPage | null; onClose: () => void }) {
  const router = useRouter();
  const [pathValue, setPathValue] = useState(path);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!pathValue.trim().startsWith("/")) {
      setError("المسار يجب أن يبدأ بـ /");
      return;
    }
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await upsertSeoPage(fd);
    setLoading(false);
    if (res.ok) {
      router.refresh();
      onClose();
    } else {
      setError(res.message || "حدث خطأ");
    }
  }

  const known = KNOWN_PAGES.find((p) => p.path === path);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-bg/90 p-4 backdrop-blur-xl" onClick={onClose}>
      <div className="glass-card max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{seo ? "تعديل إعدادات السيو" : "إضافة إعدادات سيو"}</h2>
          <button type="button" onClick={onClose} className="glass flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-gold" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {seo && <input type="hidden" name="id" value={seo.id} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">المسار (Path)</label>
              <input
                name="path"
                dir="ltr"
                value={pathValue}
                onChange={(e) => setPathValue(e.target.value)}
                placeholder="/example"
                disabled={Boolean(seo)}
                className="field disabled:opacity-60"
              />
            </div>
            <div>
              <label className="field-label">اسم مرجعي (للعرض في اللوحة فقط)</label>
              <input name="label" defaultValue={seo?.label || known?.label || ""} className="field" />
            </div>
          </div>

          <SeoFieldsEditor initial={seo} />

          {error && <p className="text-center text-sm text-red-400">{error}</p>}

          <div className="mt-6 flex items-center gap-3">
            <button type="button" onClick={onClose} className="glass flex-1 rounded-xl py-3 text-sm text-white/80 hover:text-gold">
              إلغاء
            </button>
            <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-gold py-3 text-sm font-semibold text-bg transition-opacity disabled:opacity-50">
              {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "حفظ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
