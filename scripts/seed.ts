#!/usr/bin/env npx tsx
import { seedCategories } from "@/lib/seed";
import { db } from "@/lib/db";

async function main() {
  console.log("Seeding categories...");
  const result = await seedCategories();
  console.log(`Inserted: ${result.inserted}, Skipped: ${result.skipped}`);
  await db.$client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});