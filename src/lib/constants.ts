export const APP_NAME = "Arynox-EDU";
export const APP_TAGLINE = "Learn Without Limits";
export const APP_DESC = "Next-gen AI-powered e-learning platform";

export const TIER_CONFIG = {
  free_trial: {
    label: "Free Trial", priceInr: 0,
    description: "Start learning with limited free access",
    features: ["10 free lectures", "1 AI-powered lecture", "Basic progress tracking", "Standard streaming"],
    color: "#6b7280",
  },
  basic: {
    label: "Basic", priceInr: 299,
    description: "Core content and standard notes",
    features: ["Access to basic lectures", "Standard notes", "Watchlist & progress sync", "HD streaming"],
    color: "#3b82f6",
  },
  plus: {
    label: "Plus", priceInr: 599,
    description: "Full modules and AI text notes",
    features: ["Everything in Basic", "Full module access", "AI-generated notes", "Downloadable summaries"],
    color: "#a855f7",
  },
  premium: {
    label: "Premium", priceInr: 999,
    description: "Complete learning suite with AI tutor",
    features: ["All content unlocked", "Offline access", "AI notes & flashcards", "Whiteboard canvas", "24/7 AI Tutor", "Live classes"],
    color: "#7c3aed",
  },
};

export const TIER_RANK: Record<string, number> = { free_trial: 0, basic: 1, plus: 2, premium: 3 };
export const FREE_TRIAL_VIDEO_LIMIT = 10;
export const FREE_TRIAL_AI_LIMIT = 1;

export const DEMO_ADMIN = { email: "admin@arynoxtech.edu", password: "admin123", name: "Arynox Admin" };
export const DEMO_USER = { email: "learner@arynoxtech.edu", password: "learn123", name: "Alex Rivera" };

export const MODERATION_WORDS = [
  "fuck", "shit", "ass", "bitch", "damn", "crap", "dick", "piss", "slut", "whore",
  "bastard", "cock", "cunt", "douche", "fag", "motherfucker", "nigger", "nigga",
  "porn", "sex", "xxx", "abuse", "violence", "kill", "murder", "suicide",
];