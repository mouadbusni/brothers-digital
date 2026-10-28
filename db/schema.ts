import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const inquiries = sqliteTable("inquiries", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  services: text("services").notNull(),
  message: text("message").notNull(),
  timeframe: text("timeframe").notNull(),
  language: text("language").notNull(),
  notificationStatus: text("notification_status").notNull().default("not_configured"),
});

export const inquiryLimits = sqliteTable("inquiry_limits", {
  fingerprint: text("fingerprint").primaryKey(),
  hits: integer("hits").notNull().default(1),
  expiresAt: integer("expires_at").notNull(),
});
