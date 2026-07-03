CREATE TABLE "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "teams" ("id", "label") VALUES
	('nivel-1', 'Nível 1'),
	('nivel-2', 'Nível 2'),
	('nivel-3', 'Nível 3'),
	('cg-city', 'CG City'),
	('blazers', 'Blazers'),
	('adulto', 'Adulto'),
	('sub-16', 'Sub 16'),
	('sub-18', 'Sub 18'),
	('sub-20', 'Sub 20');
