import { sqliteTable, text, integer, real, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"),
  avatarUrl: text("avatar_url"),
  role: text("role").notNull().default("user"),
  tier: text("tier").notNull().default("free_trial"),
  oauthProvider: text("oauth_provider"),
  oauthId: text("oauth_id"),
  auth0UserId: text("auth0_user_id"),
  freeVideosUsed: integer("free_videos_used").notNull().default(0),
  freeAiUsed: integer("free_ai_used").notNull().default(0),
  isBlocked: integer("is_blocked", { mode: "boolean" }).notNull().default(false),
  blockedReason: text("blocked_reason"),
  streak: integer("streak").notNull().default(0),
  totalPoints: integer("total_points").notNull().default(0),
  lastActiveAt: text("last_active_at"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
  updatedAt: text("updated_at").notNull().default("(datetime('now'))"),
}, (t) => [index("users_email_idx").on(t.email), index("users_tier_idx").on(t.tier)]);

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});

export const skills = sqliteTable("skills", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  bannerUrl: text("banner_url"),
  accentColor: text("accent_color").default("#7c3aed"),
  isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
  isTrending: integer("is_trending", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  status: text("status").notNull().default("published"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
  updatedAt: text("updated_at").notNull().default("(datetime('now'))"),
});

export const modules = sqliteTable("modules", {
  id: text("id").primaryKey(),
  skillId: text("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  status: text("status").notNull().default("published"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
  updatedAt: text("updated_at").notNull().default("(datetime('now'))"),
}, (t) => [index("modules_skill_idx").on(t.skillId)]);

export const subCategories = sqliteTable("sub_categories", {
  id: text("id").primaryKey(),
  moduleId: text("module_id").notNull().references(() => modules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
  updatedAt: text("updated_at").notNull().default("(datetime('now'))"),
}, (t) => [index("sub_categories_module_idx").on(t.moduleId)]);

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});

export const lectures = sqliteTable("lectures", {
  id: text("id").primaryKey(),
  skillId: text("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
  moduleId: text("module_id").references(() => modules.id, { onDelete: "set null" }),
  subCategoryId: text("sub_category_id").references(() => subCategories.id, { onDelete: "set null" }),
  categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  tierRequired: text("tier_required").notNull().default("free_trial"),
  isNewRelease: integer("is_new_release", { mode: "boolean" }).notNull().default(false),
  isRecommended: integer("is_recommended", { mode: "boolean" }).notNull().default(false),
  isPremiumAi: integer("is_premium_ai", { mode: "boolean" }).notNull().default(false),
  bunnyVideoId: text("bunny_video_id"),
  bunnyLibraryId: text("bunny_library_id"),
  hlsUrl: text("hls_url"),
  mp4Url: text("mp4_url"),
  transcript: text("transcript"),
  aiNotesMarkdown: text("ai_notes_markdown"),
  contentText: text("content_text"),
  isVulgar: integer("is_vulgar", { mode: "boolean" }).notNull().default(false),
  status: text("status").notNull().default("published"),
  viewCount: integer("view_count").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
  updatedAt: text("updated_at").notNull().default("(datetime('now'))"),
}, (t) => [
  index("lectures_skill_idx").on(t.skillId),
  index("lectures_module_idx").on(t.moduleId),
  index("lectures_tier_idx").on(t.tierRequired),
]);

export const flashcards = sqliteTable("flashcards", {
  id: text("id").primaryKey(),
  lectureId: text("lecture_id").notNull().references(() => lectures.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  difficulty: integer("difficulty").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
}, (t) => [index("flashcards_lecture_idx").on(t.lectureId)]);

export const quizzes = sqliteTable("quizzes", {
  id: text("id").primaryKey(),
  lectureId: text("lecture_id").notNull().references(() => lectures.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  options: text("options").notNull(),
  correctIndex: integer("correct_index").notNull(),
  explanation: text("explanation"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
}, (t) => [index("quizzes_lecture_idx").on(t.lectureId)]);

export const progress = sqliteTable("progress", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lectureId: text("lecture_id").notNull().references(() => lectures.id, { onDelete: "cascade" }),
  positionSeconds: real("position_seconds").notNull().default(0),
  durationSeconds: real("duration_seconds").notNull().default(0),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  completedAt: text("completed_at"),
  lastWatchedAt: text("last_watched_at").notNull().default("(datetime('now'))"),
  updatedAt: text("updated_at").notNull().default("(datetime('now'))"),
}, (t) => [uniqueIndex("progress_user_lecture_idx").on(t.userId, t.lectureId), index("progress_user_idx").on(t.userId)]);

export const watchlist = sqliteTable("watchlist", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lectureId: text("lecture_id").notNull().references(() => lectures.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
}, (t) => [uniqueIndex("watchlist_user_lecture_idx").on(t.userId, t.lectureId)]);

export const notes = sqliteTable("notes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lectureId: text("lecture_id").notNull().references(() => lectures.id, { onDelete: "cascade" }),
  content: text("content").notNull().default(""),
  canvasData: text("canvas_data"),
  updatedAt: text("updated_at").notNull().default("(datetime('now'))"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
}, (t) => [uniqueIndex("notes_user_lecture_idx").on(t.userId, t.lectureId)]);

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tier: text("tier").notNull(),
  amountInr: integer("amount_inr").notNull(),
  currency: text("currency").notNull().default("INR"),
  status: text("status").notNull().default("active"),
  provider: text("provider").default("manual"),
  providerRef: text("provider_ref"),
  startsAt: text("starts_at").notNull().default("(datetime('now'))"),
  endsAt: text("ends_at"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
}, (t) => [index("subscriptions_user_idx").on(t.userId)]);

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subscriptionId: text("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  amountInr: integer("amount_inr").notNull(),
  currency: text("currency").notNull().default("INR"),
  status: text("status").notNull().default("completed"),
  provider: text("provider").default("razorpay"),
  providerRef: text("provider_ref"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
}, (t) => [index("payments_user_idx").on(t.userId)]);

export const liveClasses = sqliteTable("live_classes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  instructorId: text("instructor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  skillId: text("skill_id").references(() => skills.id, { onDelete: "set null" }),
  streamUrl: text("stream_url"),
  streamKey: text("stream_key"),
  scheduledAt: text("scheduled_at"),
  startedAt: text("started_at"),
  endedAt: text("ended_at"),
  isLive: integer("is_live", { mode: "boolean" }).notNull().default(false),
  recordingUrl: text("recording_url"),
  maxParticipants: integer("max_participants").default(500),
  status: text("status").notNull().default("scheduled"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
  updatedAt: text("updated_at").notNull().default("(datetime('now'))"),
});

export const liveClassParticipants = sqliteTable("live_class_participants", {
  id: text("id").primaryKey(),
  liveClassId: text("live_class_id").notNull().references(() => liveClasses.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: text("joined_at").notNull().default("(datetime('now'))"),
  leftAt: text("left_at"),
}, (t) => [uniqueIndex("lcp_user_class_idx").on(t.userId, t.liveClassId)]);

export const appSettings = sqliteTable("app_settings", {
  id: text("id").primaryKey().default("global"),
  groqApiKey: text("groq_api_key"),
  bunnyLibraryId: text("bunny_library_id"),
  bunnyApiKey: text("bunny_api_key"),
  bunnyCdnHostname: text("bunny_cdn_hostname"),
  databaseUrl: text("database_url"),
  auth0Domain: text("auth0_domain"),
  auth0ClientId: text("auth0_client_id"),
  auth0ClientSecret: text("auth0_client_secret"),
  stripeSecretKey: text("stripe_secret_key"),
  stripeWebhookSecret: text("stripe_webhook_secret"),
  razorpayKeyId: text("razorpay_key_id"),
  razorpayKeySecret: text("razorpay_key_secret"),
  appUrl: text("app_url"),
  appName: text("app_name").default("Arynox-EDU"),
  maintenanceMode: text("maintenance_mode").default("false"),
  maxFreeVideos: text("max_free_videos").default("10"),
  maxFreeAi: text("max_free_ai").default("1"),
  primaryColor: text("primary_color").default("#7c3aed"),
  logoUrl: text("logo_url"),
  welcomeMessage: text("welcome_message"),
  updatedAt: text("updated_at").notNull().default("(datetime('now'))"),
});

export const aiChatMessages = sqliteTable("ai_chat_messages", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lectureId: text("lecture_id").references(() => lectures.id, { onDelete: "set null" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  isModerated: integer("is_moderated", { mode: "boolean" }).notNull().default(false),
  moderationAction: text("moderation_action"),
  timestampRef: text("timestamp_ref"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
}, (t) => [index("ai_chat_user_idx").on(t.userId)]);

export const contentReports = sqliteTable("content_reports", {
  id: text("id").primaryKey(),
  reportedBy: text("reported_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  lectureId: text("lecture_id").references(() => lectures.id, { onDelete: "cascade" }),
  commentId: text("comment_id"),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"),
  reviewedBy: text("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
  resolvedAt: text("resolved_at"),
});

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  lectureId: text("lecture_id").notNull().references(() => lectures.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isFlagged: integer("is_flagged", { mode: "boolean" }).notNull().default(false),
  flagReason: text("flag_reason"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
}, (t) => [index("comments_lecture_idx").on(t.lectureId)]);

export const achievements = sqliteTable("achievements", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  icon: text("icon"),
  unlockedAt: text("unlocked_at").notNull().default("(datetime('now'))"),
}, (t) => [index("achievements_user_idx").on(t.userId)]);

export const usersRelations = relations(users, ({ many }) => ({
  progress: many(progress), watchlist: many(watchlist), notes: many(notes), subscriptions: many(subscriptions), payments: many(payments),
}));
export const skillsRelations = relations(skills, ({ many }) => ({ modules: many(modules), lectures: many(lectures) }));
export const modulesRelations = relations(modules, ({ one, many }) => ({ skill: one(skills, { fields: [modules.skillId], references: [skills.id] }), subCategories: many(subCategories), lectures: many(lectures) }));
export const lecturesRelations = relations(lectures, ({ one, many }) => ({ skill: one(skills, { fields: [lectures.skillId], references: [skills.id] }), module: one(modules, { fields: [lectures.moduleId], references: [modules.id] }), flashcards: many(flashcards), quizzes: many(quizzes) }));

export type User = typeof users.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type SubCategory = typeof subCategories.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Lecture = typeof lectures.$inferSelect;
export type Progress = typeof progress.$inferSelect;
export type Flashcard = typeof flashcards.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type AppSettings = typeof appSettings.$inferSelect;
export type LiveClass = typeof liveClasses.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type SubscriptionTier = "free_trial" | "basic" | "plus" | "premium";