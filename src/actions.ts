"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { and, eq, or, inArray, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getContext } from "@/lib/context";
import { required, value, uuid } from "@/lib/validation";
import { storePhoto } from "@/lib/photos";
import {
  users, households, householdMembers, householdInvites, items, itemPhotos, itemEvents,
  packages, packageItems, transfers, connections, notifications,
} from "@/db/schema";

async function setActive(id: string) {
  (await cookies()).set("kp_household", id, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 365 * 24 * 60 * 60,
  });
}
function checkRole(role: string) {
  if (role !== "owner" && role !== "admin") throw new Error("Nur Haushalts-Administratoren erlaubt.");
}
function assertOwned(item: typeof items.$inferSelect | undefined, householdId: string) {
  if (!item || item.ownerHouseholdId !== householdId || item.holderHouseholdId !== householdId || item.archived) {
    throw new Error("Kleidungsstück ist nicht im eigenen Bestand verfügbar.");
  }
}
async function notifyHousehold(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], householdId: string, title: string, body: string) {
  const members = await tx.select({ userId: householdMembers.userId }).from(householdMembers)
    .where(eq(householdMembers.householdId, householdId));
  if (members.length) await tx.insert(notifications).values(members.map((m) => ({ userId: m.userId, title, body })));
}
export async function selectHousehold(form: FormData) {
  const ctx = await getContext();
  const id = uuid(required(form, "householdId"));
  if (!ctx.memberships.some((m) => m.id === id)) throw new Error("Keine Mitgliedschaft.");
  await setActive(id);
  redirect("/");
}
export async function createHousehold(form: FormData) {
  const ctx = await getContext();
  const name = required(form, "name", 100);
  const [created] = await db.transaction(async (tx) => {
    const h = await tx.insert(households).values({ name }).returning();
    await tx.insert(householdMembers).values({ householdId: h[0].id, userId: ctx.user.id, role: "owner" });
    return h;
  });
  await setActive(created.id);
  redirect("/family");
}
export async function renameHousehold(form:FormData) {
  const ctx=await getContext();
  checkRole(ctx.household.role);
  const name=required(form,"name",100);
  await db.update(households).set({name}).where(eq(households.id,ctx.household.id));
  revalidatePath("/family");
  revalidatePath("/");
}

export async function createInvite() {
  const ctx = await getContext();
  checkRole(ctx.household.role);
  const token = randomBytes(18).toString("hex");
  const inviteSlug = randomBytes(12).toString("base64url");
  await db.insert(householdInvites).values({
    token, householdId: ctx.household.id, createdByUserId: ctx.user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    inviteSlug,
  });
  revalidatePath("/family");
}
export async function joinHousehold(form: FormData) {
  const ctx = await getContext();
  const token = required(form, "inviteCode", 100);
  const joined = await db.transaction(async (tx) => {
    const [inv] = await tx.select().from(householdInvites)
      .where(eq(householdInvites.token, token)).for("update");
    if (!inv || inv.usedAt || inv.expiresAt < new Date()) throw new Error("Einladung ungültig oder abgelaufen.");
    await tx.insert(householdMembers).values({
      householdId: inv.householdId, userId: ctx.user.id, role: "member",
    }).onConflictDoNothing();
    await tx.update(householdInvites).set({ usedAt: new Date() }).where(eq(householdInvites.token, token));
    return inv.householdId;
  });
  await setActive(joined);
  redirect("/family");
}
export async function requestConnection(form: FormData) {
  const ctx = await getContext();
  checkRole(ctx.household.role);
  const targetId = uuid(required(form, "householdId"));
  if (targetId === ctx.household.id) throw new Error("Ein Haushalt kann sich nicht selbst verbinden.");
  const exists = await db.select({ id: households.id }).from(households).where(eq(households.id, targetId)).limit(1);
  if (!exists.length) throw new Error("Haushalt nicht gefunden.");
  const [a,b] = [ctx.household.id, targetId].sort();
  const old = await db.select().from(connections).where(and(eq(connections.householdAId,a),eq(connections.householdBId,b))).limit(1);
  if (old.length) throw new Error("Verbindung existiert bereits.");
  // A = requester even if the UUID sort order differs; the canonical pair is stored via sorted IDs.
  await db.insert(connections).values({ householdAId:a,householdBId:b,requestedByHouseholdId:ctx.household.id,status:"pending" });
  await db.insert(notifications).values(
    (await db.select({userId:householdMembers.userId}).from(householdMembers).where(eq(householdMembers.householdId,targetId)))
      .map(x=>({userId:x.userId,title:"Neue Kontaktanfrage",body:ctx.household.name+" möchte sich verbinden."}))
  ).onConflictDoNothing();
  revalidatePath("/family");
}
export async function acceptConnection(form: FormData) {
  const ctx = await getContext();
  checkRole(ctx.household.role);
  const id = uuid(required(form,"id"));
  const [conn] = await db.select().from(connections).where(eq(connections.id,id));
  if (!conn || conn.status !== "pending" || conn.requestedByHouseholdId === ctx.household.id || (conn.householdAId!==ctx.household.id && conn.householdBId!==ctx.household.id)) throw new Error("Keine Berechtigung.");
  await db.update(connections).set({status:"accepted"}).where(and(eq(connections.id,id),eq(connections.status,"pending")));
  revalidatePath("/family");
}

