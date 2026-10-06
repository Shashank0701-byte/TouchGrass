"use client";

import { liveQuery } from "dexie";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import type { Quest } from "@/types/quest";
import { QuestSession } from "@/components/quest-session";

const activityNames: Record<Quest["activity"], string> = {
  walking: "Walk",
  exploring: "Explore",
  nature: "Nature",
  photography: "Photo walk",
};

const statusNames: Record<Quest["status"], string> = {
  draft: "DRAFT · STORED HERE",
  prepared: "READY OFFLINE",
  active: "IN PROGRESS",
  completed: "COMPLETED",
};

export function QuestShelf() {
  const [quests, setQuests] = useState<Quest[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const subscription = liveQuery(() =>
      db.quests.orderBy("createdAt").reverse().toArray(),
    ).subscribe({
      next: (items) => {
        setQuests(items);
        setStorageError(false);
      },
      error: () => {
        setQuests([]);
        setStorageError(true);
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  async function markReady(quest: Quest) {
    setUpdatingId(quest.id);
    try {
      await db.quests.update(quest.id, { status: "prepared" });
    } catch {
      setStorageError(true);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section aria-labelledby="saved-quests-title" className="quest-shelf">
      <div className="shelf-heading">
        <div>
          <p className="shelf-eyebrow"><span className="eyebrow-line" /> KEPT ON THIS DEVICE</p>
          <h2 id="saved-quests-title">Your saved quests<span>.</span></h2>
        </div>
        <span className="shelf-count">
          {quests === null ? "···" : `${quests.length} ${quests.length === 1 ? "QUEST" : "QUESTS"}`}
        </span>
      </div>

      {quests === null ? (
        <p aria-live="polite" className="shelf-empty">Opening your local quest list…</p>
      ) : quests.length === 0 ? (
        <p className="shelf-empty">
          {storageError
            ? "This browser could not open local storage. Try again in a browser that supports IndexedDB."
            : "Your quests will show up here after you make one. They stay on this device."}
        </p>
      ) : (
        <div className="shelf-list">
          {quests.map((quest) => {
            const expanded = expandedId === quest.id;
            return (
              <article className={`shelf-card ${expanded ? "shelf-card-open" : ""}`} key={quest.id}>
                <button
                  aria-controls={`quest-details-${quest.id}`}
                  aria-expanded={expanded}
                  className="shelf-card-toggle"
                  onClick={() => setExpandedId(expanded ? null : quest.id)}
                  type="button"
                >
                  <span className="shelf-card-main">
                    <span className={`quest-status quest-status-${quest.status}`}>
                      <span aria-hidden="true" className="status-dot" />{statusNames[quest.status]}
                    </span>
                    <strong>{quest.title}</strong>
                    <span className="shelf-card-meta">
                      {quest.duration} MIN&nbsp; · &nbsp;{activityNames[quest.activity]}&nbsp; · &nbsp;{quest.difficulty}
                    </span>
                  </span>
                  <span aria-hidden="true" className="shelf-open-icon">{expanded ? "−" : "+"}</span>
                </button>

                {expanded && (
                  <div className="shelf-card-details" id={`quest-details-${quest.id}`}>
                    <ol className="shelf-task-list">
                      {quest.tasks.map((task, index) => (
                        <li key={task.id}>
                          <span className="task-index">{String(index + 1).padStart(2, "0")}</span>
                          <span>{task.description}</span>
                          {task.completed && <span aria-label="Complete" className="task-done">✓</span>}
                        </li>
                      ))}
                    </ol>
                    {quest.status === "draft" ? (
                      <button
                        className="shelf-ready-button"
                        disabled={updatingId === quest.id}
                        onClick={() => void markReady(quest)}
                        type="button"
                      >
                        {updatingId === quest.id ? "Preparing…" : "Mark ready for offline"}
                      </button>
                    ) : quest.status === "prepared" || quest.status === "active" ? (
                      <button className="shelf-ready-button" onClick={() => setSessionId(quest.id)} type="button">
                        {quest.status === "active" ? "Resume quest" : "Start quest"}
                      </button>
                    ) : (
                      <p className="shelf-ready-note">
                        Completed in {Math.floor((quest.durationSeconds ?? 0) / 60)} min. This quest is in your local history.
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
      {sessionId && <QuestSession questId={sessionId} onClose={() => setSessionId(null)} />}
    </section>
  );
}
