import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["artist", "team"] }).notNull().default("artist"),
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  artistId: integer("artist_id").references(() => users.id),
  artistName: text("artist_name").notNull(),
  releaseType: text("release_type", { enum: ["single", "ep", "album"] }).notNull(),
  title: text("title"),
  genre: text("genre").notNull(),
  writersComposers: text("writers_composers").notNull(),
  featuredArtist: text("featured_artist"),
  streamingLinks: jsonb("streaming_links").$type<{
    spotify?: string;
    appleMusic?: string;
    youtubeMusic?: string;
  }>(),
  tracks: jsonb("tracks").$type<{
    title: string;
    url: string;
    isrc?: string;
    upc?: string;
  }[]>().notNull(),
  artwork: jsonb("artwork").$type<{
    url: string;
    name: string;
  }>(),
  previouslyReleased: boolean("previously_released").notNull().default(false),
  productionName: text("production_name").notNull(),
  enableContentId: boolean("enable_content_id").notNull().default(false),
  status: text("status", { enum: ["pending", "approved", "declined"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  artistId: true,
  status: true,
  createdAt: true,
});

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  order: integer("order").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const insertFaqSchema = createInsertSchema(faqs).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type FAQ = typeof faqs.$inferSelect;