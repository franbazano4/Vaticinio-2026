import { pgTable, serial, jsonb, timestamp } from "drizzle-orm/pg-core";

export const resultsTable = pgTable("results", {
  id: serial("id").primaryKey(),
  data: jsonb("data").notNull().default({}),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Results = typeof resultsTable.$inferSelect;