export async function createItem(form: FormData) {
  const ctx = await getContext();
  const title=required(form,"title",100), sizeLabel=required(form,"size",25);
  const condition=value(form,"condition",25);
  const sourceType=value(form,"sourceType",25);
  if(!["new","very_good","good","used","damaged"].includes(condition)) throw new Error("Ungültiger Zustand.");
  if(!["bought","gift","received","unknown"].includes(sourceType)) throw new Error("Ungültige Herkunft.");
  const file=form.get("photo");
  let filename: string | null = null;
  if (file instanceof File && file.size) filename = await storePhoto(file);
  const [created] = await db.transaction(async(tx)=>{
    const created=await tx.insert(items).values({
      title,sizeLabel,condition:condition as typeof items.$inferInsert.condition,
      sourceType:sourceType as typeof items.$inferInsert.sourceType,
      sourceName:value(form,"sourceName",150)||null,
      brand:value(form,"brand",100)||null,color:value(form,"color",70)||null,
      notes:value(form,"notes",1000)||null,
      ownerHouseholdId:ctx.household.id,holderHouseholdId:ctx.household.id,createdByUserId:ctx.user.id,
    }).returning();
    await tx.insert(itemEvents).values({itemId:created[0].id,actorUserId:ctx.user.id,eventType:"created"});
    if(filename) await tx.insert(itemPhotos).values({itemId:created[0].id,storageKey:filename,isPrimary:true});
    return created;
  });
  revalidatePath("/wardrobe");
  redirect("/wardrobe/"+created.id);
}
export async function updateItem(id: string,form:FormData) {
  const ctx=await getContext();uuid(id);
  const title=required(form,"title",100),sizeLabel=required(form,"size",25);
  const condition=value(form,"condition",25);
  if(!["new","very_good","good","used","damaged"].includes(condition))throw new Error("Ungültiger Zustand.");
  await db.transaction(async(tx)=>{
    const [item]=await tx.select().from(items).where(eq(items.id,id)).for("update");
    assertOwned(item,ctx.household.id);
    await tx.update(items).set({
      title,sizeLabel,condition:condition as typeof items.$inferInsert.condition,
      brand:value(form,"brand",100)||null,color:value(form,"color",70)||null,
      notes:value(form,"notes",1000)||null,
    }).where(eq(items.id,id));
    await tx.insert(itemEvents).values({itemId:id,eventType:"updated",actorUserId:ctx.user.id});
  });
  revalidatePath("/wardrobe/"+id);
}
export async function addPhoto(id:string,form:FormData) {
  const ctx=await getContext();uuid(id);
  const file=form.get("photo");
  if(!(file instanceof File)||!file.size)throw new Error("Bitte ein Foto wählen.");
  const filename=await storePhoto(file);
  await db.transaction(async(tx)=>{
    const [item]=await tx.select().from(items).where(eq(items.id,id)).for("update");
    assertOwned(item,ctx.household.id);
    const existing=await tx.select({id:itemPhotos.id}).from(itemPhotos).where(eq(itemPhotos.itemId,id)).limit(1);
    await tx.insert(itemPhotos).values({itemId:id,storageKey:filename,isPrimary:existing.length===0});
  });
  revalidatePath("/wardrobe/"+id);
}
export async function archiveItem(id:string) {
  const ctx=await getContext();uuid(id);
  await db.transaction(async(tx)=>{
    const [item]=await tx.select().from(items).where(eq(items.id,id)).for("update");
    assertOwned(item,ctx.household.id);
    const busy=await tx.select({id:transfers.id}).from(packageItems)
      .innerJoin(transfers,eq(transfers.packageId,packageItems.packageId))
      .where(and(eq(packageItems.itemId,id),eq(transfers.status,"pending"))).limit(1);
    if(busy.length)throw new Error("Kleidungsstück ist bereits in einer offenen Übergabe.");
    await tx.update(items).set({archived:true}).where(eq(items.id,id));
    await tx.insert(itemEvents).values({itemId:id,eventType:"archived",actorUserId:ctx.user.id});
  });
  redirect("/wardrobe");
}

