import type { Activity, Difficulty, Quest, QuestTask } from "@/types/quest";

export const QUEST_DURATIONS = [15, 30, 60] as const;

export type QuestSettings = {
  duration: (typeof QUEST_DURATIONS)[number];
  activity: Activity;
  difficulty: Difficulty;
};

export type QuestTaskDraft = Pick<QuestTask, "description" | "requiresPhoto">;

export type QuestDraft = Omit<Quest, "id" | "createdAt" | "status" | "tasks"> & {
  tasks: QuestTaskDraft[];
};

export type QuestGenerationSource = "ollama" | "fallback";

const activities: Activity[] = ["walking", "exploring", "nature", "photography"];
const difficulties: Difficulty[] = ["easy", "medium", "hard"];
const riskyInstructions = /\b(trespass|private property|restricted area|climb(?:ing)?|swim(?:ming)?|railway tracks?|motorway|highway|approach .{0,24}wildlife|feed .{0,24}wildlife|enter .{0,24}(?:building|construction|restricted|abandoned)|(?:cross|walk along|step into) .{0,28}(?:busy|major|high-speed|unmarked) (?:road|street)|(?:photograph|photo(?:graph)? of) .{0,28}(?:people|person|private home|inside a house))\b/i;

const fallbackTasks: Record<Activity, QuestTaskDraft[]> = {
  walking: [
    { description: "Take a comfortable walk along a public path you know.", requiresPhoto: false },
    { description: "Pause in a safe place and notice three sounds around you.", requiresPhoto: false },
    { description: "Notice one small detail you might usually pass by.", requiresPhoto: false },
    { description: "Take five slow breaths before you head back at an easy pace.", requiresPhoto: false },
    { description: "Name one part of the walk that helped you feel more present.", requiresPhoto: false },
  ],
  exploring: [
    { description: "Choose a familiar public route and spot one detail you had not noticed before.", requiresPhoto: false },
    { description: "Look for an interesting shape in a sign, doorway, or window while staying on the public path.", requiresPhoto: false },
    { description: "Find a color in your surroundings that you rarely stop to notice.", requiresPhoto: false },
    { description: "Pause somewhere comfortable and take in the view for two minutes.", requiresPhoto: false },
    { description: "Return by a familiar public path that feels safe and comfortable.", requiresPhoto: false },
  ],
  nature: [
    { description: "From a public path, notice the shape of a nearby leaf, branch, or blade of grass.", requiresPhoto: false },
    { description: "Listen for two different natural sounds, keeping a respectful distance from wildlife.", requiresPhoto: false },
    { description: "Find a natural texture or pattern without picking anything up.", requiresPhoto: false },
    { description: "Spot one small sign of the season in your surroundings.", requiresPhoto: false },
    { description: "Watch leaves, clouds, or shifting light for two quiet minutes.", requiresPhoto: false },
  ],
  photography: [
    { description: "Photograph a close-up texture in nature; leave people and wildlife out of frame.", requiresPhoto: true },
    { description: "Find two colors in the landscape that make an interesting pair and photograph them.", requiresPhoto: true },
    { description: "Capture a play of light and shadow from a public path.", requiresPhoto: true },
    { description: "Photograph one small detail you might normally walk past.", requiresPhoto: true },
    { description: "Choose your favorite image and notice what made you stop for the scene.", requiresPhoto: false },
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isQuestSettings(value: unknown): value is QuestSettings {
  if (!isRecord(value)) return false;
  return QUEST_DURATIONS.includes(value.duration as QuestSettings["duration"])
    && activities.includes(value.activity as Activity)
    && difficulties.includes(value.difficulty as Difficulty);
}

export function validateQuestDraft(value: unknown, settings: QuestSettings): QuestDraft | null {
  if (!isRecord(value)) return null;
  if (value.activity !== settings.activity || value.difficulty !== settings.difficulty) return null;
  if (value.duration !== settings.duration || typeof value.title !== "string") return null;

  const title = value.title.trim();
  if (title.length < 3 || title.length > 52 || !Array.isArray(value.tasks)) return null;
  if (value.tasks.length < 3 || value.tasks.length > 5) return null;

  const tasks: QuestTaskDraft[] = [];
  for (const candidate of value.tasks) {
    if (!isRecord(candidate) || typeof candidate.description !== "string" || typeof candidate.requiresPhoto !== "boolean") {
      return null;
    }
    const description = candidate.description.trim();
    if (description.length < 8 || description.length > 180 || riskyInstructions.test(description)) return null;
    tasks.push({ description, requiresPhoto: candidate.requiresPhoto });
  }

  return {
    title,
    duration: settings.duration,
    activity: settings.activity,
    difficulty: settings.difficulty,
    tasks,
  };
}

export function makeFallbackQuest(settings: QuestSettings): QuestDraft {
  const activityNames: Record<Activity, string> = {
    walking: "Easy-Paced Wander",
    exploring: "Notice Something New",
    nature: "Small Nature, Big Sky",
    photography: "Light and Little Details",
  };
  const count = settings.duration === 15 ? 3 : settings.duration === 30 ? 4 : 5;

  return {
    title: activityNames[settings.activity],
    duration: settings.duration,
    activity: settings.activity,
    difficulty: settings.difficulty,
    tasks: fallbackTasks[settings.activity].slice(0, count),
  };
}

export function prepareQuestForSaving(draft: QuestDraft): Quest {
  return {
    ...draft,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    status: "prepared",
    tasks: draft.tasks.map((task) => ({
      ...task,
      id: crypto.randomUUID(),
      completed: false,
    })),
  };
}
