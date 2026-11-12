import { pgTable, uuid, text, timestamp, boolean, primaryKey, uniqueIndex, index } from "drizzle-orm/pg-core";
const now = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  oidcIssuer: text("oidc_issuer").notNull(),
  oidcSubject: text("oidc_subject").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  createdAt: now(),
}, (t) => [uniqueIndex("users_oidc_identity_unique").on(t.oidcIssuer, t.oidcSubject)]);

export const households = pgTable("households", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: now(),
});
export const householdMembers = pgTable("household_members", {
  householdId: uuid("household_id").notNull().references(() => households.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  role: text("role", { enum: ["owner", "admin", "member"] }).notNull().default("member"),
  createdAt: now(),
}, (t) => [primaryKey({ columns: [t.householdId, t.userId] })]);
export const householdInvites = pgTable("household_invites", {
  token: text("token").primaryKey(),
  householdId: uuid("household_id").notNull().references(() => households.id),
  createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  inviteSlug: text("invite_slug").unique(),
  createdAt: now(),
});

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});
export const items = pgTable("items", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("category_id").references(() => categories.id),
  ownerHouseholdId: uuid("owner_household_id").notNull().references(() => households.id),
  holderHouseholdId: uuid("holder_household_id").notNull().references(() => households.id),
  createdByUserId: uuid("created_by_user_id").references(() => users.id),
  title: text("title").notNull(),
  sizeLabel: text("size_label").notNull(),
  condition: text("condition", { enum: ["new", "very_good", "good", "used", "damaged"] }).notNull().default("good"),
  sourceType: text("source_type", { enum: ["bought", "gift", "received", "unknown"] }).notNull().default("unknown"),
  sourceName: text("source_name"),
  brand: text("brand"),
  color: text("color"),
  notes: text("notes"),
  archived: boolean("archived").notNull().default(false),
  createdAt: now(),
}, (t) => [index("items_owner_idx").on(t.ownerHouseholdId), index("items_holder_idx").on(t.holderHouseholdId)]);
export const itemPhotos = pgTable("item_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  itemId: uuid("item_id").notNull().references(() => items.id),
  storageKey: text("storage_key").notNull().unique(),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: now(),
});

export const packages = pgTable("packages", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id").notNull().references(() => households.id),
  createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  notes: text("notes"),
  status: text("status", { enum: ["draft", "submitted", "closed"] }).notNull().default("draft"),
  createdAt: now(),
});
export const packageItems = pgTable("package_items", {
  packageId: uuid("package_id").notNull().references(() => packages.id),
  itemId: uuid("item_id").notNull().references(() => items.id),
}, (t) => [primaryKey({ columns: [t.packageId, t.itemId] })]);
export const transfers = pgTable("transfers", {
  id: uuid("id").defaultRandom().primaryKey(),
  packageId: uuid("package_id").notNull().unique().references(() => packages.id),
  fromHouseholdId: uuid("from_household_id").notNull().references(() => households.id),
  toHouseholdId: uuid("to_household_id").notNull().references(() => households.id),
  recipientUserId: uuid("recipient_user_id").references(() => users.id),
  type: text("type", { enum: ["gift", "loan"] }).notNull(),
  status: text("status", { enum: ["pending", "accepted", "declined", "cancelled"] }).notNull().default("pending"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  returnedAt: timestamp("returned_at", { withTimezone: true }),
  createdAt: now(),
}, (t) => [index("transfers_to_idx").on(t.toHouseholdId)]);
export const itemEvents = pgTable("item_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  itemId: uuid("item_id").notNull().references(() => items.id),
  transferId: uuid("transfer_id").references(() => transfers.id),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  eventType: text("event_type").notNull(),
  details: text("details"),
  createdAt: now(),
}, (t) => [index("item_events_item_idx").on(t.itemId, t.createdAt)]);
export const connections = pgTable("connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdAId: uuid("household_a_id").notNull().references(() => households.id),
  householdBId: uuid("household_b_id").notNull().references(() => households.id),
  requestedByHouseholdId: uuid("requested_by_household_id").notNull().references(() => households.id),
  status: text("status", { enum: ["pending", "accepted", "blocked"] }).notNull().default("pending"),
  createdAt: now(),
}, (t) => [uniqueIndex("connections_pair_unique").on(t.householdAId, t.householdBId)]);
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  body: text("body"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: now(),
});
