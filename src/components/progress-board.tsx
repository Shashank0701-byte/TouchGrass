"use client";

import { liveQuery } from "dexie";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { reconcileGamification } from "@/lib/gamification";
import type { Quest, QuestResult, UserStats } from "@/types/quest";

type ProgressData = {
  stats: UserStats | undefined;
  history: { result: QuestResult; quest: Quest | undefined }[];
};

export function ProgressBoard() {
  const [data, setData] = useState<ProgressData | null>(null);

  useEffect(() => {
    void reconcileGamification().catch(() => undefined);
    const subscription = liveQuery(async () => {
      const [stats, results] = await Promise.all([
        db.stats.get("user"),
        db.results.orderBy("completedAt").reverse().limit(5).toArray(),
      ]);
      const history = await Promise.all(results.map(async (result) => ({
        result,
        quest: await db.quests.get(result.questId),
      })));
      return { stats, history };
    }).subscribe({ next: setData, error: () => setData({ stats: undefined, history: [] }) });

    return () => subscription.unsubscribe();
  }, []);

  const stats = data?.stats;
  return (
    <section aria-labelledby="progress-title" className="progress-board">
      <div className="progress-heading">
        <div>
          <p className="shelf-eyebrow"><span className="eyebrow-line" /> YOUR TIME OUTSIDE ADDS UP</p>
          <h2 id="progress-title">Your trail<span>.</span></h2>
        </div>
        <span className="progress-total">{stats?.questsCompleted ?? 0} QUESTS COMPLETE</span>
      </div>

      <div className="progress-stats" aria-live="polite">
        <div className="progress-stat"><strong>{stats?.xp ?? 0}</strong><span>GRASS XP</span></div>
        <div className="progress-stat"><strong>{stats?.currentStreak ?? 0}<small> days</small></strong><span>CURRENT STREAK</span></div>
        <div className="progress-stat"><strong>{stats?.longestStreak ?? 0}<small> days</small></strong><span>LONGEST STREAK</span></div>
        <div className="progress-stat"><strong>{Math.floor(stats?.totalOutdoorMinutes ?? 0)}<small> min</small></strong><span>TIME OUTSIDE</span></div>
      </div>

      <div className="history-heading"><h3>Recent quests</h3><span>KEPT ON THIS DEVICE</span></div>
      {data === null ? <p aria-live="polite" className="history-empty">Gathering your local history…</p> : data.history.length === 0 ? (
        <p className="history-empty">Complete a quest and your time outside will be remembered here.</p>
      ) : (
        <ol className="history-list">
          {data.history.map(({ result, quest }) => (
            <li key={result.id}>
              <span className="history-date">{new Date(result.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
              <span className="history-title">{quest?.title ?? "Completed quest"}</span>
              <span className="history-reward">+{result.xpEarned} XP</span>
              <span className="history-duration">{Math.floor(result.durationSeconds / 60)} MIN</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
