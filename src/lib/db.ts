import mysql, { type Pool, type ResultSetHeader } from "mysql2/promise";

/** true when DB_NAME is configured; otherwise the app falls back to seed data (demo mode). */
export const dbEnabled = Boolean(process.env.DB_NAME);

const g = globalThis as unknown as { __pool?: Pool };

function pool(): Pool {
  if (!g.__pool) {
    g.__pool = mysql.createPool({
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME,
      charset: "utf8mb4",
      connectionLimit: 10,
      decimalNumbers: true,
      timezone: "Z",
      // TINYINT(1) -> boolean, DATETIME -> ISO string (stored as UTC), so rows match types.ts.
      typeCast(field, next) {
        if (field.type === "TINY" && field.length === 1) {
          const v = field.string();
          return v === null ? null : v === "1";
        }
        if (field.type === "DATETIME" || field.type === "TIMESTAMP") {
          const v = field.string();
          return v ? `${v.replace(" ", "T")}Z` : null;
        }
        return next();
      },
    });
    g.__pool.on("connection", (c) => c.query("SET time_zone = '+00:00'"));
  }
  return g.__pool;
}

let migrated: Promise<void> | undefined;
/** يضيف أعمدة الباقات لقاعدة قديمة مرة واحدة لكل عملية (ADD COLUMN لا يمس البيانات الموجودة). */
function ensureSchema() {
  return (migrated ??= (async () => {
    try {
      const [cols] = await pool().query("SHOW COLUMNS FROM influencers LIKE 'plan'");
      if ((cols as unknown[]).length === 0) {
        await pool().query(
          "ALTER TABLE influencers ADD COLUMN plan ENUM('free','pro','vip') NOT NULL DEFAULT 'free', ADD COLUMN plan_expires_at DATETIME NULL"
        );
      }
    } catch (e) {
      console.error("ensureSchema:", e);
    }
  })());
}

/** SELECT -> plain objects (mysql2 row classes can't cross the server/client component boundary). */
export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  await ensureSchema();
  const [rows] = await pool().query(sql, params);
  return (rows as Record<string, unknown>[]).map((r) => ({ ...r })) as T[];
}

/** INSERT/UPDATE/DELETE -> affected row count. */
export async function exec(sql: string, params: unknown[] = []): Promise<number> {
  await ensureSchema();
  const [res] = await pool().query<ResultSetHeader>(sql, params);
  return res.affectedRows;
}

/** Run several statements atomically. */
export async function transaction<T>(fn: (run: (sql: string, params?: unknown[]) => Promise<number>) => Promise<T>): Promise<T> {
  const conn = await pool().getConnection();
  try {
    await conn.beginTransaction();
    const out = await fn(async (sql, params = []) => {
      const [res] = await conn.query<ResultSetHeader>(sql, params);
      return res.affectedRows;
    });
    await conn.commit();
    return out;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/** MySQL duplicate-key error (unique slug / email / path). */
export function isDuplicate(e: unknown): boolean {
  return (e as { code?: string })?.code === "ER_DUP_ENTRY";
}

/** JSON columns come back as objects on MySQL but as strings on MariaDB (JSON = LONGTEXT). */
export function parseJson<T>(v: unknown, fallback: T): T {
  if (v === null || v === undefined) return fallback;
  if (typeof v !== "string") return v as T;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}
