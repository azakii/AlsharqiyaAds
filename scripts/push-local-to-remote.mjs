// Copies the local MySQL database to the one in DB_* (run with --env-file pointing at the remote creds).
// Applies db/schema.sql first, then copies rows (INSERT IGNORE, so re-running is safe).
import fs from "fs";
import mysql from "mysql2/promise";

const local = await mysql.createConnection({ host: "127.0.0.1", user: "root", database: "alsharqiya", dateStrings: true });
const remote = await mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, database: process.env.DB_NAME, charset: "utf8mb4", multipleStatements: true,
});
await remote.query(fs.readFileSync("db/schema.sql", "utf8"));
for (const t of ["users", "influencers", "ad_requests", "seo_pages", "site_settings"]) {
  const [rows] = await local.query(`SELECT * FROM ${t}`);
  let n = 0;
  for (const r of rows) {
    const cols = Object.keys(r);
    const vals = cols.map((c) => (r[c] !== null && typeof r[c] === "object" ? JSON.stringify(r[c]) : r[c]));
    const [res] = await remote.query(`INSERT IGNORE INTO ${t} (${cols.join(",")}) VALUES (?)`, [vals]);
    n += res.affectedRows;
  }
  const [[c]] = await remote.query(`SELECT COUNT(*) n FROM ${t}`);
  console.log(`${t}: local ${rows.length}, copied ${n}, remote now ${c.n}`);
}
await local.end(); await remote.end();
