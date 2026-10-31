import path from "path";

/** Where uploaded images live. On Hostinger point UPLOAD_DIR outside the app folder so redeploys keep them. */
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
