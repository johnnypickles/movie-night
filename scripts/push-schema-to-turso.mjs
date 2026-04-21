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

const client = createClient({ url, authToken });

// Split on semicolon at end-of-line; strip leading comment lines.
const statements = raw
  .split(/;\s*(?:\r?\n|$)/)
  .map((s) =>
    s
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n")
      .trim()
  )
  .filter((s) => s.length > 0);

console.log(`Applying ${statements.length} statements to ${url}`);

let applied = 0;
let skipped = 0;
const failures = [];

for (const stmt of statements) {
  try {
    await client.execute(stmt);
    applied++;
  } catch (err) {
    const msg = String(err?.message ?? err);
    if (msg.includes("already exists")) {
      skipped++;
    } else {
      failures.push({ stmt, msg });
    }
  }
}

console.log(`Applied: ${applied}, Skipped (already existed): ${skipped}, Failed: ${failures.length}`);
for (const f of failures) {
  console.error("\n--- FAILURE ---");
  console.error(f.stmt);
  console.error("Error:", f.msg);
}
client.close();

if (failures.length > 0) process.exit(1);
