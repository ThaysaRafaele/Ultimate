import { pgTable, serial, text, integer, date, timestamp, boolean, unique } from "drizzle-orm/pg-core";

export const teams = pgTable("teams", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  active: boolean("active").notNull().default(true),
  maxAge: integer("max_age"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const athletes = pgTable("athletes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  teams: text("teams").array().notNull(),
  position: text("position").notNull(),
  number: integer("number"),
  height: integer("height"),
  photoUrl: text("photo_url"),
  photoFocusX: integer("photo_focus_x").notNull().default(50),
  photoFocusY: integer("photo_focus_y").notNull().default(50),
  email: text("email"),
  contact: text("contact"),
  birthDate: date("birth_date"),
  entryDate: date("entry_date").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const championships = pgTable("championships", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  team: text("team").notNull(),
  championshipId: text("championship_id").notNull(),
  opponent: text("opponent").notNull(),
  gameDate: date("game_date").notNull(),
  gameTime: text("game_time").notNull(),
  status: text("status").notNull().default("agendado"),
  ourScore: integer("our_score"),
  theirScore: integer("their_score"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const gameLineups = pgTable(
  "game_lineups",
  {
    id: serial("id").primaryKey(),
    gameId: integer("game_id").notNull(),
    athleteId: integer("athlete_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [unique().on(table.gameId, table.athleteId)]
);
