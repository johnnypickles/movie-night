// Adds the passwordHash column to the User table on Turso.
// Usage: node --env-file=.env.local scripts/migrate-add-password.mjs
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error("Missing TURSO_DATABASE_URL");
  process.exit(1);
}

const client = createClient({ url, authToken });

try {
  await client.execute(`ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT`);
  console.log("Added passwordHash column to User.");
} catch (err) {
  const msg = String(err?.message ?? err);
  if (msg.includes("duplicate column")) {
    console.log("Column passwordHash already exists — skipping.");
  } else {
    console.error("Failed:", msg);
    process.exit(1);
  }
}
client.close();
