import { MODERATION_WORDS } from "./constants";

export function containsVulgar(text: string): boolean {
  const lower = text.toLowerCase();
  return MODERATION_WORDS.some((word) => lower.includes(word));
}

export function moderateText(text: string): { isVulgar: boolean; cleanText: string } {
  const lower = text.toLowerCase();
  let clean = text;
  let isVulgar = false;
  for (const word of MODERATION_WORDS) {
    const regex = new RegExp(word, "gi");
    if (regex.test(lower)) {
      isVulgar = true;
      clean = clean.replace(regex, "***");
    }
  }
  return { isVulgar, cleanText: clean };
}

export function moderateComment(text: string): { allowed: boolean; reason?: string } {
  if (containsVulgar(text)) {
    return { allowed: false, reason: "Comment contains inappropriate language" };
  }
  return { allowed: true };
}

export function moderateUsername(name: string): { allowed: boolean; reason?: string } {
  if (name.length < 2) return { allowed: false, reason: "Name too short" };
  if (name.length > 50) return { allowed: false, reason: "Name too long" };
  if (containsVulgar(name)) return { allowed: false, reason: "Name contains inappropriate language" };
  return { allowed: true };
}