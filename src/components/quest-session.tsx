"use client";

import { liveQuery } from "dexie";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import type { PhotoEvidence, Quest, QuestResult, UserStats } from "@/types/quest";
import { NetworkStatus } from "@/components/network-status";
import { LeafMark } from "@/components/leaf-mark";
import { questXp, toggleQuestTask } from "@/lib/gamification";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function EvidencePreview({ evidence, onDelete, deleting }: { evidence: PhotoEvidence; onDelete: () => void; deleting: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(evidence.blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [evidence.blob]);

  if (!url) return <p className="evidence-note">Loading your saved photo…</p>;
  return (
    <div className="evidence-preview">
      <a aria-label="Review saved photo evidence" href={url} rel="noreferrer" target="_blank">
        <img alt="Photo evidence for this outdoor quest task" src={url} />
      </a>
      <button className="evidence-delete" disabled={deleting} onClick={onDelete} type="button">
        {deleting ? "Removing…" : "Remove photo"}
      </button>
    </div>
  );
}

export function QuestSession({ questId, onClose }: { questId: string; onClose: () => void }) {
  const [quest, setQuest] = useState<Quest | null>(null);
  const [result, setResult] = useState<QuestResult | null>(null);
  const [stats, setStats] = useState<UserStats | undefined>();
  const [evidence, setEvidence] = useState<PhotoEvidence[]>([]);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [evidenceBusy, setEvidenceBusy] = useState<string | null>(null);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  useEffect(() => {
    const subscription = liveQuery(async () => {
      const [item, savedResult, userStats, savedEvidence] = await Promise.all([
        db.quests.get(questId), db.results.get(questId), db.stats.get("user"),
        db.evidence.where("questId").equals(questId).toArray(),
      ]);
      return { item, savedResult, userStats, savedEvidence };
    }).subscribe({
      next: ({ item, savedResult, userStats, savedEvidence }) => {
        setQuest(item ?? null);
        setResult(savedResult ?? null);
        setStats(userStats);
        setEvidence(savedEvidence);
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

  async function saveEvidence(taskId: string, file: File) {
    setEvidenceError(null);
    if ((file.type && !file.type.startsWith("image/")) || file.size === 0) {
      setEvidenceError("Choose an image from your camera or photo library.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setEvidenceError("That photo is over 12 MB. Choose a smaller image to save it on this device.");
      return;
    }

    setEvidenceBusy(taskId);
    try {
      if (navigator.storage?.estimate) {
        try {
          const { quota, usage } = await navigator.storage.estimate();
          if (quota && usage !== undefined && quota - usage < file.size * 1.2) {
            throw new Error("There may not be enough free device storage for this photo. Remove an older photo or choose a smaller one.");
          }
        } catch (cause) {
          if (cause instanceof Error && cause.message.startsWith("There may not be enough")) throw cause;
        }
      }
      const id = crypto.randomUUID();
      await db.transaction("rw", db.quests, db.evidence, async () => {
        const latest = await db.quests.get(questId);
        const task = latest?.tasks.find((item) => item.id === taskId);
        if (!latest || latest.status !== "active" || !task?.requiresPhoto) throw new Error("This task is no longer available for photo evidence.");
        await db.evidence.put({ id, questId, taskId, createdAt: Date.now(), blob: file });
        await db.quests.update(questId, {
          tasks: latest.tasks.map((item) => item.id === taskId ? { ...item, evidenceId: id } : item),
        });
      });
    } catch (cause) {
      setEvidenceError(cause instanceof Error ? cause.message : "Could not save the photo on this device.");
    } finally {
      setEvidenceBusy(null);
    }
  }

  async function deleteEvidence(item: PhotoEvidence) {
    setEvidenceError(null);
    setEvidenceBusy(item.taskId);
    try {
      await db.transaction("rw", db.quests, db.evidence, async () => {
        const latest = await db.quests.get(questId);
        if (!latest) return;
        await db.evidence.delete(item.id);
        await db.quests.update(questId, {
          tasks: latest.tasks.map((task) => task.evidenceId === item.id
            ? { ...task, evidenceId: undefined, completed: latest.status === "completed" ? task.completed : false }
            : task),
        });
      });
    } catch {
      setEvidenceError("Could not remove this photo from the device.");
    } finally {
      setEvidenceBusy(null);
    }
  }

  async function clearMissingEvidence(taskId: string, evidenceId: string) {
    if (!quest) return;
    try {
      await db.quests.update(questId, {
        tasks: quest.tasks.map((task) => task.id === taskId && task.evidenceId === evidenceId
          ? { ...task, evidenceId: undefined, completed: quest.status === "completed" ? task.completed : false }
          : task),
      });
    } catch {
      setEvidenceError("Could not clear the missing photo reference.");
    }
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
                      <button aria-pressed={task.completed} className={`session-task ${task.completed ? "session-task-done" : ""}`} disabled={quest.status !== "active" || saving || evidenceBusy !== null || (task.requiresPhoto && !task.evidenceId)} onClick={() => void toggleTask(task.id)} type="button">
                        <span className="task-index">{String(index + 1).padStart(2, "0")}</span>
                        <span>{task.description}</span>
                        <span aria-hidden="true" className="session-check">{task.completed ? "✓" : "○"}</span>
                      </button>
                      {task.requiresPhoto && (
                        <div className="evidence-tools">
                          {task.evidenceId && evidence.some((item) => item.id === task.evidenceId) ? (
                            <EvidencePreview
                                deleting={evidenceBusy !== null}
                              evidence={evidence.find((item) => item.id === task.evidenceId)!}
                              onDelete={() => {
                                const item = evidence.find((saved) => saved.id === task.evidenceId);
                                if (item) void deleteEvidence(item);
                              }}
                            />
                          ) : task.evidenceId ? (
                            <div className="evidence-note" role="alert">
                              Saved photo not found.
                              <button className="evidence-delete" onClick={() => void clearMissingEvidence(task.id, task.evidenceId!)} type="button">Clear photo reference</button>
                            </div>
                          ) : quest.status === "active" ? (
                            <label className={`evidence-capture ${evidenceBusy === task.id ? "evidence-capture-busy" : ""}`}>
                              <span>{evidenceBusy === task.id ? "Saving photo…" : "Take or choose a photo"}</span>
                              <input
                                accept="image/*"
                                capture="environment"
                                disabled={evidenceBusy !== null}
                                onChange={(event) => {
                                  const file = event.currentTarget.files?.[0];
                                  event.currentTarget.value = "";
                                  if (file) void saveEvidence(task.id, file);
                                }}
                                type="file"
                              />
                            </label>
                          ) : <p className="evidence-note">No photo was saved for this task.</p>}
                          {!task.evidenceId && quest.status === "active" && <p className="evidence-note">Add a photo before checking this task off. It stays on this device.</p>}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
                {evidenceError && <p className="evidence-error" role="alert">{evidenceError}</p>}
                {quest.status === "active" && <p className="session-hint">Your progress is saved as you go. It’s okay to pause and look around.</p>}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
