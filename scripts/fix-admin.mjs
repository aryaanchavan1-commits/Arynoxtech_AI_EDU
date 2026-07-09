import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import bcrypt from "bcryptjs";

const envRaw = readFileSync(".env", "utf8");
const envVars = Object.fromEntries(
  envRaw.split("\n").filter(l => l.trim() && !l.startsWith("#")).map(l => l.split("=", 2).map(s => s.trim()))
);

const client = createClient({ url: envVars.DATABASE_URL, authToken: envVars.DATABASE_AUTH_TOKEN });

async function main() {
  const hash = await bcrypt.hash("admin123", 10);
  console.log("New hash:", hash);

  const existing = await client.execute("SELECT id, email, password_hash FROM users WHERE email = 'admin@arynoxtech.edu' LIMIT 1");
  if (existing.rows.length > 0) {
    const oldHash = existing.rows[0].password_hash;
    await client.execute({
      sql: `UPDATE users SET password_hash = ?, name = 'Arynox Admin', role = 'admin', tier = 'premium' WHERE email = 'admin@arynoxtech.edu'`,
      args: [hash],
    });
    console.log("Updated admin password hash");
    console.log("Old hash:", oldHash);
    console.log("New hash:", hash);
  } else {
    const id = crypto.randomUUID();
    await client.execute({
      sql: `INSERT INTO users (id, email, name, password_hash, role, tier, total_points, streak, last_active_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
      args: [id, "admin@arynoxtech.edu", "Arynox Admin", hash, "admin", "premium", 9999, 30],
    });
    console.log("Created admin user");
  }
  console.log("Done");
}

main().catch(console.error);