"use client";

import { useState } from "react";
import { Save, Loader2, Check } from "lucide-react";
import { saveSettings } from "@/lib/actions";
import type { SiteSettings } from "@/lib/settings";

export default function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const res = await saveSettings(new FormData(e.currentTarget));
    setMsg({ ok: !!res.ok, text: res.message || (res.ok ? "تم الحفظ" : "خطأ") });
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-6">
      <Group title="الهوية واللوجو">
        <Text name="brand_name" label="اسم الموقع" def={initial.brand_name} />
        <Text name="brand_name_en" label="الاسم بالإنجليزية" def={initial.brand_name_en} />
        <Text name="logo_url" label="رابط اللوجو (اتركه فارغاً لأيقونة التاج)" def={initial.logo_url} full />
      </Group>

      <Group title="القسم الرئيسي (Hero)">
        <Text name="hero_badge" label="الشارة العلوية" def={initial.hero_badge} full />
        <Text name="hero_title" label="العنوان الرئيسي" def={initial.hero_title} />
        <Text name="hero_image" label="رابط صورة الخلفية" def={initial.hero_image} />
        <Area name="hero_subtitle" label="النص التعريفي" def={initial.hero_subtitle} />
      </Group>

      <Group title="قسم الدعوة (CTA)">
        <Text name="cta_title" label="العنوان" def={initial.cta_title} />
        <Area name="cta_text" label="النص" def={initial.cta_text} />
      </Group>

      <Group title="الفوتر والتواصل">
        <Area name="footer_about" label="نبذة الفوتر" def={initial.footer_about} full />
        <Text name="contact_phone" label="رقم الهاتف" def={initial.contact_phone} />
        <Text name="contact_email" label="البريد الإلكتروني" def={initial.contact_email} />
        <Text name="contact_location" label="الموقع / العنوان" def={initial.contact_location} full />
      </Group>

      <Group title="الألوان">
        <Color name="color_bg" label="الخلفية" def={initial.color_bg} />
        <Color name="color_gold" label="الذهبي الأساسي" def={initial.color_gold} />
        <Color name="color_gold_light" label="الذهبي الفاتح" def={initial.color_gold_light} />
        <Color name="color_gold_dark" label="الذهبي الغامق" def={initial.color_gold_dark} />
      </Group>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={loading} className="btn-gold disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ الإعدادات
        </button>
        {msg && (
          <span className={`flex items-center gap-1 text-sm ${msg.ok ? "text-green-400" : "text-red-400"}`}>
            {msg.ok && <Check className="h-4 w-4" />} {msg.text}
          </span>
        )}
      </div>
    </form>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <h3 className="mb-4 border-r-2 border-gold pr-3 font-display text-gold">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Text({ name, label, def, full }: { name: string; label: string; def: string; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="field-label">{label}</label>
      <input name={name} defaultValue={def} className="field" />
    </div>
  );
}

function Area({ name, label, def, full }: { name: string; label: string; def: string; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : "sm:col-span-2"}>
      <label className="field-label">{label}</label>
      <textarea name={name} defaultValue={def} rows={3} className="field resize-none" />
    </div>
  );
}

function Color({ name, label, def }: { name: string; label: string; def: string }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="flex items-center gap-2">
        <input name={name} defaultValue={def} className="field flex-1" />
        <input
          type="color"
          defaultValue={def}
          onChange={(e) => {
            const input = e.currentTarget.previousElementSibling as HTMLInputElement | null;
            if (input) input.value = e.currentTarget.value;
          }}
          className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-transparent"
        />
      </div>
    </div>
  );
}
