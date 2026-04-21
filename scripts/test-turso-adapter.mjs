// Does PRISMA actually use the Turso adapter?
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("Missing TURSO_DATABASE_URL");
  process.exit(1);
}

console.log("URL:", url);
console.log("Token length:", authToken?.length);

const adapter = new PrismaLibSQL({ url, authToken });
const prisma = new PrismaClient({ adapter });

try {
  const count = await prisma.user.count();
  console.log("SUCCESS — User count via Prisma:", count);
} catch (err) {
  console.error("FAILED:", err.message);
} finally {
  await prisma.$disconnect();
}
