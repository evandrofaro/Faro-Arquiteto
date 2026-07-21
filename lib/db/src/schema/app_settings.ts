import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appSettingsTable = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  defaultModel: text("default_model").notNull().default("Qwen/Qwen2.5-Coder-7B-Instruct"),
  huggingfaceToken: text("huggingface_token"),
  systemPrompt: text("system_prompt").notNull().default(
    "You are FaroBot, an expert AI assistant specializing in code review, correction, and improvement. You analyze code from GitHub repositories and provide precise, actionable fixes. You support all programming languages and frameworks. When given code, identify bugs, suggest improvements, correct syntax errors, and help with front-end and back-end development. Always provide clean, complete corrected code when making changes."
  ),
});

export const insertAppSettingsSchema = createInsertSchema(appSettingsTable).omit({
  id: true,
});
export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;
export type AppSettings = typeof appSettingsTable.$inferSelect;
