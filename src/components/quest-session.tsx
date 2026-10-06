"use client";

import { liveQuery } from "dexie";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import type { Quest, QuestResult, UserStats } from "@/types/quest";
import { NetworkStatus } from "@/components/network-status";
import { LeafMark } from "@/components/leaf-mark";
import { questXp, toggleQuestTask } from "@/lib/gamification";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function QuestSession({ questId, onClose }: { questId: string; onClose: () => void }) {
  const [quest, setQuest] = useState<Quest | null>(null);
  const [result, setResult] = useState<QuestResult | null>(null);
  const [stats, setStats] = useState<UserStats | undefined>();
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const subscription = liveQuery(async () => {
      const [item, savedResult, userStats] = await Promise.all([
        db.quests.get(questId), db.results.get(questId), db.stats.get("user"),
      ]);
      return { item, savedResult, userStats };
    }).subscribe({
      next: ({ item, savedResult, userStats }) => {
        setQuest(item ?? null);
        setResult(savedResult ?? null);
        setStats(userStats);
        setError(false);
      },
      error: () => setError(true),
    });
    return () => subscription.unsubscribe();
  }, [questId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    const sync = () => setNow(Date.now());
    document.addEventListener("visibilitychange", sync);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", sync); };
  }, []);

  async function start() {
    if (!quest || quest.status === "completed") return;
    try {
      const startedAt = quest.startedAt ?? Date.now();
      await db.quests.update(questId, { status: "active", startedAt });
    } catch { setError(true); }
  }

  async function toggleTask(taskId: string) {
    if (!quest || quest.status !== "active" || saving) return;
    setSaving(true);
    try {
      await toggleQuestTask(questId, taskId);
    } catch { setError(true); }
    finally { setSaving(false); }
  }

  const completedCount = quest?.tasks.filter((task) => task.completed).length ?? 0;
  const elapsedSeconds = quest?.status === "completed"
    ? quest.durationSeconds ?? 0
    : quest?.startedAt ? Math.max(0, Math.floor((now - quest.startedAt) / 1000)) : 0;

  return (
    <div className="quest-session-backdrop">
      <section aria-labelledby="session-title" aria-modal="true" className="quest-session" role="dialog">
        <header className="session-header">
          <a className="brand" href="/" onClick={(event) => { event.preventDefault(); onClose(); }}><LeafMark /><span>touchgrass<span className="brand-ai">.ai</span></span></a>
          <div className="session-header-actions"><NetworkStatus /><button className="session-close" onClick={onClose} type="button">BACK HOME ↗</button></div>
        </header>
        {error ? <p className="session-message" role="alert">This quest could not be opened or saved on this device.</p> : !quest ? (
          <p aria-live="polite" className="session-message">Opening your quest…</p>
        ) : (
          <div className="session-content">
            <p className="shelf-eyebrow"><span className="eyebrow-line" /> {quest.status === "completed" ? "QUEST COMPLETE" : "YOUR TIME OUTSIDE"}</p>
            <h1 id="session-title">{quest.status === "completed" ? "A little more present." : quest.title}</h1>
            <p className="session-subtitle">{quest.duration} minute quest · {quest.difficulty} pace</p>
            {quest.status === "prepared" ? (
              <div className="session-intro">
                <p>Your plan is saved on this device. When you’re ready, start the timer and take it outside.</p>
                <button className="session-primary" onClick={() => void start()} type="button">Start my quest <span>↗</span></button>
              </div>
            ) : (
              <>
                <div aria-label={`${completedCount} of ${quest.tasks.length} tasks complete`} className="session-progress">
                  <span>{String(completedCount).padStart(2, "0")} / {String(quest.tasks.length).padStart(2, "0")} TASKS</span>
                  <span className="session-timer" aria-live="off">{formatTime(elapsedSeconds)}</span>
                </div>
                <div aria-valuemax={quest.tasks.length} aria-valuemin={0} aria-valuenow={completedCount} className="session-progress-track" role="progressbar">
                  <span style={{ width: `${quest.tasks.length ? completedCount / quest.tasks.length * 100 : 0}%` }} />
                </div>
                {quest.status === "completed" && (
                  <div className="session-finish">
                    <strong>+{result?.xpEarned ?? questXp(quest.difficulty)} GRASS XP</strong>
                    <span>{result?.streakDays ?? stats?.currentStreak ?? 1} DAY STREAK · SAVED ON THIS DEVICE</span>
                    <p>You completed all {quest.tasks.length} steps. Your time outside is part of your local history.</p>
                  </div>
                )}
                <ol className="session-tasks">
                  {quest.tasks.map((task, index) => (
                    <li key={task.id}>
                      <button aria-pressed={task.completed} className={`session-task ${task.completed ? "session-task-done" : ""}`} disabled={quest.status !== "active" || saving} onClick={() => void toggleTask(task.id)} type="button">
                        <span className="task-index">{String(index + 1).padStart(2, "0")}</span>
                        <span>{task.description}</span>
                        <span aria-hidden="true" className="session-check">{task.completed ? "✓" : "○"}</span>
                      </button>
                    </li>
                  ))}
                </ol>
                {quest.status === "active" && <p className="session-hint">Your progress is saved as you go. It’s okay to pause and look around.</p>}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
