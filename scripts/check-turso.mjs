import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

const envRaw = readFileSync(".env", "utf8");
const envVars = Object.fromEntries(
  envRaw.split("\n").filter(l => l.trim() && !l.startsWith("#")).map(l => l.split("=", 2).map(s => s.trim()))
);

const client = createClient({ url: envVars.DATABASE_URL, authToken: envVars.DATABASE_AUTH_TOKEN });

async function main() {
  const users = await client.execute("SELECT id, email, role FROM users LIMIT 5");
  console.log("Users:", JSON.stringify(users.rows, null, 2));

  const settings = await client.execute("SELECT id, app_name FROM app_settings LIMIT 1");
  console.log("Settings:", JSON.stringify(settings.rows, null, 2));

  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log("Tables:", tables.rows.map(r => r.name).join(", "));
}

main().catch((err) => {
  console.error("Error:", err.message);
});