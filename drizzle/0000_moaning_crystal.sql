CREATE TABLE "athletes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"teams" text[] NOT NULL,
	"position" text NOT NULL,
	"number" integer,
	"photo_url" text,
	"email" text,
	"contact" text,
	"birth_date" date,
	"entry_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
