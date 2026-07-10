CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"athlete_id" integer NOT NULL,
	"game_id" integer NOT NULL,
	"stat_type" text NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_athlete_id_game_id_stat_type_unique" UNIQUE("athlete_id","game_id","stat_type")
);
