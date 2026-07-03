ALTER TABLE "teams" ADD COLUMN "max_age" integer;
--> statement-breakpoint
UPDATE "teams" SET "max_age" = 16 WHERE "id" = 'sub-16';
--> statement-breakpoint
UPDATE "teams" SET "max_age" = 18 WHERE "id" = 'sub-18';
--> statement-breakpoint
UPDATE "teams" SET "max_age" = 20 WHERE "id" = 'sub-20';