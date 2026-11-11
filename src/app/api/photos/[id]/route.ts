import { and, eq, or } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "@/lib/db";
import { getContext } from "@/lib/context";
import { itemPhotos, items, transfers, packageItems } from "@/db/schema";
import { uploadDir } from "@/lib/photos";

export const dynamic = "force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  if(!/^[\da-f-]{36}$/i.test(id))return new Response("Not found",{status:404});
  const ctx=await getContext();
  const [photo]=await db.select({key:itemPhotos.storageKey}).from(itemPhotos)
    .innerJoin(items,eq(itemPhotos.itemId,items.id))
    .where(and(eq(itemPhotos.id,id),or(eq(items.ownerHouseholdId,ctx.household.id),eq(items.holderHouseholdId,ctx.household.id))));
  if(!photo||!/^[\da-f-]{36}\.jpg$/i.test(photo.key))return new Response("Not found",{status:404});
  try {
    const bytes=await readFile(join(uploadDir,photo.key));
    return new Response(new Uint8Array(bytes),{headers:{"Content-Type":"image/jpeg","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
  }catch{return new Response("Not found",{status:404});}
}
