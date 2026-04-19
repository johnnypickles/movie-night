// Applies prisma/turso-init.sql to a Turso database.
// Usage:
//   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... node scripts/push-schema-to-turso.mjs
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("Missing TURSO_DATABASE_URL env var");
  process.exit(1);
}

const sqlPath = join(__dirname, "..", "prisma", "turso-init.sql");
const raw = readFileSync(sqlPath, "utf8");

// Split on semicolon at end-of-line; skip comments/empty
const statements = raw
  .split(/;\s*(?:\r?\n|$)/)
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith("--"));

const client = createClient({ url, authToken });

console.log(`Applying ${statements.length} statements to ${url}`);

let applied = 0;
let skipped = 0;
for (const stmt of statements) {
  try {
    await client.execute(stmt);
    applied++;
  } catch (err) {
    const msg = String(err?.message ?? err);
    if (msg.includes("already exists")) {
      skipped++;
    } else {
      console.error("Failed:", stmt.slice(0, 80), "\n  ", msg);
      process.exit(1);
    }
  }
}

console.log(`Done. Applied: ${applied}, Skipped (already existed): ${skipped}`);
client.close();
