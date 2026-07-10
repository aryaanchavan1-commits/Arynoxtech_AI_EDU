import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

const envRaw = readFileSync(".env", "utf8");
const envVars = Object.fromEntries(
  envRaw.split("\n").filter(l => l.trim() && !l.startsWith("#")).map(l => l.split("=", 2).map(s => s.trim()))
);

const client = createClient({ url: envVars.DATABASE_URL, authToken: envVars.DATABASE_AUTH_TOKEN });

await client.execute(
  "UPDATE app_settings SET bunny_library_id=?, bunny_api_key=?, bunny_cdn_hostname=? WHERE id='global'",
  [envVars.BUNNY_LIBRARY_ID || "700230", envVars.BUNNY_API_KEY || "", envVars.BUNNY_CDN_HOSTNAME || "vz-f10aca55-b0f.b-cdn.net"]
);

console.log("Bunny settings synced from .env to DB");
process.exit(0);
