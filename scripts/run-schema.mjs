import { readFileSync } from "fs";
import { parse } from "path";
import pg from "pg";
const { Pool } = pg;

const envRaw = readFileSync(".env", "utf8");
const envVars = Object.fromEntries(
  envRaw.split("\n").filter(l => l.trim() && !l.startsWith("#")).map(l => l.split("=", 2).map(s => s.trim()))
);

const sql = readFileSync("supabase-schema.sql", "utf8");
const pool = new Pool({
  connectionString: envVars.DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 15000,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("Schema applied successfully");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();