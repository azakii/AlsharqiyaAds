import { readFile } from "fs/promises";
import path from "path";
import { UPLOAD_DIR } from "@/lib/uploads";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(_req: Request, { params }: { params: { path: string[] } }) {
  const full = path.resolve(UPLOAD_DIR, ...params.path);
  const type = TYPES[path.extname(full).toLowerCase()];
  // Stay inside UPLOAD_DIR and only ever serve known image types.
  if (!type || !full.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) return new Response("Not found", { status: 404 });
  try {
    return new Response(await readFile(full), {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
