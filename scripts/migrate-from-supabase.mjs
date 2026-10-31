// One-off: loads the Supabase *_rows.sql dumps into MySQL, then copies avatar images into UPLOAD_DIR.
// Idempotent (INSERT IGNORE; image step only touches rows that still point at supabase.co).
// Usage: node --env-file=.env.local scripts/migrate-from-supabase.mjs ../
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

const dumpDir = path.resolve(process.argv[2] || "..");
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

/** Parses `INSERT INTO t (cols) VALUES (...),(...);` statements (Postgres dump: only '' escapes in strings). */
function parseDump(sql) {
  const out = [];
  const head = /INSERT INTO ([\w."]+) \(([^)]*)\) VALUES/g;
  let m;
  while ((m = head.exec(sql))) {
    const cols = m[2].split(",").map((c) => c.trim().replace(/"/g, ""));
    let i = head.lastIndex;
    const rows = [];
    let row = null, tok = "";
    const push = () => {
      const t = tok.trim();
      row.push(t === "null" ? null : t === "true" ? 1 : t === "false" ? 0 : /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : t);
      tok = "";
    };
    for (; i < sql.length; i++) {
      const c = sql[i];
      if (c === "'") { // string literal
        let s = "";
        for (i++; ; i++) {
          if (sql[i] === "'" && sql[i + 1] === "'") { s += "'"; i++; } else if (sql[i] === "'") break; else s += sql[i];
        }
        row.push(s); tok = "";
        // a quoted value is complete; swallow until the next , or )
        continue;
      }
      if (c === "(" && !row) { row = []; continue; }
      if (!row) { if (c === ";") break; continue; }
      if (c === ",") { if (tok.trim()) push(); continue; }
      if (c === ")") { if (tok.trim()) push(); rows.push(Object.fromEntries(cols.map((k, j) => [k, row[j]]))); row = null; continue; }
      tok += c;
    }
    out.push({ table: m[1].replace(/"/g, "").replace(/^(public|auth)\./, ""), rows });
    head.lastIndex = i;
  }
  return out;
}

const ts = (v) => {
  if (!v) return null;
  const m = String(v).match(/^(\d{4}-\d\d-\d\d)[ T](\d\d:\d\d:\d\d)(\.\d+)?([+-]\d\d)(?::?(\d\d))?$/);
  if (!m) return v;
  return new Date(`${m[1]}T${m[2]}${m[3] || ""}${m[4]}:${m[5] || "00"}`).toISOString().slice(0, 19).replace("T", " ");
};

const db = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,
  charset: "utf8mb4",
});
await db.query("SET time_zone = '+00:00'");

const TS_COLS = new Set(["created_at", "updated_at"]);
const targets = { users: "users", influencers: "influencers", ad_requests: "ad_requests", seo_pages: "seo_pages", site_settings: "site_settings" };
const order = ["users", "influencers", "ad_requests", "seo_pages", "site_settings"];

const parsed = [];
for (const f of fs.readdirSync(dumpDir).filter((f) => f.endsWith("_rows.sql"))) {
  parsed.push(...parseDump(fs.readFileSync(path.join(dumpDir, f), "utf8")));
}
for (const name of order) {
  for (const { table, rows } of parsed.filter((p) => p.table === (name === "users" ? "users" : name))) {
    if (!targets[table]) continue;
    let n = 0;
    for (const r of rows) {
      let rec = r;
      if (table === "users") {
        if (!r.email || !r.encrypted_password) continue;
        rec = { id: r.id, email: String(r.email).toLowerCase(), password_hash: r.encrypted_password, created_at: r.created_at };
      }
      const cols = Object.keys(rec);
      const vals = cols.map((c) => (TS_COLS.has(c) ? ts(rec[c]) : rec[c]));
      const [res] = await db.query(`INSERT IGNORE INTO ${table} (${cols.join(",")}) VALUES (?)`, [vals]);
      n += res.affectedRows;
    }
    console.log(`${table}: ${n}/${rows.length} rows imported`);
  }
}

// ---- images: supabase storage -> UPLOAD_DIR/avatars, rewrite avatar_url ----
const [inf] = await db.query("SELECT id, avatar_url FROM influencers WHERE avatar_url LIKE '%.supabase.co/storage/%'");
let ok = 0, failed = 0;
for (const { id, avatar_url } of inf) {
  const file = path.basename(new URL(avatar_url).pathname);
  const res = await fetch(avatar_url).catch(() => null);
  if (!res || !res.ok) { failed++; continue; }
  fs.mkdirSync(path.join(uploadDir, "avatars"), { recursive: true });
  fs.writeFileSync(path.join(uploadDir, "avatars", file), Buffer.from(await res.arrayBuffer()));
  await db.query("UPDATE influencers SET avatar_url = ? WHERE id = ?", [`/uploads/avatars/${file}`, id]);
  ok++;
}
console.log(`images: ${ok} copied, ${failed} failed${failed ? " (Supabase storage still restricted? re-run later)" : ""}`);
await db.end();
