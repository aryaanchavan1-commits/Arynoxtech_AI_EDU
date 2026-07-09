import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

const envRaw = readFileSync(".env", "utf8");
const envVars = Object.fromEntries(
  envRaw.split("\n").filter(l => l.trim() && !l.startsWith("#")).map(l => l.split("=", 2).map(s => s.trim()))
);

const client = createClient({ url: envVars.DATABASE_URL, authToken: envVars.DATABASE_AUTH_TOKEN });

async function main() {
  // Create tables manually (matching sqliteTable schema)
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY, email text NOT NULL UNIQUE, name text NOT NULL,
      password_hash text, avatar_url text, role text NOT NULL DEFAULT 'user',
      tier text NOT NULL DEFAULT 'free_trial', oauth_provider text, oauth_id text,
      auth0_user_id text, free_videos_used integer NOT NULL DEFAULT 0,
      free_ai_used integer NOT NULL DEFAULT 0, is_blocked integer NOT NULL DEFAULT 0,
      blocked_reason text, streak integer NOT NULL DEFAULT 0, total_points integer NOT NULL DEFAULT 0,
      last_active_at text, created_at text NOT NULL DEFAULT (datetime('now')),
      updated_at text NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
      id text PRIMARY KEY, user_id text NOT NULL, expires_at text NOT NULL,
      created_at text NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS skills (
      id text PRIMARY KEY, title text NOT NULL, slug text NOT NULL UNIQUE,
      description text, thumbnail_url text, banner_url text,
      accent_color text DEFAULT '#7c3aed', is_featured integer NOT NULL DEFAULT 0,
      is_trending integer NOT NULL DEFAULT 0, sort_order integer NOT NULL DEFAULT 0,
      status text NOT NULL DEFAULT 'published',
      created_at text NOT NULL DEFAULT (datetime('now')),
      updated_at text NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS modules (
      id text PRIMARY KEY, skill_id text NOT NULL, title text NOT NULL,
      slug text NOT NULL, description text, thumbnail_url text,
      sort_order integer NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'published',
      created_at text NOT NULL DEFAULT (datetime('now')),
      updated_at text NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS sub_categories (
      id text PRIMARY KEY, module_id text NOT NULL, title text NOT NULL,
      slug text NOT NULL, description text, sort_order integer NOT NULL DEFAULT 0,
      created_at text NOT NULL DEFAULT (datetime('now')),
      updated_at text NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS categories (
      id text PRIMARY KEY, title text NOT NULL, slug text NOT NULL UNIQUE,
      description text, sort_order integer NOT NULL DEFAULT 0,
      created_at text NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS lectures (
      id text PRIMARY KEY, skill_id text NOT NULL, module_id text,
      sub_category_id text, category_id text, title text NOT NULL, slug text NOT NULL,
      description text, thumbnail_url text, duration_seconds integer NOT NULL DEFAULT 0,
      tier_required text NOT NULL DEFAULT 'free_trial',
      is_new_release integer NOT NULL DEFAULT 0, is_recommended integer NOT NULL DEFAULT 0,
      is_premium_ai integer NOT NULL DEFAULT 0, bunny_video_id text, bunny_library_id text,
      hls_url text, mp4_url text, transcript text, ai_notes_markdown text,
      content_text text, is_vulgar integer NOT NULL DEFAULT 0,
      status text NOT NULL DEFAULT 'published', view_count integer NOT NULL DEFAULT 0,
      sort_order integer NOT NULL DEFAULT 0,
      created_at text NOT NULL DEFAULT (datetime('now')),
      updated_at text NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS flashcards (
      id text PRIMARY KEY, lecture_id text NOT NULL, question text NOT NULL,
      answer text NOT NULL, difficulty integer NOT NULL DEFAULT 1,
      sort_order integer NOT NULL DEFAULT 0,
      created_at text NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS quizzes (
      id text PRIMARY KEY, lecture_id text NOT NULL, question text NOT NULL,
      options text NOT NULL, correct_index integer NOT NULL, explanation text,
      sort_order integer NOT NULL DEFAULT 0,
      created_at text NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS progress (
      id text PRIMARY KEY, user_id text NOT NULL, lecture_id text NOT NULL,
      position_seconds real NOT NULL DEFAULT 0, duration_seconds real NOT NULL DEFAULT 0,
      completed integer NOT NULL DEFAULT 0, completed_at text,
      last_watched_at text NOT NULL DEFAULT (datetime('now')),
      updated_at text NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, lecture_id)
    )`,
    `CREATE TABLE IF NOT EXISTS watchlist (
      id text PRIMARY KEY, user_id text NOT NULL, lecture_id text NOT NULL,
      created_at text NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, lecture_id)
    )`,
    `CREATE TABLE IF NOT EXISTS notes (
      id text PRIMARY KEY, user_id text NOT NULL, lecture_id text NOT NULL,
      content text NOT NULL DEFAULT '', canvas_data text,
      updated_at text NOT NULL DEFAULT (datetime('now')),
      created_at text NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, lecture_id)
    )`,
    `CREATE TABLE IF NOT EXISTS subscriptions (
      id text PRIMARY KEY, user_id text NOT NULL, tier text NOT NULL,
      amount_inr integer NOT NULL, currency text NOT NULL DEFAULT 'INR',
      status text NOT NULL DEFAULT 'active', provider text DEFAULT 'manual',
      provider_ref text, starts_at text NOT NULL DEFAULT (datetime('now')),
      ends_at text, created_at text NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS payments (
      id text PRIMARY KEY, user_id text NOT NULL,
      subscription_id text, amount_inr integer NOT NULL,
      currency text NOT NULL DEFAULT 'INR', status text NOT NULL DEFAULT 'completed',
      provider text DEFAULT 'razorpay', provider_ref text,
      created_at text NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS live_classes (
      id text PRIMARY KEY, title text NOT NULL, description text,
      instructor_id text NOT NULL, skill_id text, stream_url text, stream_key text,
      scheduled_at text, started_at text, ended_at text,
      is_live integer NOT NULL DEFAULT 0, recording_url text,
      max_participants integer DEFAULT 500, status text NOT NULL DEFAULT 'scheduled',
      created_at text NOT NULL DEFAULT (datetime('now')),
      updated_at text NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS live_class_participants (
      id text PRIMARY KEY, live_class_id text NOT NULL, user_id text NOT NULL,
      joined_at text NOT NULL DEFAULT (datetime('now')), left_at text,
      UNIQUE(user_id, live_class_id)
    )`,
    `CREATE TABLE IF NOT EXISTS app_settings (
      id text PRIMARY KEY DEFAULT 'global', groq_api_key text,
      bunny_library_id text, bunny_api_key text, bunny_cdn_hostname text,
      database_url text, auth0_domain text, auth0_client_id text, auth0_client_secret text,
      stripe_secret_key text, stripe_webhook_secret text, razorpay_key_id text,
      razorpay_key_secret text, app_url text, app_name text DEFAULT 'Arynox-EDU',
      maintenance_mode text DEFAULT 'false', max_free_videos text DEFAULT '10',
      max_free_ai text DEFAULT '1', primary_color text DEFAULT '#7c3aed',
      logo_url text, welcome_message text,
      updated_at text NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS ai_chat_messages (
      id text PRIMARY KEY, user_id text NOT NULL, lecture_id text,
      role text NOT NULL, content text NOT NULL, is_moderated integer NOT NULL DEFAULT 0,
      moderation_action text, timestamp_ref text,
      created_at text NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS content_reports (
      id text PRIMARY KEY, reported_by text NOT NULL, lecture_id text,
      comment_id text, reason text NOT NULL, status text NOT NULL DEFAULT 'pending',
      reviewed_by text, created_at text NOT NULL DEFAULT (datetime('now')),
      resolved_at text
    )`,
    `CREATE TABLE IF NOT EXISTS comments (
      id text PRIMARY KEY, lecture_id text NOT NULL, user_id text NOT NULL,
      content text NOT NULL, is_flagged integer NOT NULL DEFAULT 0,
      flag_reason text, created_at text NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS achievements (
      id text PRIMARY KEY, user_id text NOT NULL, type text NOT NULL,
      title text NOT NULL, description text, icon text,
      unlocked_at text NOT NULL DEFAULT (datetime('now'))
    )`,
  `CREATE TABLE IF NOT EXISTS parent_child_links (
      id text PRIMARY KEY, parent_id text NOT NULL, child_id text NOT NULL,
      relationship text, created_at text NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS daily_challenges (
      id text PRIMARY KEY, title text NOT NULL, description text,
      type text NOT NULL, target integer NOT NULL DEFAULT 1,
      points_reward integer NOT NULL DEFAULT 100, expires_at text,
      created_at text NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS user_challenges (
      id text PRIMARY KEY, user_id text NOT NULL, challenge_id text NOT NULL,
      progress integer NOT NULL DEFAULT 0, completed integer NOT NULL DEFAULT 0,
      completed_at text, created_at text NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, challenge_id)
    )`,
    `CREATE TABLE IF NOT EXISTS video_downloads (
      id text PRIMARY KEY, user_id text NOT NULL, lecture_id text NOT NULL,
      downloaded_at text NOT NULL DEFAULT (datetime('now')),
      file_size integer, expires_at text,
      UNIQUE(user_id, lecture_id)
    )`,
    `CREATE TABLE IF NOT EXISTS batch_classes (
      id text PRIMARY KEY, title text NOT NULL, description text,
      instructor_id text NOT NULL, skill_id text,
      max_students integer NOT NULL DEFAULT 50, price integer NOT NULL DEFAULT 0,
      start_date text, end_date text, schedule_json text,
      status text NOT NULL DEFAULT 'active',
      created_at text NOT NULL DEFAULT (datetime('now')),
      updated_at text NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS batch_enrollments (
      id text PRIMARY KEY, batch_id text NOT NULL, user_id text NOT NULL,
      enrolled_at text NOT NULL DEFAULT (datetime('now')),
      status text NOT NULL DEFAULT 'active',
      UNIQUE(batch_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS parent_reports (
      id text PRIMARY KEY, parent_id text NOT NULL, child_id text NOT NULL,
      period_start text, period_end text, report_json text,
      created_at text NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS quiz_attempts (
      id text PRIMARY KEY, user_id text NOT NULL, quiz_id text NOT NULL,
      selected_index integer NOT NULL, correct integer NOT NULL DEFAULT 0,
      attempted_at text NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS qa_user_idx ON quiz_attempts(user_id)`,
    `CREATE INDEX IF NOT EXISTS qa_quiz_idx ON quiz_attempts(quiz_id)`,
    `CREATE TABLE IF NOT EXISTS skill_mastery (
      id text PRIMARY KEY, user_id text NOT NULL, skill_id text NOT NULL,
      level text NOT NULL DEFAULT 'practiced', energy_points integer NOT NULL DEFAULT 0,
      lectures_completed integer NOT NULL DEFAULT 0, quizzes_passed integer NOT NULL DEFAULT 0,
      updated_at text NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS sm_user_skill_idx ON skill_mastery(user_id, skill_id)`,
    `CREATE TABLE IF NOT EXISTS module_progress (
      id text PRIMARY KEY, user_id text NOT NULL, module_id text NOT NULL,
      lectures_completed integer NOT NULL DEFAULT 0, total_lectures integer NOT NULL DEFAULT 0,
      completed integer NOT NULL DEFAULT 0,
      updated_at text NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS mp_user_module_idx ON module_progress(user_id, module_id)`,
  ];

  for (const sql of tables) {
    try {
      await client.execute(sql);
      console.log("OK:", sql.slice(0, 50) + "...");
    } catch (err) {
      console.log("SKIP (already exists):", sql.slice(0, 50) + "...");
    }
  }

  // Seed admin user
  const existing = await client.execute("SELECT id FROM users WHERE email = 'admin@arynoxtech.edu' LIMIT 1");
  if (existing.rows.length === 0) {
    const id = crypto.randomUUID();
    await client.execute({
      sql: `INSERT INTO users (id, email, name, password_hash, role, tier, total_points, streak, last_active_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))`,
      args: [id, "admin@arynoxtech.edu", "Arynox Admin", "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", "admin", "premium", 9999, 30],
    });
    console.log("Admin user created: admin@arynoxtech.edu / admin123");
  }

  // Seed default settings
  await client.execute({
    sql: `INSERT OR IGNORE INTO app_settings (id, app_name, primary_color, max_free_videos, max_free_ai, maintenance_mode, updated_at)
          VALUES ('global', 'Arynox-EDU', '#7c3aed', '10', '1', 'false', datetime('now'))`,
    args: [],
  });
  console.log("Default settings created");

  console.log("Turso database ready!");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});