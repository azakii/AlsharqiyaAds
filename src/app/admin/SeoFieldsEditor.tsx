"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import AvatarUploader from "@/components/AvatarUploader";
import type { SeoPage } from "@/lib/seo-shared";

const TITLE_LIMIT = 60;
const DESC_LIMIT = 160;

/**
 * كل حقول محتوى السيو (بدون path/label — دول سياقيّان يتحكم فيهما الفورم الأب: SeoManager
 * للصفحات العامة، أو AddInfluencerModal لصفحة مؤثر معيّن). يُستخدم داخل <form> يحتوي أيضاً
 * على حقول path/label/id الخاصة بالسياق، وكلاهما يستدعي نفس upsertSeoPage عند الحفظ.
 */
export default function SeoFieldsEditor({
  initial,
  ogImageFolder = "seo",
}: {
  initial?: SeoPage | null;
  ogImageFolder?: string;
}) {
  const [title, setTitle] = useState(initial?.meta_title || "");
  const [desc, setDesc] = useState(initial?.meta_description || "");
  const [ogImage, setOgImage] = useState(initial?.og_image || "");
  const [twitterImage, setTwitterImage] = useState(initial?.twitter_image || "");
  const [blocks, setBlocks] = useState<{ label: string; json: string }[]>(
    (initial?.structured_data || []).map((b) => ({ label: b.label, json: JSON.stringify(b.data, null, 2) }))
  );

  function addBlock() {
    setBlocks((b) => [...b, { label: "", json: "" }]);
  }
  function updateBlock(i: number, patch: Partial<{ label: string; json: string }>) {
    setBlocks((b) => b.map((blk, idx) => (idx === i ? { ...blk, ...patch } : blk)));
  }
  function removeBlock(i: number) {
    setBlocks((b) => b.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="og_image" value={ogImage} />
      <input type="hidden" name="twitter_image" value={twitterImage} />
      <input type="hidden" name="structured_data_json" value={JSON.stringify(blocks)} />

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="field-label !mb-0">Meta Title</label>
          <span className={`text-[11px] ${title.length > TITLE_LIMIT ? "text-red-400" : "text-muted"}`}>
            {title.length}/{TITLE_LIMIT}
          </span>
        </div>
        <input name="meta_title" value={title} onChange={(e) => setTitle(e.target.value)} className="field" />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="field-label !mb-0">Meta Description</label>
          <span className={`text-[11px] ${desc.length > DESC_LIMIT ? "text-red-400" : "text-muted"}`}>
            {desc.length}/{DESC_LIMIT}
          </span>
        </div>
        <textarea name="meta_description" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className="field resize-none" />
      </div>

      <div>
        <label className="field-label">الكلمات المفتاحية (Meta Keywords، مفصولة بفاصلة)</label>
        <input name="meta_keywords" defaultValue={initial?.meta_keywords || ""} className="field" placeholder="مؤثرين, إعلانات, المنطقة الشرقية" />
      </div>

      <div>
        <label className="field-label">رابط Canonical (اختياري — يُبنى تلقائياً من رابط الصفحة إن تُرك فارغاً)</label>
        <input name="canonical_url" dir="ltr" defaultValue={initial?.canonical_url || ""} className="field" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="glass flex cursor-pointer items-center justify-between rounded-xl px-4 py-3">
          <span className="text-sm text-white/80">Index (السماح بالفهرسة)</span>
          <input type="checkbox" name="robots_index" defaultChecked={initial ? initial.robots_index : true} className="h-5 w-5 accent-[rgb(212,160,23)]" />
        </label>
        <label className="glass flex cursor-pointer items-center justify-between rounded-xl px-4 py-3">
          <span className="text-sm text-white/80">Follow (تتبّع الروابط)</span>
          <input type="checkbox" name="robots_follow" defaultChecked={initial ? initial.robots_follow : true} className="h-5 w-5 accent-[rgb(212,160,23)]" />
        </label>
      </div>

      <div className="card p-4">
        <h4 className="mb-3 border-r-2 border-gold pr-3 text-sm font-semibold text-gold">Open Graph (فيسبوك / واتساب)</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">OG Title</label>
            <input name="og_title" defaultValue={initial?.og_title || ""} className="field" />
          </div>
          <div>
            <label className="field-label">OG Type</label>
            <select name="og_type" defaultValue={initial?.og_type || "website"} className="field">
              <option value="website">website</option>
              <option value="article">article</option>
              <option value="profile">profile</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">OG Description</label>
            <textarea name="og_description" defaultValue={initial?.og_description || ""} rows={2} className="field resize-none" />
          </div>
          <div className="sm:col-span-2">
            <AvatarUploader value={ogImage} onChange={setOgImage} label="صورة المشاركة (OG Image)" folder={ogImageFolder} shape="square" />
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h4 className="mb-3 border-r-2 border-gold pr-3 text-sm font-semibold text-gold">Twitter / X Card</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Card Type</label>
            <select name="twitter_card" defaultValue={initial?.twitter_card || "summary_large_image"} className="field">
              <option value="summary_large_image">summary_large_image</option>
              <option value="summary">summary</option>
            </select>
          </div>
          <div>
            <label className="field-label">Twitter Title</label>
            <input name="twitter_title" defaultValue={initial?.twitter_title || ""} className="field" />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Twitter Description</label>
            <textarea name="twitter_description" defaultValue={initial?.twitter_description || ""} rows={2} className="field resize-none" />
          </div>
          <div className="sm:col-span-2">
            <AvatarUploader value={twitterImage} onChange={setTwitterImage} label="صورة Twitter/X (اختياري — نفس صورة OG لو تُركت فارغة)" folder={ogImageFolder} shape="square" />
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between border-r-2 border-gold pr-3">
          <h4 className="text-sm font-semibold text-gold">Schema Markup / Structured Data (JSON-LD)</h4>
          <button type="button" onClick={addBlock} className="flex items-center gap-1 text-xs text-gold hover:underline">
            <Plus className="h-3.5 w-3.5" /> إضافة كتلة
          </button>
        </div>
        {blocks.length === 0 && <p className="text-xs text-muted">لا توجد كتل structured data مضافة.</p>}
        <div className="space-y-3">
          {blocks.map((b, i) => (
            <div key={i} className="rounded-xl border border-line p-3">
              <div className="mb-2 flex items-center gap-2">
                <input
                  value={b.label}
                  onChange={(e) => updateBlock(i, { label: e.target.value })}
                  placeholder="اسم الكتلة (مثال: Organization Schema)"
                  className="field flex-1"
                />
                <button type="button" onClick={() => removeBlock(i)} className="text-red-400 hover:text-red-300" aria-label="حذف الكتلة">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <textarea
                value={b.json}
                onChange={(e) => updateBlock(i, { json: e.target.value })}
                rows={6}
                dir="ltr"
                placeholder='{"@context":"https://schema.org","@type":"Organization",...}'
                className="field resize-none font-mono text-xs"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
