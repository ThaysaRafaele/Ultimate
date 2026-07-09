ALTER TABLE "game_stats" ADD COLUMN "fg2_made" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "game_stats" ADD COLUMN "fg2_attempted" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "game_stats" ADD COLUMN "fg3_made" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "game_stats" ADD COLUMN "fg3_attempted" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "game_stats" ADD COLUMN "ft_made" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "game_stats" ADD COLUMN "ft_attempted" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "q1_our_score" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "q1_their_score" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "q2_our_score" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "q2_their_score" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "q3_our_score" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "q3_their_score" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "q4_our_score" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "q4_their_score" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "ot_our_score" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "ot_their_score" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "mvp_athlete_id" integer;