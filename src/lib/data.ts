import { getDb } from "@/db";
import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import {
  flashcards, lectures, modules, notes, progress, quizzes, skills, subCategories,
  subscriptions, users, watchlist, liveClasses, categories, roadmapMilestones,
  type Lecture, type User,
} from "@/db/schema";
import { ensureDb } from "@/db";

export async function bootstrap() { await ensureDb(); }

export async function getHomeCatalog(user: User | null) {
  await bootstrap();
  const _db = getDb();
  if (!_db) return { skills: [], featured: null, continueLearning: [], watchlist: [], rows: [] };
  const allSkills = await _db.select().from(skills).where(eq(skills.status, "published")).orderBy(asc(skills.sortOrder));
  const allLectures = await _db.select().from(lectures).where(eq(lectures.status, "published")).orderBy(desc(lectures.viewCount));
  const allModules = await _db.select().from(modules).orderBy(asc(modules.sortOrder));

  let continueLearning: Array<Lecture & { positionSeconds: number; progressPct: number }> = [];
  let myWatchlist: Lecture[] = [];

  if (user) {
    const prog = await _db.select({
      lecture: lectures, positionSeconds: progress.positionSeconds,
      durationSeconds: progress.durationSeconds, completed: progress.completed, lastWatchedAt: progress.lastWatchedAt,
    }).from(progress).innerJoin(lectures, eq(progress.lectureId, lectures.id))
      .where(eq(progress.userId, user.id)).orderBy(desc(progress.lastWatchedAt)).limit(12);
    continueLearning = prog.filter((p) => !p.completed).map((p) => ({
      ...p.lecture, positionSeconds: p.positionSeconds,
      progressPct: p.durationSeconds > 0 ? Math.min(100, Math.round((p.positionSeconds / p.durationSeconds) * 100)) : 0,
    }));
    const wl = await _db.select({ lecture: lectures }).from(watchlist)
      .innerJoin(lectures, eq(watchlist.lectureId, lectures.id))
      .where(eq(watchlist.userId, user.id)).orderBy(desc(watchlist.createdAt));
    myWatchlist = wl.map((w) => w.lecture);
  }

  const featured = allLectures.find((l) => l.isRecommended) || allLectures[0] || null;
  const trending = allLectures.filter((l) => l.isRecommended).slice(0, 12);
  const newReleases = allLectures.filter((l) => l.isNewRelease).slice(0, 12);
  const freeTrial = allLectures.filter((l) => l.tierRequired === "free_trial").slice(0, 12);
  const premium = allLectures.filter((l) => l.tierRequired === "premium").slice(0, 12);

  const rows = allSkills.map((skill) => ({
    skill, lectures: allLectures.filter((l) => l.skillId === skill.id).slice(0, 14),
    modules: allModules.filter((m) => m.skillId === skill.id),
  }));

  return {
    skills: allSkills, featured, continueLearning, watchlist: myWatchlist,
    rows: [
      { id: "trending", title: "Trending Now", lectures: trending.length ? trending : allLectures.slice(0, 12) },
      { id: "new", title: "Newly Added", lectures: newReleases.length ? newReleases : allLectures.slice(0, 8) },
      { id: "free", title: "Free Access", lectures: freeTrial },
      { id: "premium", title: "Premium Content", lectures: premium },
      ...rows.filter((r) => r.lectures.length > 0).map((r) => ({ id: r.skill.id, title: r.skill.title, lectures: r.lectures })),
    ],
  };
}

