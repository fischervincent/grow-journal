ALTER TABLE "plants" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
CREATE INDEX "plants_active_user_id_idx" ON "plants" USING btree ("user_id") WHERE "plants"."deleted_at" IS NULL;