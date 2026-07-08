ALTER TABLE "athletes" ADD COLUMN "height" integer;--> statement-breakpoint
ALTER TABLE "athletes" ADD COLUMN "photo_focus_x" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "athletes" ADD COLUMN "photo_focus_y" integer DEFAULT 50 NOT NULL;