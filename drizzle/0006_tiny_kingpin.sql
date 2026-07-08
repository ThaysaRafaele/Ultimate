CREATE TABLE "game_lineups" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"athlete_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "game_lineups_game_id_athlete_id_unique" UNIQUE("game_id","athlete_id")
);
