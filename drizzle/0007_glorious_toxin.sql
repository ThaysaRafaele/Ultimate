CREATE TABLE "game_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"athlete_id" integer NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"rebounds" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"steals" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "game_stats_game_id_athlete_id_unique" UNIQUE("game_id","athlete_id")
);
