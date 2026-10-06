"use client";

import { liveQuery } from "dexie";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import type { Quest } from "@/types/quest";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function QuestSession({ questId, onClose }: { questId: string; onClose: () => void }) {
  const [quest, setQuest] = useState<Quest | null>(null);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const subscription = liveQuery(() => db.quests.get(questId)).subscribe({
      next: (item) => { setQuest(item ?? null); setError(false); },
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
      await db.transaction("rw", db.quests, db.results, async () => {
        const latest = await db.quests.get(questId);
        if (!latest || latest.status !== "active") return;
        const tasks = latest.tasks.map((task) => task.id === taskId ? { ...task, completed: !task.completed } : task);
        if (tasks.every((task) => task.completed)) {
          const completedAt = Date.now();
          const durationSeconds = Math.max(0, Math.floor((completedAt - (latest.startedAt ?? completedAt)) / 1000));
          const completed: Quest = { ...latest, tasks, status: "completed", completedAt, durationSeconds };
          await db.quests.put(completed);
          await db.results.put({
            id: latest.id,
            questId: latest.id,
            completedAt,
            durationSeconds,
            xpEarned: 0,
            completedTasks: tasks.length,
          });
        } else {
          await db.quests.update(questId, { tasks });
        }
      });
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
          <a className="brand" href="/" onClick={(event) => { event.preventDefault(); onClose(); }}>✳ <span>touchgrass.ai</span></a>
          <button className="session-close" onClick={onClose} type="button">BACK HOME ↗</button>
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
                {quest.status === "completed" && <p className="session-finish">You completed all {quest.tasks.length} steps. Your result is saved on this device.</p>}
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
