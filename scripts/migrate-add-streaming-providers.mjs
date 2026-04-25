// Adds streamingProviders to SurveyResponse on Turso.
// Usage: node --env-file=.env.local scripts/migrate-add-streaming-providers.mjs
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
    `ALTER TABLE "SurveyResponse" ADD COLUMN "streamingProviders" TEXT NOT NULL DEFAULT '[]'`
  );
  console.log("Added streamingProviders column to SurveyResponse.");
} catch (err) {
  const msg = String(err?.message ?? err);
  if (msg.includes("duplicate column")) {
    console.log("Column already exists — skipping.");
  } else {
    console.error("Failed:", msg);
    process.exit(1);
  }
}
client.close();
