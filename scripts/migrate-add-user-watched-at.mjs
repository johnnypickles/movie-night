// Adds the userWatchedAt column to WatchHistory on Turso.
// Usage: node --env-file=.env.local scripts/migrate-add-user-watched-at.mjs
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error("Missing TURSO_DATABASE_URL");
  process.exit(1);
}

const client = createClient({ url, authToken });

try {
  await client.execute(
    `ALTER TABLE "WatchHistory" ADD COLUMN "userWatchedAt" DATETIME`
  );
  console.log("Added userWatchedAt column to WatchHistory.");
} catch (err) {
  const msg = String(err?.message ?? err);
  if (msg.includes("duplicate column")) {
    console.log("Column userWatchedAt already exists — skipping.");
  } else {
    console.error("Failed:", msg);
    process.exit(1);
  }
}
client.close();
