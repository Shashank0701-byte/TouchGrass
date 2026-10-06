"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { db } from "@/lib/db";
import {
  makeFallbackQuest,
  prepareQuestForSaving,
  validateQuestDraft,
  type QuestDraft,
  type QuestGenerationSource,
  type QuestSettings,
} from "@/lib/quest-generation";
import type { Activity, Difficulty } from "@/types/quest";

const activities: { value: Activity; label: string; symbol: string }[] = [
  { value: "walking", label: "Walk", symbol: "↗" },
  { value: "exploring", label: "Explore", symbol: "⌖" },
  { value: "nature", label: "Nature", symbol: "✳" },
  { value: "photography", label: "Photo walk", symbol: "▧" },
];

const difficulties: { value: Difficulty; label: string; note: string }[] = [
  { value: "easy", label: "Easy", note: "Light and relaxed" },
  { value: "medium", label: "Medium", note: "A little more to do" },
  { value: "hard", label: "Hard", note: "A longer stretch" },
];

type GenerationResponse = {
  quest?: unknown;
  source?: unknown;
  notice?: unknown;
  error?: unknown;
};

export function QuestBuilder() {
  const [settings, setSettings] = useState<QuestSettings>({
    duration: 30,
    activity: "exploring",
    difficulty: "easy",
  });
  const [quest, setQuest] = useState<QuestDraft | null>(null);
  const [source, setSource] = useState<QuestGenerationSource | null>(null);
  const [notice, setNotice] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const generationController = useRef<AbortController | null>(null);

  function updateSettings(update: Partial<QuestSettings>) {
    generationController.current?.abort();
    generationController.current = null;
    setIsGenerating(false);
    setSettings((current) => ({ ...current, ...update }));
    setQuest(null);
    setSource(null);
    setNotice("");
    setSaved(false);
    setSaveError("");
  }

  function useFallback() {
    generationController.current?.abort();
    generationController.current = null;
    setIsGenerating(false);
    setQuest(makeFallbackQuest(settings));
    setSource("fallback");
    setNotice("A ready-to-go quest was made directly on this device.");
    setSaved(false);
    setSaveError("");
  }

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    generationController.current?.abort();
    const controller = new AbortController();
    generationController.current = controller;
    setIsGenerating(true);
    setQuest(null);
    setSource(null);
    setNotice("");
    setSaved(false);
    setSaveError("");

    try {
      const response = await fetch("/api/quests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
        signal: controller.signal,
      });
      const payload = await response.json() as GenerationResponse;
      if (!response.ok) {
        throw new Error(typeof payload.error === "string" ? payload.error : "Quest generation could not start.");
      }

      const validated = validateQuestDraft(payload.quest, settings);
      if (!validated) throw new Error("The generated quest did not match your choices.");
      setQuest(validated);
      setSource(payload.source === "ollama" ? "ollama" : "fallback");
      setNotice(typeof payload.notice === "string" ? payload.notice : "");
    } catch {
      if (controller.signal.aborted) return;
      setQuest(makeFallbackQuest(settings));
      setSource("fallback");
      setNotice("The local model could not be reached, so this safe quest was made on your device.");
    } finally {
      if (generationController.current === controller) {
        generationController.current = null;
        setIsGenerating(false);
      }
    }
  }

  async function saveQuest() {
    if (!quest || saved) return;
    setIsSaving(true);
    setSaveError("");
    try {
      await db.quests.add(prepareQuestForSaving(quest));
      setSaved(true);
    } catch {
      setSaveError("This device could not save the quest. Check available browser storage and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="builder-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="TouchGrass AI home">
          <span aria-hidden="true" className="create-leaf">✳</span>
          <span>touchgrass<span className="brand-ai">.ai</span></span>
        </Link>
        <Link className="back-link" href="/">BACK HOME <span aria-hidden="true">↗</span></Link>
      </header>

      <div className="builder-page">
        <div className="builder-heading">
          <p className="eyebrow"><span className="eyebrow-line" /> BEFORE YOU HEAD OUT</p>
          <h1>Make a little<br /><em>plan.</em></h1>
          <p className="hero-copy">Pick what feels right today. Your quest is made locally and can be saved to this device.</p>
        </div>

        <form className="quest-form" onSubmit={generate}>
          <fieldset>
            <legend><span className="field-number">01</span> How much time do you have?</legend>
            <div className="choice-row duration-options">
              {[15, 30, 60].map((duration) => (
                <button
                  aria-pressed={settings.duration === duration}
                  className="duration-option"
                  key={duration}
                  onClick={() => updateSettings({ duration: duration as QuestSettings["duration"] })}
                  type="button"
                >
                  <strong>{duration}</strong><span>MIN</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend><span className="field-number">02</span> What sounds good?</legend>
            <div className="choice-row activity-options">
              {activities.map((activity) => (
                <button
                  aria-pressed={settings.activity === activity.value}
                  className="activity-option"
                  key={activity.value}
                  onClick={() => updateSettings({ activity: activity.value })}
                  type="button"
                >
                  <span aria-hidden="true" className="activity-symbol">{activity.symbol}</span>
                  <span>{activity.label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend><span className="field-number">03</span> Set the pace.</legend>
            <div className="choice-row difficulty-options">
              {difficulties.map((difficulty) => (
                <button
                  aria-pressed={settings.difficulty === difficulty.value}
                  className="difficulty-option"
                  key={difficulty.value}
                  onClick={() => updateSettings({ difficulty: difficulty.value })}
                  type="button"
                >
                  <strong>{difficulty.label}</strong><span>{difficulty.note}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="builder-actions">
            <button className="generate-button" disabled={isGenerating} type="submit">
              <span>{isGenerating ? "Making your quest…" : "Generate my quest"}</span>
              <span aria-hidden="true" className="arrow">{isGenerating ? "· · ·" : "↗"}</span>
            </button>
            <button className="fallback-button" onClick={useFallback} type="button">
              Use a ready-made quest
            </button>
          </div>
        </form>

        {isGenerating && (
          <p aria-live="polite" className="generation-status">
            Asking the model on this computer to plan a safe little adventure…
          </p>
        )}

        {quest && (
          <section aria-labelledby="quest-preview-title" aria-live="polite" className="quest-preview">
            <div className="preview-topline">
              <span className={`source-pill ${source === "ollama" ? "source-local" : "source-fallback"}`}>
                {source === "ollama" ? "✳ MADE WITH YOUR LOCAL MODEL" : "✳ READY-TO-GO QUEST"}
              </span>
              <span className="quest-meta">{quest.duration} MIN&nbsp; · &nbsp;{quest.difficulty.toUpperCase()}</span>
            </div>
            <h2 id="quest-preview-title">{quest.title}</h2>
            {notice && <p className="quest-notice">{notice}</p>}
            <ol className="task-list">
              {quest.tasks.map((task, index) => (
                <li className="task-preview" key={`${index}-${task.description}`}>
                  <span className="task-index">{String(index + 1).padStart(2, "0")}</span>
                  <span>{task.description}</span>
                  {task.requiresPhoto && <span className="photo-tag">PHOTO</span>}
                </li>
              ))}
            </ol>
            {saveError && <p className="save-error" role="alert">{saveError}</p>}
            {saved ? (
              <div className="saved-banner" role="status">
                <span aria-hidden="true">✓</span>
                <div><strong>Saved on this device.</strong><br />Your offline-ready quest is tucked away here.</div>
              </div>
            ) : (
              <button className="save-button" disabled={isSaving} onClick={saveQuest} type="button">
                <span>{isSaving ? "Saving to this device…" : "Save quest to this device"}</span>
                <span aria-hidden="true">↓</span>
              </button>
            )}
            <p className="privacy-note">Your choices stay in this browser. The quest is generated by Ollama running on this computer.</p>
          </section>
        )}
      </div>
    </main>
  );
}
