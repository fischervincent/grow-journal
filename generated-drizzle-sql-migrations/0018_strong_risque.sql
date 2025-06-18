CREATE TABLE "plant_event_type_reminder_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plant_event_type_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"interval_value" integer NOT NULL,
	"interval_unit" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plant_reminder_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plant_id" uuid NOT NULL,
	"plant_event_type_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"is_enabled" boolean NOT NULL,
	"use_default" boolean DEFAULT true NOT NULL,
	"interval_value" integer,
	"interval_unit" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "plant_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plant_id" uuid NOT NULL,
	"plant_event_type_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"is_snoozed" boolean DEFAULT false NOT NULL,
	"snoozed_until" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plant_event_type_reminder_configs" ADD CONSTRAINT "plant_event_type_reminder_configs_plant_event_type_id_plant_event_types_id_fk" FOREIGN KEY ("plant_event_type_id") REFERENCES "public"."plant_event_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_event_type_reminder_configs" ADD CONSTRAINT "plant_event_type_reminder_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_reminder_configs" ADD CONSTRAINT "plant_reminder_configs_plant_id_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_reminder_configs" ADD CONSTRAINT "plant_reminder_configs_plant_event_type_id_plant_event_types_id_fk" FOREIGN KEY ("plant_event_type_id") REFERENCES "public"."plant_event_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_reminder_configs" ADD CONSTRAINT "plant_reminder_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_reminders" ADD CONSTRAINT "plant_reminders_plant_id_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_reminders" ADD CONSTRAINT "plant_reminders_plant_event_type_id_plant_event_types_id_fk" FOREIGN KEY ("plant_event_type_id") REFERENCES "public"."plant_event_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_reminders" ADD CONSTRAINT "plant_reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "plant_event_type_reminder_configs_event_type_user_idx" ON "plant_event_type_reminder_configs" USING btree ("plant_event_type_id","user_id");--> statement-breakpoint
CREATE INDEX "plant_event_type_reminder_configs_user_id_idx" ON "plant_event_type_reminder_configs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "plant_reminder_configs_plant_event_type_idx" ON "plant_reminder_configs" USING btree ("plant_id","plant_event_type_id");--> statement-breakpoint
CREATE INDEX "plant_reminder_configs_plant_id_idx" ON "plant_reminder_configs" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "plant_reminder_configs_user_id_idx" ON "plant_reminder_configs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "plant_reminder_configs_active_idx" ON "plant_reminder_configs" USING btree ("plant_id","user_id") WHERE "plant_reminder_configs"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "plant_reminders_scheduled_at_idx" ON "plant_reminders" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "plant_reminders_plant_user_idx" ON "plant_reminders" USING btree ("plant_id","user_id");--> statement-breakpoint
CREATE INDEX "plant_reminders_user_active_idx" ON "plant_reminders" USING btree ("user_id","is_completed","scheduled_at");--> statement-breakpoint
CREATE INDEX "plant_reminders_plant_event_type_idx" ON "plant_reminders" USING btree ("plant_id","plant_event_type_id");