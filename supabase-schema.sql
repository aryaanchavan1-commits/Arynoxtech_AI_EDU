-- ============================================================
-- Arynox-EDU — Supabase Database Schema
-- Run this in Supabase SQL Editor (https://app.supabase.com)
-- ============================================================

CREATE TYPE subscription_tier AS ENUM ('free_trial', 'basic', 'plus', 'premium');
CREATE TYPE user_role AS ENUM ('user', 'admin', 'blocked');
CREATE TYPE content_status AS ENUM ('draft', 'processing', 'published', 'archived');

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  password_hash text,
  avatar_url text,
  role user_role NOT NULL DEFAULT 'user',
  tier subscription_tier NOT NULL DEFAULT 'free_trial',
  oauth_provider text,
  oauth_id text,
  supabase_user_id text,
  free_videos_used integer NOT NULL DEFAULT 0,
  free_ai_used integer NOT NULL DEFAULT 0,
  is_blocked boolean NOT NULL DEFAULT false,
  blocked_reason text,
  streak integer NOT NULL DEFAULT 0,
  total_points integer NOT NULL DEFAULT 0,
  last_active_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS skills (
  id text PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  thumbnail_url text,
  banner_url text,
  accent_color text DEFAULT '#7c3aed',
  is_featured boolean NOT NULL DEFAULT false,
  is_trending boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS modules (
  id text PRIMARY KEY,
  skill_id text NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  thumbnail_url text,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sub_categories (
  id text PRIMARY KEY,
  module_id text NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lectures (
  id text PRIMARY KEY,
  skill_id text NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  module_id text REFERENCES modules(id) ON DELETE SET NULL,
  sub_category_id text REFERENCES sub_categories(id) ON DELETE SET NULL,
  category_id text REFERENCES categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  thumbnail_url text,
  duration_seconds integer NOT NULL DEFAULT 0,
  tier_required subscription_tier NOT NULL DEFAULT 'free_trial',
  is_new_release boolean NOT NULL DEFAULT false,
  is_recommended boolean NOT NULL DEFAULT false,
  is_premium_ai boolean NOT NULL DEFAULT false,
  bunny_video_id text,
  bunny_library_id text,
  hls_url text,
  mp4_url text,
  transcript text,
  ai_notes_markdown text,
  content_text text,
  is_vulgar boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'published',
  view_count integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flashcards (
  id text PRIMARY KEY,
  lecture_id text NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  difficulty integer NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quizzes (
  id text PRIMARY KEY,
  lecture_id text NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL,
  explanation text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS progress (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lecture_id text NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  position_seconds real NOT NULL DEFAULT 0,
  duration_seconds real NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_watched_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lecture_id)
);

CREATE TABLE IF NOT EXISTS watchlist (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lecture_id text NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lecture_id)
);

CREATE TABLE IF NOT EXISTS notes (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lecture_id text NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  canvas_data jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lecture_id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL,
  amount_inr integer NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'active',
  provider text DEFAULT 'manual',
  provider_ref text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id text REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount_inr integer NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'completed',
  provider text DEFAULT 'razorpay',
  provider_ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS live_classes (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text,
  instructor_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id text REFERENCES skills(id) ON DELETE SET NULL,
  stream_url text,
  stream_key text,
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  is_live boolean NOT NULL DEFAULT false,
  recording_url text,
  max_participants integer DEFAULT 500,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS live_class_participants (
  id text PRIMARY KEY,
  live_class_id text NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  UNIQUE(user_id, live_class_id)
);

CREATE TABLE IF NOT EXISTS app_settings (
  id text PRIMARY KEY DEFAULT 'global',
  groq_api_key text,
  bunny_library_id text,
  bunny_api_key text,
  bunny_cdn_hostname text,
  database_url text,
  supabase_url text,
  supabase_anon_key text,
  supabase_service_key text,
  stripe_secret_key text,
  stripe_webhook_secret text,
  razorpay_key_id text,
  razorpay_key_secret text,
  app_url text,
  app_name text DEFAULT 'Arynox-EDU',
  maintenance_mode text DEFAULT 'false',
  max_free_videos text DEFAULT '10',
  max_free_ai text DEFAULT '1',
  primary_color text DEFAULT '#7c3aed',
  logo_url text,
  welcome_message text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lecture_id text REFERENCES lectures(id) ON DELETE SET NULL,
  role text NOT NULL,
  content text NOT NULL,
  is_moderated boolean NOT NULL DEFAULT false,
  moderation_action text,
  timestamp_ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_reports (
  id text PRIMARY KEY,
  reported_by text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lecture_id text REFERENCES lectures(id) ON DELETE CASCADE,
  comment_id text,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS comments (
  id text PRIMARY KEY,
  lecture_id text NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_flagged boolean NOT NULL DEFAULT false,
  flag_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS achievements (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  description text,
  icon text,
  unlocked_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Public read access for content (anyone can browse)
CREATE POLICY "Public read lectures" ON lectures FOR SELECT USING (status = 'published');
CREATE POLICY "Public read skills" ON skills FOR SELECT USING (status = 'published');
CREATE POLICY "Public read modules" ON modules FOR SELECT USING (status = 'published');

-- Users manage their own data
CREATE POLICY "Users read own" ON users FOR SELECT USING (auth.uid()::text = supabase_user_id OR auth.uid()::text = id);
