import { pgTable, serial, text, integer, date, timestamp, boolean } from "drizzle-orm/pg-core";

export const teams = pgTable("teams", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const athletes = pgTable("athletes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  teams: text("teams").array().notNull(),
  position: text("position").notNull(),
  number: integer("number"),
  photoUrl: text("photo_url"),
  email: text("email"),
  contact: text("contact"),
  birthDate: date("birth_date"),
  entryDate: date("entry_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
