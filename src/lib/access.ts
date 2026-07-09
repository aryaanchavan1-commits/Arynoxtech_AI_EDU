import type { Lecture, User } from "@/db/schema";
export type SubscriptionTier = "free_trial" | "basic" | "plus" | "premium";
import { FREE_TRIAL_AI_LIMIT, FREE_TRIAL_VIDEO_LIMIT, TIER_RANK } from "@/lib/constants";

export function canAccessTier(userTier: string, required: string) {
  return TIER_RANK[userTier] >= TIER_RANK[required];
}

export function canWatchLecture(user: User, lecture: Lecture) {
  if (user.role === "admin") return { allowed: true as const, reason: null };
  if (user.isBlocked) return { allowed: false as const, reason: "blocked" as const };
  if (canAccessTier(user.tier, lecture.tierRequired)) return { allowed: true as const, reason: null };
  if (user.tier === "free_trial" && user.freeVideosUsed < FREE_TRIAL_VIDEO_LIMIT) return { allowed: true as const, reason: "trial_quota" as const };
  return { allowed: false as const, reason: "upgrade_required" as const };
}

export function canUseAiFeatures(user: User, lecture: Lecture) {
  if (user.role === "admin") return { allowed: true as const };
  if (user.isBlocked) return { allowed: false as const };
  if (user.tier === "premium" || user.tier === "plus") return { allowed: true as const };
  return { allowed: false as const, reason: "upgrade_required" as const };
}

export function canUseAiTutor(user: User) {
  return user.role === "admin" || user.tier === "premium";
}