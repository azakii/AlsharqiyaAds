"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { uploadImage } from "@/lib/upload";

export default function AvatarUploader({
  value,
  onChange,
  label = "الصورة الشخصية",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadImage(fd);
    setLoading(false);
    if (res.ok && res.url) {
      onChange(res.url);
    } else {
      setError(res.message || "فشل رفع الصورة");
    }
  }

  return (
    <div>
      <label className="field-label">{label}</label>

      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="معاينة" className="h-28 w-28 rounded-full border-2 border-gold/20 object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -left-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-red-500/90 text-white"
            aria-label="إزالة الصورة"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gold/30 bg-black/20 py-10 text-muted transition hover:border-gold/50 hover:text-gold disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-6 w-6 animate-spin text-gold" /> : <Upload className="h-6 w-6" />}
          <span className="text-sm">{loading ? "جاري الرفع..." : "اضغط لرفع صورة"}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