export async function getLectureDetail(id: string, user: User | null) {
  await bootstrap();
  const _db = getDb();
  if (!_db) return null;
  const rows = await _db.select().from(lectures).where(eq(lectures.id, id)).limit(1);
  const lecture = rows[0];
  if (!lecture) return null;
  const skillRows = await _db.select().from(skills).where(eq(skills.id, lecture.skillId)).limit(1);
  const moduleRows = lecture.moduleId ? await _db.select().from(modules).where(eq(modules.id, lecture.moduleId)).limit(1) : [];
  const cards = await _db.select().from(flashcards).where(eq(flashcards.lectureId, id)).orderBy(asc(flashcards.sortOrder));
  const quizItems = await _db.select().from(quizzes).where(eq(quizzes.lectureId, id)).orderBy(asc(quizzes.sortOrder));
  const related = await _db.select().from(lectures)
    .where(and(eq(lectures.skillId, lecture.skillId), eq(lectures.status, "published")))
    .orderBy(asc(lectures.sortOrder)).limit(12);
  let userProgress: any = null, userNote: any = null, inWatchlist = false;
  if (user) {
    [userProgress] = await _db.select().from(progress).where(and(eq(progress.userId, user.id), eq(progress.lectureId, id))).limit(1);
    [userNote] = await _db.select().from(notes).where(and(eq(notes.userId, user.id), eq(notes.lectureId, id))).limit(1);
    inWatchlist = !!(await _db.select().from(watchlist).where(and(eq(watchlist.userId, user.id), eq(watchlist.lectureId, id))).limit(1))[0];
  }
  return { lecture, skill: skillRows[0] || null, module: moduleRows[0] || null, flashcards: cards, quizzes: quizItems, related: related.filter((r) => r.id !== id), progress: userProgress, note: userNote, inWatchlist };
}

export async function searchLectures(q: string) {
  await bootstrap();
  if (!q.trim()) return [];
  const _db = getDb();
  if (!_db) return [];
  const pattern = `%${q.trim()}%`;
  return _db.select().from(lectures)
    .where(and(eq(lectures.status, "published"), or(like(lectures.title, pattern), like(lectures.description, pattern))))
    .orderBy(desc(lectures.viewCount)).limit(24);
}

export async function getAdminStats() {
  await bootstrap();
  const _db = getDb();
  if (!_db) return { users: 0, lectures: 0, skills: 0, subscriptions: 0, liveClasses: 0, recentUsers: [], topLectures: [], tierBreakdown: [] };
  const [userCount] = await _db.select({ count: sql<number>`count(*)` }).from(users);
  const [lectureCount] = await _db.select({ count: sql<number>`count(*)` }).from(lectures);
  const [skillCount] = await _db.select({ count: sql<number>`count(*)` }).from(skills);
  const [subCount] = await _db.select({ count: sql<number>`count(*)` }).from(subscriptions);
  const [liveCount] = await _db.select({ count: sql<number>`count(*)` }).from(liveClasses);
  return {
    users: userCount?.count ?? 0, lectures: lectureCount?.count ?? 0, skills: skillCount?.count ?? 0,
    subscriptions: subCount?.count ?? 0, liveClasses: liveCount?.count ?? 0,
    recentUsers: await _db.select().from(users).orderBy(desc(users.createdAt)).limit(8),
    topLectures: await _db.select().from(lectures).orderBy(desc(lectures.viewCount)).limit(6),
    tierBreakdown: await _db.select({ tier: users.tier, count: sql<number>`count(*)` }).from(users).groupBy(users.tier),
  };
}

export async function getAdminUsers() {
  await bootstrap();
  const _db = getDb();
  if (!_db) return [];
  return _db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getAdminContent() {
  await bootstrap();
  const _db = getDb();
  if (!_db) return { skills: [], modules: [], subCategories: [], lectures: [], categories: [], milestones: [] };
  return {
    skills: await _db.select().from(skills).orderBy(asc(skills.sortOrder)),
    modules: await _db.select().from(modules).orderBy(asc(modules.sortOrder)),
    subCategories: await _db.select().from(subCategories).orderBy(asc(subCategories.sortOrder)),
    lectures: await _db.select().from(lectures).orderBy(desc(lectures.createdAt)),
    categories: await _db.select().from(categories).orderBy(asc(categories.sortOrder)),
    milestones: await _db.select().from(roadmapMilestones).orderBy(asc(roadmapMilestones.sortOrder)),
  };
}

export async function getAdminLiveClasses() {
  await bootstrap();
  const _db = getDb();
  if (!_db) return [];
  return _db.select().from(liveClasses).orderBy(desc(liveClasses.createdAt));
}

export async function getLeaderboard() {
  await bootstrap();
  const _db = getDb();
  if (!_db) return [];
  return _db.select().from(users).where(eq(users.isBlocked, false)).orderBy(desc(users.totalPoints)).limit(20);
}