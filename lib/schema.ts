import { pgTable, serial, text, integer, date, timestamp } from "drizzle-orm/pg-core";

export const athletes = pgTable("athletes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  team: text("team").notNull(),
  position: text("position").notNull(),
  number: integer("number"),
  photoUrl: text("photo_url"),
  email: text("email"),
  contact: text("contact"),
  birthDate: date("birth_date"),
  entryDate: date("entry_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
