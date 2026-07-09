import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

const envRaw = readFileSync(".env", "utf8");
const envVars = Object.fromEntries(
  envRaw.split("\n").filter(l => l.trim() && !l.startsWith("#")).map(l => l.split("=", 2).map(s => s.trim()))
);

const client = createClient({ url: envVars.DATABASE_URL, authToken: envVars.DATABASE_AUTH_TOKEN });

async function main() {
  try {
    await client.execute("ALTER TABLE users ADD COLUMN subscription_expires_at text");
    console.log("Added subscription_expires_at column");
  } catch {
    console.log("Column may already exist");
  }
  console.log("Migration complete");
}

main().catch(console.error);