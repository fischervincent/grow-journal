CREATE TABLE "plant_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plant_event_date_time" timestamp NOT NULL,
	"comment" text,
	"plant_event_type_id" uuid NOT NULL,
	"plant_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plant_events" ADD CONSTRAINT "plant_events_plant_event_type_id_plant_event_types_id_fk" FOREIGN KEY ("plant_event_type_id") REFERENCES "public"."plant_event_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_events" ADD CONSTRAINT "plant_events_plant_id_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_events" ADD CONSTRAINT "plant_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "plant_events_user_id_idx" ON "plant_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "plant_events_user_plant_idx" ON "plant_events" USING btree ("user_id","plant_id");--> statement-breakpoint
CREATE INDEX "plant_events_user_plant_type_idx" ON "plant_events" USING btree ("user_id","plant_id","plant_event_type_id");--> statement-breakpoint
CREATE INDEX "plant_events_user_plant_date_idx" ON "plant_events" USING btree ("user_id","plant_id","plant_event_date_time");