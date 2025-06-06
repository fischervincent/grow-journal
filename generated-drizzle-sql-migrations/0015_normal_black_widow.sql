ALTER TABLE "plants" ADD COLUMN "location_id" uuid;--> statement-breakpoint
ALTER TABLE "plants" ADD CONSTRAINT "plants_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plants" DROP COLUMN "location";