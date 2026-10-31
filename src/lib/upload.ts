"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { UPLOAD_DIR } from "./uploads";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export interface UploadResult {
  ok: boolean;
  url?: string;
  message?: string;
}

/** Saves an image under UPLOAD_DIR and returns its public URL (served by app/uploads/[...path]). */
export async function uploadImage(formData: FormData, folder: string = "avatars"): Promise<UploadResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "لم يتم اختيار صورة." };
  }
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    return { ok: false, message: "صيغة الصورة غير مدعومة (JPG, PNG, WEBP, GIF فقط)." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)." };
  }

  const safeFolder = /^[a-z0-9_-]+$/i.test(folder) ? folder : "avatars";
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  try {
    await mkdir(path.join(UPLOAD_DIR, safeFolder), { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, safeFolder, name), Buffer.from(await file.arrayBuffer()));
  } catch (e) {
    return { ok: false, message: `فشل رفع الصورة: ${(e as Error).message}` };
  }
  return { ok: true, url: `/uploads/${safeFolder}/${name}` };
}
