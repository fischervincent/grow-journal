ALTER TABLE "plants" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "plants_slug_user_id_idx" ON "plants" USING btree ("slug","user_id");