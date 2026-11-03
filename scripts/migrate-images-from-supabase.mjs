// Downloads every Supabase-hosted image referenced in the DB into UPLOAD_DIR and rewrites the URLs to /uploads/...
// Dry run by default (lists what it would do). Add --apply to download + update.
// Run:  node --env-file=.env.hostinger scripts/migrate-images-from-supabase.mjs [--apply]
// Safe to re-run: existing files are skipped, and a row is only rewritten if its file was downloaded OK.
import fs from "fs/promises";
import path from "path";
import mysql from "mysql2/promise";

const APPLY = process.argv.includes("--apply");
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const PREFIX = /^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/media\//i;
const TARGETS = {
  influencers: ["avatar_url"],
  site_settings: ["logo_url", "hero_image", "favicon_url", "default_og_image"],
  seo_pages: ["og_image", "twitter_image"],
};

const db = await mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, database: process.env.DB_NAME, charset: "utf8mb4",
});

/** @type {{table:string, col:string, id:string|number, url:string, rel:string}[]} */
const jobs = [];
for (const [table, cols] of Object.entries(TARGETS)) {
  const [pk] = await db.query(`SHOW KEYS FROM ${table} WHERE Key_name = 'PRIMARY'`);
  const idCol = pk[0].Column_name;
  for (const col of cols) {
    const [rows] = await db.query(`SELECT ${idCol} AS id, ${col} AS url FROM ${table} WHERE ${col} LIKE '%supabase.co/storage/%'`);
    for (const r of rows) {
      if (!PREFIX.test(r.url)) continue;
      // decode so "%20" in the source doesn't become a literal %20 filename; reject path escapes.
      const rel = decodeURIComponent(new URL(r.url).pathname.replace(/^.*\/public\/media\//, ""));
      if (rel.split("/").includes("..")) continue;
      jobs.push({ table, col, idCol, id: r.id, url: r.url, rel });
    }
  }
}
console.log(`${jobs.length} references, ${new Set(jobs.map((j) => j.url)).size} unique files -> ${UPLOAD_DIR}`);
if (!APPLY) {
  for (const j of jobs.slice(0, 10)) console.log(`  ${j.table}.${j.col}: ${j.url}\n    -> /uploads/${j.rel}`);
  console.log("Dry run. Re-run with --apply.");
  await db.end();
  process.exit(0);
}

const ok = new Set();
const failed = [];
for (const url of new Set(jobs.map((j) => j.url))) {
  const rel = jobs.find((j) => j.url === url).rel;
  const dest = path.join(UPLOAD_DIR, rel);
  try {
    if (!(await fs.stat(dest).catch(() => null))) {
      const res = await fetch(url);
      const type = res.headers.get("content-type") || "";
      if (!res.ok || !type.startsWith("image/")) throw new Error(`HTTP ${res.status} ${type}`);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
    }
    ok.add(url);
  } catch (e) {
    failed.push(`${url}  (${e.message})`);
  }
}

let updated = 0;
for (const j of jobs) {
  if (!ok.has(j.url)) continue;
  const [res] = await db.query(`UPDATE ${j.table} SET ${j.col} = ? WHERE ${j.idCol} = ? AND ${j.col} = ?`, [`/uploads/${j.rel}`, j.id, j.url]);
  updated += res.affectedRows;
}
console.log(`downloaded ${ok.size}/${new Set(jobs.map((j) => j.url)).size} files, updated ${updated} rows, failed ${failed.length}`);
for (const f of failed) console.log("  FAILED", f);
await db.end();
