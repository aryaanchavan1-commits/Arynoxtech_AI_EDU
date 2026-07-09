import { readFileSync } from "fs";
import pg from "pg";
const { Pool } = pg;

const envRaw = readFileSync(".env", "utf8");
const envVars = Object.fromEntries(
  envRaw.split("\n").filter(l => l.trim() && !l.startsWith("#")).map(l => l.split("=", 2).map(s => s.trim()))
);

const pool = new Pool({
  connectionString: envVars.DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 15000,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    // Check if admin exists
    const existing = await client.query("SELECT id FROM users WHERE email = 'admin@arynoxtech.edu'");
    if (existing.rows.length > 0) {
      console.log("Admin user already exists with id:", existing.rows[0].id);
      return;
    }

    // Create admin user with bcrypt hash of "admin123"
    const id = crypto.randomUUID();
    await client.query(
      `INSERT INTO users (id, email, name, password_hash, role, tier, total_points, streak, last_active_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), NOW())`,
      [
        id,
        "admin@arynoxtech.edu",
        "Arynox Admin",
        "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
        "admin",
        "premium",
        9999,
        30,
      ]
    );
    console.log("Admin user created with id:", id);
    console.log("Email: admin@arynoxtech.edu");
    console.log("Password: admin123");

    // Also create a default settings row
    await client.query(
      `INSERT INTO app_settings (id, app_name, primary_color, max_free_videos, max_free_ai, maintenance_mode, updated_at)
       VALUES ('global', 'Arynox-EDU', '#7c3aed', '10', '1', 'false', NOW())
       ON CONFLICT (id) DO NOTHING`
    );
    console.log("Default app settings created");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();