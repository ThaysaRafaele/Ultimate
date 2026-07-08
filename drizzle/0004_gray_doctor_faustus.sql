CREATE TABLE "championships" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"team" text NOT NULL,
	"championship_id" text NOT NULL,
	"opponent" text NOT NULL,
	"game_date" date NOT NULL,
	"game_time" text NOT NULL,
	"status" text DEFAULT 'agendado' NOT NULL,
	"our_score" integer,
	"their_score" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
