# Arynox-EDU

**Next-gen AI-powered e-learning platform for Gen Z, Millennials, and Gen Alpha.**

## Features

- 🎬 **Netflix-style UI** with dark glassmorphism design
- 🤖 **24/7 AI Tutor Copilot** (powered by Groq API)
- 📚 **Skills, Modules & Lectures** hierarchy
- 🔴 **Live Classes** (admin starts, users join)
- 💳 **Subscription Tiers** (Free Trial / Basic / Plus / Premium)
- 👥 **User Management** with block/unblock
- 🚫 **AI Content Moderation** - auto-detects profanity
- 📤 **Bunny.net Integration** for video uploads
- 🔐 **Supabase OAuth** (Google & GitHub)
- 🏆 **Gamification** - streaks, points, leaderboard
- 🪟 **Windows EXE** desktop app via Electron
- 🗄️ **PostgreSQL** with Drizzle ORM

## Getting Started

```bash
# Install dependencies
npm install

# Copy .env.example to .env and fill in:
# DATABASE_URL=postgresql://...
# GROQ_API_KEY=gsk_...
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Run development server
npm run dev

# Build for production
npm run build

# Run Windows desktop app
npm run electron
```

## Admin Panel

- URL: `/admin`
- Login: `admin@arynoxtech.edu` / `admin123`
- Features: Dashboard, Users, Content, Upload, Live Classes, Payments, Settings

## API Keys Configuration

Configure in Admin → Settings:
- **Groq API Key** - for AI Tutor, notes, flashcards
- **Bunny.net** - video streaming
- **Supabase** - OAuth authentication

## Build Windows EXE

```bash
cd electron
npm install
npm run build
# Output: electron/release/Arynox-EDU Setup.exe
```

## Tech Stack

- Next.js 16 + TypeScript
- PostgreSQL + Drizzle ORM
- Supabase Auth (OAuth)
- Tailwind CSS 4
- Groq AI (Llama 3.3)
- Bunny.net (Video Streaming)
- Electron (Desktop)