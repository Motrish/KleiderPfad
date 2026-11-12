import { db } from "@/lib/db";
import { categories } from "@/db/schema";

export const defaultCategories = [
  { name: "Bodys & Strampler", slug: "bodys-strampler" },
  { name: "Oberteile", slug: "oberteile" },
  { name: "Hosen & Leggings", slug: "hosen-leggings" },
  { name: "Kleider & Röcke", slug: "kleider-roecke" },
  { name: "Jacken & Mäntel", slug: "jacken-maentel" },
  { name: "Schlafanzüge", slug: "schlafanzuege" },
  { name: "Unterwäsche & Socken", slug: "unterwaesche-socken" },
  { name: "Schuhe", slug: "schuhe" },
  { name: "Mützen & Accessoires", slug: "muetzen-accessoires" },
  { name: "Sonstiges", slug: "sonstiges" },
];

export async function seedCategories() {
  const existing = await db.select({ slug: categories.slug }).from(categories);
  const existingSlugs = new Set(existing.map((c) => c.slug));
  const toInsert = defaultCategories.filter((c) => !existingSlugs.has(c.slug));
  if (toInsert.length) {
    await db.insert(categories).values(toInsert);
  }
  return { inserted: toInsert.length, skipped: existing.length };
}