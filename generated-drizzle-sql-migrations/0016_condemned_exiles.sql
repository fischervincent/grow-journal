CREATE TABLE "notification_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"subscription" jsonb NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_subscriptions" ADD CONSTRAINT "notification_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_subscriptions_user_id_idx" ON "notification_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_subscriptions_endpoint_idx" ON "notification_subscriptions" USING btree ("endpoint");