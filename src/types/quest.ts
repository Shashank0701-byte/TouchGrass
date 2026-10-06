export type Difficulty = "easy" | "medium" | "hard";

export type Activity = "walking" | "exploring" | "nature" | "photography";

export type QuestTask = {
  id: string;
  description: string;
  requiresPhoto: boolean;
  completed: boolean;
  evidenceId?: string;
};

export type Quest = {
  id: string;
  title: string;
  duration: number;
  difficulty: Difficulty;
  activity: Activity;
  tasks: QuestTask[];
  createdAt: number;
  status: "draft" | "prepared" | "active" | "completed";
};

export type QuestResult = {
  id: string;
  questId: string;
  completedAt: number;
  durationSeconds: number;
  xpEarned: number;
  completedTasks: number;
};

export type UserStats = {
  key: "user";
  xp: number;
  currentStreak: number;
  longestStreak: number;
  questsCompleted: number;
  totalOutdoorMinutes: number;
  lastCompletedDate?: string;
};

export type PhotoEvidence = {
  id: string;
  questId: string;
  taskId: string;
  createdAt: number;
  blob: Blob;
};
