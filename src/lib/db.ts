import Dexie, { type EntityTable } from "dexie";
import type { PhotoEvidence, Quest, QuestResult, UserStats } from "@/types/quest";

export const db = new Dexie("touchgrass-ai") as Dexie & {
  quests: EntityTable<Quest, "id">;
  results: EntityTable<QuestResult, "id">;
  stats: EntityTable<UserStats, "key">;
  evidence: EntityTable<PhotoEvidence, "id">;
};

db.version(1).stores({
  quests: "id, createdAt, status",
  results: "id, questId, completedAt",
  stats: "key",
  evidence: "id, questId, taskId, createdAt",
});