export async function createPackage(form:FormData) {
  const ctx=await getContext();
  const [p]=await db.insert(packages).values({
    householdId:ctx.household.id,createdByUserId:ctx.user.id,
    title:required(form,"title",120),notes:value(form,"notes",1000)||null,
  }).returning();
  redirect("/packages/"+p.id);
}
export async function addPackageItem(packageId:string,form:FormData) {
  const ctx=await getContext();uuid(packageId);const itemId=uuid(required(form,"itemId"));
  await db.transaction(async(tx)=>{
    const [p]=await tx.select().from(packages).where(eq(packages.id,packageId)).for("update");
    if(!p || p.householdId!==ctx.household.id || p.status!=="draft") throw new Error("Paket nicht bearbeitbar.");
    const [item]=await tx.select().from(items).where(eq(items.id,itemId)).for("update");
    assertOwned(item,ctx.household.id);
    const busy=await tx.select({id:transfers.id}).from(packageItems)
      .innerJoin(transfers,eq(transfers.packageId,packageItems.packageId))
      .where(and(eq(packageItems.itemId,itemId),eq(transfers.status,"pending"))).limit(1);
    if(busy.length)throw new Error("Kleidungsstück ist bereits in einer offenen Übergabe.");
    await tx.insert(packageItems).values({packageId,itemId}).onConflictDoNothing();
  });
  revalidatePath("/packages/"+packageId);
}
export async function removePackageItem(packageId:string,form:FormData) {
  const ctx=await getContext();uuid(packageId);const itemId=uuid(required(form,"itemId"));
  await db.transaction(async(tx)=>{
    const [p]=await tx.select().from(packages).where(eq(packages.id,packageId)).for("update");
    if(!p || p.householdId!==ctx.household.id || p.status!=="draft")throw new Error("Paket nicht bearbeitbar.");
    await tx.delete(packageItems).where(and(eq(packageItems.packageId,packageId),eq(packageItems.itemId,itemId)));
  });
  revalidatePath("/packages/"+packageId);
}
export async function sendPackage(packageId:string,form:FormData) {
  const ctx=await getContext();uuid(packageId);
  const recipient=uuid(required(form,"recipient"));
  const type=value(form,"type");
  if(!["gift","loan"].includes(type))throw new Error("Ungültige Übergabeart.");
  if(recipient===ctx.household.id)throw new Error("Empfänger muss ein anderer Haushalt sein.");
  const dueText=value(form,"dueAt");
  const dueAt=type==="loan" && dueText ? new Date(dueText+"T12:00:00") : null;
  if(dueAt && (!Number.isFinite(dueAt.getTime()) || dueAt<new Date()))throw new Error("Ungültiges Rückgabedatum.");
  const [a,b]=[ctx.household.id,recipient].sort();
  const [link]=await db.select().from(connections).where(and(
    eq(connections.householdAId,a),eq(connections.householdBId,b),eq(connections.status,"accepted")
  ));
  if(!link)throw new Error("Haushalte müssen zunächst verbunden sein.");

  await db.transaction(async(tx)=>{
    const [p]=await tx.select().from(packages).where(eq(packages.id,packageId)).for("update");
    if(!p || p.householdId!==ctx.household.id || p.status!=="draft")throw new Error("Paket nicht bearbeitbar.");
    const contents=await tx.select({itemId:packageItems.itemId}).from(packageItems)
      .where(eq(packageItems.packageId,packageId));
    if(!contents.length)throw new Error("Paket ist leer.");
    const ids=contents.map(c=>c.itemId);
    const locked=await tx.select().from(items).where(inArray(items.id,ids)).orderBy(items.id).for("update");
    if(locked.length!==ids.length)throw new Error("Ein Kleidungsstück fehlt.");
    locked.forEach(item=>assertOwned(item,ctx.household.id));
    const busy=await tx.select({id:transfers.id}).from(packageItems)
      .innerJoin(transfers,eq(transfers.packageId,packageItems.packageId))
      .where(and(inArray(packageItems.itemId,ids),eq(transfers.status,"pending"))).limit(1);
    if(busy.length)throw new Error("Ein Teil befindet sich bereits in einer offenen Übergabe.");
    const [created]=await tx.insert(transfers).values({
      packageId,fromHouseholdId:ctx.household.id,toHouseholdId:recipient,
      type:type as "gift"|"loan",dueAt,
    }).returning();
    await tx.update(packages).set({status:"submitted"}).where(eq(packages.id,packageId));
    await tx.insert(itemEvents).values(ids.map(itemId=>({
      itemId,transferId:created.id,actorUserId:ctx.user.id,eventType:"transfer_requested",
    })));
    await notifyHousehold(tx,recipient,"Neues Kleiderpaket",ctx.household.name+" hat dir ein Paket geschickt.");
  });
  revalidatePath("/packages");
  redirect("/transfers");
}
export async function decideTransfer(transferId:string,decision:"accepted"|"declined") {
  const ctx=await getContext();uuid(transferId);
  if(!["accepted","declined"].includes(decision))throw new Error("Ungültige Entscheidung.");
  await db.transaction(async(tx)=>{
    const [t]=await tx.select().from(transfers).where(eq(transfers.id,transferId)).for("update");
    if(!t || t.toHouseholdId!==ctx.household.id || t.status!=="pending")throw new Error("Übergabe nicht verfügbar.");
    const members=await tx.select({id:packageItems.itemId}).from(packageItems)
      .where(eq(packageItems.packageId,t.packageId));
    const ids=members.map(x=>x.id);
    if(decision==="accepted") {
      const locked=await tx.select().from(items).where(inArray(items.id,ids)).orderBy(items.id).for("update");
      if(!ids.length || locked.length!==ids.length)throw new Error("Paketinhalt ungültig.");
      locked.forEach(item=>assertOwned(item,t.fromHouseholdId));
      for(const item of locked) {
        await tx.update(items).set({
          holderHouseholdId:t.toHouseholdId,
          ownerHouseholdId:t.type==="gift"?t.toHouseholdId:t.fromHouseholdId,
        }).where(eq(items.id,item.id));
      }
    }
    await tx.update(transfers).set({status:decision,acceptedAt:decision==="accepted"?new Date():null})
      .where(eq(transfers.id,transferId));
    await tx.update(packages).set({status:"closed"}).where(eq(packages.id,t.packageId));
    if(ids.length)await tx.insert(itemEvents).values(ids.map(itemId=>({
      itemId,transferId,actorUserId:ctx.user.id,eventType:decision==="accepted"?"transfer_accepted":"transfer_declined",
    })));
    await notifyHousehold(tx,t.fromHouseholdId,
      decision==="accepted"?"Paket angenommen":"Paket abgelehnt",
      ctx.household.name+(decision==="accepted"?" hat die Übergabe bestätigt.":" hat die Übergabe abgelehnt."));
  });
  revalidatePath("/transfers");
  revalidatePath("/wardrobe");
}
export async function returnLoan(transferId:string) {
  const ctx=await getContext();uuid(transferId);
  await db.transaction(async(tx)=>{
    const [t]=await tx.select().from(transfers).where(eq(transfers.id,transferId)).for("update");
    if(!t || t.type!=="loan" || t.status!=="accepted" || t.returnedAt || t.toHouseholdId!==ctx.household.id)
      throw new Error("Keine offene Leihgabe gefunden.");
    const members=await tx.select({id:packageItems.itemId}).from(packageItems)
      .where(eq(packageItems.packageId,t.packageId));
    const locked=await tx.select().from(items).where(inArray(items.id,members.map(x=>x.id))).orderBy(items.id).for("update");
    if(!locked.length || locked.length!==members.length || locked.some(x=>x.ownerHouseholdId!==t.fromHouseholdId||x.holderHouseholdId!==t.toHouseholdId))
      throw new Error("Leihgabe kann nicht zurückgebucht werden.");
    for(const item of locked)await tx.update(items).set({holderHouseholdId:t.fromHouseholdId}).where(eq(items.id,item.id));
    await tx.update(transfers).set({returnedAt:new Date()}).where(eq(transfers.id,transferId));
    await tx.insert(itemEvents).values(locked.map(x=>({
      itemId:x.id,transferId,actorUserId:ctx.user.id,eventType:"loan_returned",
    })));
    await notifyHousehold(tx,t.fromHouseholdId,"Kleidung zurückgegeben",ctx.household.name+" hat die Rückgabe bestätigt.");
  });
  revalidatePath("/transfers");
  revalidatePath("/wardrobe");
}

export async function markNotificationRead(form:FormData) {
  const ctx=await getContext();const id=uuid(required(form,"id"));
  await db.update(notifications).set({isRead:true}).where(and(eq(notifications.id,id),eq(notifications.userId,ctx.user.id)));
  revalidatePath("/notifications");
}
