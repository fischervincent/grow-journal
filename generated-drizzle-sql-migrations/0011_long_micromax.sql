CREATE TABLE "plant_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plant_id" uuid NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plants" ADD COLUMN "main_photo_id" uuid;--> statement-breakpoint
ALTER TABLE "plant_photos" ADD CONSTRAINT "plant_photos_plant_id_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plants" ADD CONSTRAINT "plants_main_photo_id_plant_photos_id_fk" FOREIGN KEY ("main_photo_id") REFERENCES "public"."plant_photos"("id") ON DELETE no action ON UPDATE no action;