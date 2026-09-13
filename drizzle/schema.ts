import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const laptops = mysqlTable("laptops", {
  id: int("id").autoincrement().primaryKey(),
  brand: varchar("brand", { length: 80 }).notNull(),
  model: varchar("model", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  price: int("price").notNull(),
  currency: mysqlEnum("currency", ["INR", "USD"]).default("INR").notNull(),
  cpu: varchar("cpu", { length: 180 }).notNull(),
  gpu: varchar("gpu", { length: 180 }).notNull(),
  ram: int("ram").notNull(),
  storage: int("storage").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const recommendationRequests = mysqlTable("recommendationRequests", {
  id: varchar("id", { length: 32 }).primaryKey(),
  requirements: json("requirements").notNull(),
  inputMode: mysqlEnum("inputMode", ["form", "natural-language"]).default("form").notNull(),
  scoringVersion: varchar("scoringVersion", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const recommendationResults = mysqlTable("recommendationResults", {
  id: int("id").autoincrement().primaryKey(),
  requestId: varchar("requestId", { length: 32 }).notNull(),
  laptopId: int("laptopId").notNull(),
  rank: int("rank").notNull(),
  score: int("score").notNull(),
  evidence: json("evidence").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
