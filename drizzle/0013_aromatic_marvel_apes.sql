ALTER TABLE "game_stats" ADD COLUMN "rebounds_off" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "game_stats" ADD COLUMN "rebounds_def" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "game_stats" ADD COLUMN "blocks" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "game_stats" ADD COLUMN "turnovers" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "game_stats" ADD COLUMN "fouls" integer DEFAULT 0 NOT NULL;