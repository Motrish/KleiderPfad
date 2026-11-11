import { eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "@/lib/db";
import { getContext } from "@/lib/context";
import { getVisibleItem } from "@/lib/access";
import { itemPhotos } from "@/db/schema";
import { uploadDir } from "@/lib/photos";

export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  if(!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id))
    return new Response("Not found",{status:404});
  const ctx=await getContext();
  const [photo]=await db.select().from(itemPhotos).where(eq(itemPhotos.id,id));
  if(!photo || !(await getVisibleItem(photo.itemId,ctx.household.id)))
    return new Response("Not found",{status:404});
  if(!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}\.jpg$/i.test(photo.storageKey))
    return new Response("Not found",{status:404});
  try {
    const bytes=await readFile(join(uploadDir,photo.storageKey));
    return new Response(new Uint8Array(bytes),{headers:{
      "Content-Type":"image/jpeg","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"
    }});
  }catch{return new Response("Not found",{status:404});}
}
