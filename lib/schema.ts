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
  shoeSize: integer("shoe_size"),
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
  q1OurScore: integer("q1_our_score"),
  q1TheirScore: integer("q1_their_score"),
  q2OurScore: integer("q2_our_score"),
  q2TheirScore: integer("q2_their_score"),
  q3OurScore: integer("q3_our_score"),
  q3TheirScore: integer("q3_their_score"),
  q4OurScore: integer("q4_our_score"),
  q4TheirScore: integer("q4_their_score"),
  otOurScore: integer("ot_our_score"),
  otTheirScore: integer("ot_their_score"),
  mvpAthleteId: integer("mvp_athlete_id"),
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

export const gameStats = pgTable(
  "game_stats",
  {
    id: serial("id").primaryKey(),
    gameId: integer("game_id").notNull(),
    athleteId: integer("athlete_id").notNull(),
    points: integer("points").notNull().default(0),
    rebounds: integer("rebounds").notNull().default(0),
    assists: integer("assists").notNull().default(0),
    steals: integer("steals").notNull().default(0),
    fg2Made: integer("fg2_made").notNull().default(0),
    fg2Attempted: integer("fg2_attempted").notNull().default(0),
    fg3Made: integer("fg3_made").notNull().default(0),
    fg3Attempted: integer("fg3_attempted").notNull().default(0),
    ftMade: integer("ft_made").notNull().default(0),
    ftAttempted: integer("ft_attempted").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [unique().on(table.gameId, table.athleteId)]
);

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    athleteId: integer("athlete_id").notNull(),
    gameId: integer("game_id").notNull(),
    statType: text("stat_type").notNull(),
    value: integer("value").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [unique().on(table.athleteId, table.gameId, table.statType)]
);
