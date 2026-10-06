import type { Activity, Difficulty } from "@/types/quest";
import { validateQuestDraft, type QuestDraft, type QuestSettings } from "@/lib/quest-generation";

const questSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    activity: { type: "string", enum: ["exploring", "nature", "photography", "walking"] },
    difficulty: { type: "string", enum: ["easy", "hard", "medium"] },
    duration: { type: "integer", enum: [15, 30, 60] },
    tasks: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          description: { type: "string" },
          requiresPhoto: { type: "boolean" },
        },
        required: ["description", "requiresPhoto"],
      },
    },
    title: { type: "string" },
  },
  required: ["activity", "difficulty", "duration", "tasks", "title"],
} as const;

function promptFor(settings: QuestSettings): string {
  const activityNames: Record<Activity, string> = {
    walking: "a gentle walk",
    exploring: "noticing new details on familiar public routes",
    nature: "observing nearby nature",
    photography: "thoughtful outdoor photography",
  };
  const difficultyNames: Record<Difficulty, string> = {
    easy: "gentle and accessible",
    medium: "moderately engaging without being strenuous",
    hard: "more involved but still safe and comfortable for a typical person",
  };

  return [
    "Create a realistic outdoor quest for a person using a phone app.",
    `Activity: ${activityNames[settings.activity]}.`,
    `Available time: ${settings.duration} minutes total.`,
    `Difficulty: ${difficultyNames[settings.difficulty]}.`,
    "Return 3 to 5 short tasks whose total effort fits the selected time.",
    "Use only public, familiar, accessible outdoor spaces. Require no equipment or internet.",
    "Never suggest trespassing, traffic risks, climbing, water activities, approaching wildlife, or entering buildings or restricted areas.",
    "Photo evidence is optional; never photograph people or private spaces.",
    "Keep each task concrete, kind, and easy to understand at a glance.",
    "Return JSON with the schema fields in this exact order: activity, difficulty, duration, tasks, title.",
    `Set activity to \"${settings.activity}\", difficulty to \"${settings.difficulty}\", and duration to ${settings.duration}.`,
    "Return JSON only.",
  ].join("\n");
}

export async function generateQuestWithOllama(settings: QuestSettings, requestSignal?: AbortSignal): Promise<QuestDraft> {
  const baseUrl = (process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434").replace(/\/+$/, "");
  const model = process.env.OLLAMA_MODEL ?? "qwen2.5-coder:7b";

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    signal: requestSignal
      ? AbortSignal.any([requestSignal, AbortSignal.timeout(120_000)])
      : AbortSignal.timeout(120_000),
    body: JSON.stringify({
      model,
      stream: false,
      format: questSchema,
      messages: [
        {
          role: "system",
          content: "You create safe outdoor activities. Follow the requested JSON schema and safety constraints exactly.",
        },
        { role: "user", content: promptFor(settings) },
      ],
      options: { temperature: 0, num_predict: 500 },
    }),
  });

  if (!response.ok) throw new Error(`Ollama responded with ${response.status}`);

  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object" || !("message" in payload)) {
    throw new Error("Ollama returned an unexpected response.");
  }

  const message = payload.message;
  if (!message || typeof message !== "object" || !("content" in message) || typeof message.content !== "string") {
    throw new Error("Ollama did not return quest JSON.");
  }

  let candidate: unknown;
  try {
    candidate = JSON.parse(message.content);
  } catch {
    throw new Error("Ollama returned invalid JSON.");
  }

  const quest = validateQuestDraft(candidate, settings);
  if (!quest) throw new Error("Ollama returned a quest outside the expected schema or safety rules.");
  return quest;
}
