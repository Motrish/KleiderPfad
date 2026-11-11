import "server-only";
import { and, eq, or, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { items, transfers, packageItems } from "@/db/schema";

export async function getVisibleItem(itemId:string, householdId:string) {
  const [item]=await db.select().from(items).where(eq(items.id,itemId));
  if(!item)return null;
  if(item.ownerHouseholdId===householdId||item.holderHouseholdId===householdId)return item;
  // A recipient of a pending packet or a participant in a completed
  // transfer can still identify this physical item and see its history.
  const [involved]=await db.select({id:transfers.id}).from(packageItems)
    .innerJoin(transfers,eq(transfers.packageId,packageItems.packageId))
    .where(and(eq(packageItems.itemId,itemId),inArray(transfers.status,["pending","accepted"]),
      or(eq(transfers.fromHouseholdId,householdId),eq(transfers.toHouseholdId,householdId))))
    .limit(1);
  return involved?item:null;
}
