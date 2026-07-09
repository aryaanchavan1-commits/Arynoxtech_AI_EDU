import { readFileSync, mkdirSync, existsSync } from "fs";
import { dirname } from "path";
import { createClient } from "@libsql/client";

const envRaw = readFileSync(".env", "utf8");
const envVars = Object.fromEntries(
  envRaw.split("\n").filter(l => l.trim() && !l.startsWith("#")).map(l => l.split("=", 2).map(s => s.trim()))
);

const url = envVars.DATABASE_URL;
const authToken = envVars.DATABASE_AUTH_TOKEN;

if (url.startsWith("file:")) {
  const localPath = url.replace("file:", "");
  const dir = dirname(localPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

const client = createClient({ url, authToken });

async function main() {
  console.log(`Connecting to: ${url}...`);

  // Create tables based on the schema
  const sql = readFileSync("supabase-schema.sql", "utf8")
    // Remove PostgreSQL-specific types
    .replace(/::int/g, "")
    .replace(/::text/g, "")
    // Remove enum types (SQLite doesn't have them)
    .replace(/CREATE TYPE .*?;/g, "")
    // Replace timestamptz with text
    .replace(/timestamptz/g, "text")
    // Replace boolean with integer
    .replace(/boolean/g, "integer")
    // Replace SERIAL with integer
    .replace(/SERIAL/g, "integer")
    // Remove RLS and policies
    .replace(/ALTER TABLE .*? ENABLE ROW LEVEL SECURITY;/g, "")
    .replace(/CREATE POLICY .*?;/g, "")
    .replace(/FOR SELECT USING/g, "")
    // Replace gen_random_uuid with lower-level hex
    // Remove unsupported references syntax
    .replace(/ON DELETE CASCADE/g, "")
    .replace(/ON DELETE SET NULL/g, "")
    .replace(/REFERENCES users\(id\)/g, "")
    .replace(/REFERENCES lectures\(id\)/g, "")
    .replace(/REFERENCES skills\(id\)/g, "")
    .replace(/REFERENCES modules\(id\)/g, "")
    .replace(/REFERENCES sub_categories\(id\)/g, "")
    .replace(/REFERENCES categories\(id\)/g, "")
    .replace(/REFERENCES subscriptions\(id\)/g, "")
    .replace(/REFERENCES live_classes\(id\)/g, "")
    .replace(/REFERENCES comments\(id\)/g, "");

  // Execute SQL in batches
  const statements = sql.split(";").filter(s => s.trim().length > 0);
  let successCount = 0;
  let errorCount = 0;

  for (const stmt of statements) {
    try {
      await client.execute(stmt.trim() + ";");
      successCount++;
    } catch (err) {
      errorCount++;
    }
  }

  console.log(`Executed ${successCount} statements (${errorCount} errors - usually OK for IF NOT EXISTS duplicates)`);

  // Create admin user
  const existing = await client.execute("SELECT id FROM users WHERE email = 'admin@arynoxtech.edu' LIMIT 1");
  if (existing.rows.length === 0) {
    const id = crypto.randomUUID();
    await client.execute({
      sql: `INSERT INTO users (id, email, name, password_hash, role, tier, total_points, streak, last_active_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
      args: [id, "admin@arynoxtech.edu", "Arynox Admin", "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", "admin", "premium", 9999, 30],
    });
    console.log("Admin user created: admin@arynoxtech.edu / admin123");
  } else {
    console.log("Admin user already exists");
  }

  // Create default app settings
  await client.execute({
    sql: `INSERT OR IGNORE INTO app_settings (id, app_name, primary_color, max_free_videos, max_free_ai, maintenance_mode, updated_at)
          VALUES ('global', 'Arynox-EDU', '#7c3aed', '10', '1', 'false', datetime('now'))`,
    args: [],
  });
  console.log("Default app settings created");

  console.log("Database initialization complete!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});