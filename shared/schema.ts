import { pgTable, text, serial, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isTeamMember: boolean("is_team_member").default(false).notNull()
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  artistName: text("artist_name").notNull(),
  email: text("email").notNull(),
  genre: text("genre").notNull(),
  language: text("language").notNull(),
  version: text("version"),
  writerComposer: text("writer_composer").notNull(),
  releaseType: text("release_type").notNull(),
  releaseTitle: text("release_title"),
  releaseDate: text("release_date").notNull(),
  artworkUrl: text("artwork_url"),
  enableYoutubeContentId: boolean("enable_youtube_content_id").default(false).notNull(),
  previouslyReleased: boolean("previously_released").default(false).notNull(),
  previousUpc: text("previous_upc"),
  previousIsrc: text("previous_isrc"),
  featuredArtist: text("featured_artist"),
  featuredArtistType: text("featured_artist_type"), // 'new' or 'existing'
  featuredArtistProfiles: json("featured_artist_profiles").$type<{
    spotify?: string;
    appleMusic?: string;
    youtube?: string;
  }>(),
  streamingLinks: json("streaming_links").$type<{
    spotify?: string;
    appleMusicUrl?: string;
    youtubeMusicUrl?: string;
  }>(),
  tracks: json("tracks").$type<Array<{
    title: string;
    version: string;
    featuredArtist?: string;
    audioFile: {
      url: string;
      title: string;
      trackNumber: number;
    };
  }>>().notNull(),
  status: text("status").default("pending").notNull(),
  createdAt: text("created_at").notNull()
});

// Update the base schema definition
const baseSubmissionSchema = {
  artistName: z.string().min(1, "Artist name is required"),
  email: z.string().email("Valid email is required"),
  genre: z.string().min(1, "Genre is required"),
  language: z.string().min(1, "Language is required"),
  writerComposer: z.string().min(1, "Writer/Composer is required"),
  releaseType: z.string().min(1, "Release type is required"),
  releaseTitle: z.string().min(1, "Release title is required"),
  releaseDate: z.string().min(1, "Release date is required"),
  artworkUrl: z.string().min(1, "Artwork is required"),
  enableYoutubeContentId: z.boolean(),
  previouslyReleased: z.boolean(),
  tracks: z.array(z.object({
    title: z.string().min(1, "Track title is required"),
    version: z.string().optional(),
    featuredArtist: z.string().optional(),
    audioFile: z.object({
      url: z.string().min(1, "Audio file is required"),
      title: z.string(),
      trackNumber: z.number()
    })
  })).min(1, "At least one track is required"),
  // Optional fields
  version: z.string().optional(),
  previousUpc: z.string().optional(),
  previousIsrc: z.string().optional(),
  featuredArtist: z.string().optional(),
  featuredArtistType: z.string().optional(),
  featuredArtistProfiles: z.object({
    spotify: z.string().optional(),
    appleMusic: z.string().optional(),
    youtube: z.string().optional()
  }).optional(),
  streamingLinks: z.object({
    spotify: z.string().optional(),
    appleMusicUrl: z.string().optional(),
    youtubeMusicUrl: z.string().optional()
  }).optional()
};

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});

export const insertSubmissionSchema = z.object(baseSubmissionSchema);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;