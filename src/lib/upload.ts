"use server";

import { getSupabaseAdmin, supabaseEnabled } from "./supabase";

const BUCKET = "media";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export interface UploadResult {
  ok: boolean;
  url?: string;
  message?: string;
}

/** Uploads an image file to Supabase Storage and returns its public URL. */
export async function uploadImage(formData: FormData, folder: string = "avatars"): Promise<UploadResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "لم يتم اختيار صورة." };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, message: "صيغة الصورة غير مدعومة (JPG, PNG, WEBP, GIF فقط)." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)." };
  }

  if (!supabaseEnabled) {
    return { ok: false, message: "قاعدة البيانات غير مربوطة بعد — لا يمكن رفع الصور في الوضع التجريبي." };
  }
  const sb = getSupabaseAdmin();
  if (!sb) {
    return { ok: false, message: "رفع الصور يحتاج SUPABASE_SERVICE_ROLE_KEY في إعدادات البيئة." };
  }

  const safeFolder = /^[a-z0-9_-]+$/i.test(folder) ? folder : "avatars";
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await sb.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { ok: false, message: `فشل رفع الصورة: ${error.message}` };

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
