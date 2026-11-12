ALTER TABLE "household_invites" ADD COLUMN "invite_slug" text;--> statement-breakpoint
ALTER TABLE "household_invites" ADD CONSTRAINT "household_invites_invite_slug_unique" UNIQUE("invite_slug");