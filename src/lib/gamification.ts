import { db } from "@/lib/db";
import type { Quest, QuestResult, UserStats } from "@/types/quest";

export function questXp(difficulty: Quest["difficulty"]) {
  return difficulty === "easy" ? 50 : difficulty === "medium" ? 100 : 150;
}

function localDay(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dayNumber(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return Date.UTC(year, month - 1, date) / 86_400_000;
}

function streakSummary(results: QuestResult[], now: number) {
  const days = [...new Set(results.map((result) => localDay(result.completedAt)))].sort();
  const values = new Map<string, number>();
  let run = 0;
  let longest = 0;
  let previous: string | undefined;

  for (const day of days) {
    run = previous && dayNumber(day) - dayNumber(previous) === 1 ? run + 1 : 1;
    values.set(day, run);
    longest = Math.max(longest, run);
    previous = day;
  }

  const lastCompletedDate = days.at(-1);
  const gap = lastCompletedDate ? dayNumber(localDay(now)) - dayNumber(lastCompletedDate) : Infinity;
  const current = lastCompletedDate && (gap === 0 || gap === 1) ? values.get(lastCompletedDate) ?? 0 : 0;
  return { current, longest, lastCompletedDate, values };
}

const emptyStats = (): UserStats => ({
  key: "user",
  xp: 0,
  currentStreak: 0,
  longestStreak: 0,
  questsCompleted: 0,
  totalOutdoorMinutes: 0,
});

export async function toggleQuestTask(questId: string, taskId: string) {
  await db.transaction("rw", db.quests, db.results, db.stats, async () => {
    const quest = await db.quests.get(questId);
    if (!quest || quest.status !== "active") return;
    const tasks = quest.tasks.map((task) => task.id === taskId ? { ...task, completed: !task.completed } : task);

    if (!tasks.length || !tasks.every((task) => task.completed)) {
      await db.quests.update(questId, { tasks });
      return;
    }

    const completedAt = Date.now();
    const durationSeconds = Math.max(0, Math.floor((completedAt - (quest.startedAt ?? completedAt)) / 1000));
    const xpEarned = questXp(quest.difficulty);
    const stats = (await db.stats.get("user")) ?? emptyStats();
    const completedDate = localDay(completedAt);
    const dayGap = stats.lastCompletedDate ? dayNumber(completedDate) - dayNumber(stats.lastCompletedDate) : Infinity;
    const currentStreak = dayGap === 0
      ? Math.max(1, stats.currentStreak)
      : dayGap === 1 ? stats.currentStreak + 1 : 1;

    const completed: Quest = { ...quest, tasks, status: "completed", completedAt, durationSeconds };
    await db.quests.put(completed);
    await db.results.put({
      id: quest.id,
      questId: quest.id,
      completedAt,
      durationSeconds,
      xpEarned,
      completedTasks: tasks.length,
      streakDays: currentStreak,
    });
    await db.stats.put({
      ...stats,
      xp: stats.xp + xpEarned,
      currentStreak,
      longestStreak: Math.max(stats.longestStreak, currentStreak),
      questsCompleted: stats.questsCompleted + 1,
      totalOutdoorMinutes: stats.totalOutdoorMinutes + durationSeconds / 60,
      lastCompletedDate: completedDate,
    });
  });
}

/** Fill rewards for Phase 3 results once, then keep aggregate local stats in sync. */
export async function reconcileGamification() {
  await db.transaction("rw", db.quests, db.results, db.stats, async () => {
    const results = await db.results.toArray();
    for (const result of results) {
      if ((result.xpEarned ?? 0) > 0) continue;
      const quest = await db.quests.get(result.questId);
      if (!quest || quest.status !== "completed") continue;
      result.xpEarned = questXp(quest.difficulty);
      await db.results.put(result);
    }

    const stats = (await db.stats.get("user")) ?? emptyStats();
    const updatedResults = await db.results.toArray();
    const summary = streakSummary(updatedResults, Date.now());
    for (const result of updatedResults) {
      if (result.streakDays === undefined) {
        result.streakDays = summary.values.get(localDay(result.completedAt)) ?? 1;
        await db.results.put(result);
      }
    }
    await db.stats.put({
      ...stats,
      xp: updatedResults.reduce((total, result) => total + (result.xpEarned ?? 0), 0),
      currentStreak: summary.current,
      longestStreak: Math.max(stats.longestStreak, summary.longest),
      questsCompleted: updatedResults.length,
      totalOutdoorMinutes: updatedResults.reduce((total, result) => total + result.durationSeconds / 60, 0),
      lastCompletedDate: summary.lastCompletedDate,
    });
  });
}
