import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

const envRaw = readFileSync(".env", "utf8");
const envVars = Object.fromEntries(
  envRaw.split("\n").filter(l => l.trim() && !l.startsWith("#")).map(l => l.split("=", 2).map(s => s.trim()))
);

const client = createClient({ url: envVars.DATABASE_URL, authToken: envVars.DATABASE_AUTH_TOKEN });

async function main() {
  // Create admin user
  const existing = await client.execute("SELECT id FROM users WHERE email = 'admin@arynoxtech.edu' LIMIT 1");
  if (existing.rows.length === 0) {
    const id = crypto.randomUUID();
    await client.execute({
      sql: `INSERT INTO users (id, email, name, password_hash, role, tier, total_points, streak, last_active_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
      args: [id, "admin@arynoxtech.edu", "Arynox Admin", "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", "admin", "premium", 9999, 30],
    });
    console.log("Created admin: admin@arynoxtech.edu / admin123");
  } else {
    console.log("Admin already exists");
  }

  await client.execute({
    sql: `INSERT OR IGNORE INTO app_settings (id, app_name, primary_color, max_free_videos, max_free_ai, maintenance_mode, updated_at)
          VALUES ('global', 'Arynox-EDU', '#7c3aed', '10', '1', 'false', datetime('now'))`,
    args: [],
  });
  console.log("Default settings created");
}

main().catch(console.error);