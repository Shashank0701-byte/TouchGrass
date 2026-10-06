# TouchGrass AI — Product Requirements Document

## 1. Product Overview

**TouchGrass AI** is an offline-first AI outdoor companion that uses an open-weight/local AI model to generate personalized real-world quests.

The core idea is simple:

> **AI should give you a reason to leave your screen, not another reason to stare at it.**

A user prepares a quest while online, saves everything required for the experience locally, then can turn off Wi-Fi/mobile data and complete the quest outdoors. The application continues working offline using local storage and cached application assets.

The project is designed for the Hacktoberfest Week 1 **“Touch Grass”** challenge and is intentionally scoped as a strong, buildable MVP rather than a full production platform.

---

## 2. Problem Statement

Most AI applications keep users on screens:

- AI chat
- AI content generation
- AI recommendations
- AI productivity tools

TouchGrass AI reverses this interaction.

Instead of generating more digital content, the AI generates a **physical activity** that encourages the user to:

- walk
- explore
- observe their surroundings
- interact with nature
- take breaks from screens
- discover places and objects around them

The challenge is to make this useful **without requiring an internet connection once the user goes outside**.

---

## 3. Product Goal

Build an installable, mobile-friendly PWA that can:

1. Generate personalized outdoor quests using an open-weight AI model.
2. Save the complete quest locally.
3. Continue functioning without internet/cellular data.
4. Let users complete tasks and track progress.
5. Allow optional photo evidence.
6. Award XP and maintain a local streak/history.
7. Clearly demonstrate the offline experience.

### Success criterion

A user should be able to:

> Generate a quest → save it → disable Wi-Fi and mobile data → complete the quest → finish it → receive XP.

If this works reliably, the MVP is successful.

---

# 4. Target Users

## Primary User

Students and young developers who:

- spend long periods on computers
- want to be more active
- enjoy gamified experiences
- like experimenting with AI
- want short outdoor activities rather than structured workouts

## Secondary Users

- hikers
- casual walkers
- photographers
- people trying to reduce screen time
- people exploring their local neighborhoods

---

# 5. Core Product Principles

### 5.1 Offline-first

The outdoor experience must not depend on:

- Wi-Fi
- mobile data
- cloud APIs
- remote databases

### 5.2 AI should be meaningful

The AI is not decoration.

The open-weight model is responsible for generating personalized quests based on structured user preferences.

### 5.3 Local-first data

Quest progress, XP, streaks, and evidence should be stored locally whenever possible.

### 5.4 Mobile-first

The user is expected to take the application outdoors.

The interface must work comfortably on a phone.

### 5.5 Simple interaction

The application should require minimal screen interaction while the user is outdoors.

---

# 6. MVP Features

## Feature 1 — Quest Generator

Users configure:

- Time available: 15 / 30 / 60 minutes
- Activity preference:
  - Walking
  - Exploring
  - Nature
  - Photography
- Difficulty:
  - Easy
  - Medium
  - Hard

The app sends these parameters to a locally running open-weight model through Ollama.

Example input:

```json
{
  "duration": 30,
  "activity": "exploring",
  "difficulty": "easy"
}
```

The model returns structured JSON.

Example:

```json
{
  "title": "Urban Explorer",
  "duration": 30,
  "difficulty": "easy",
  "tasks": [
    {
      "id": "task-1",
      "description": "Find something naturally occurring that is red.",
      "requiresPhoto": true
    },
    {
      "id": "task-2",
      "description": "Find a tree you have never noticed before.",
      "requiresPhoto": true
    },
    {
      "id": "task-3",
      "description": "Walk somewhere you have never walked before.",
      "requiresPhoto": false
    },
    {
      "id": "task-4",
      "description": "Sit somewhere for five minutes without using your phone.",
      "requiresPhoto": false
    }
  ]
}
```

### Requirements

- AI output must follow a predictable schema.
- Invalid AI output must be handled gracefully.
- The app should provide a fallback quest if AI generation fails.

---

# 7. Feature 2 — Quest Preparation

After generation, users see the complete quest.

Example:

```text
🌳 URBAN EXPLORER

30 MINUTES
EASY

□ Find something naturally occurring that is red.
□ Discover a tree you haven't noticed before.
□ Walk somewhere unfamiliar.
□ Sit for 5 minutes without your phone.

[ SAVE FOR OFFLINE ]
```

When the user selects **Save for Offline**:

- Quest is written to IndexedDB.
- Required app assets are available through the PWA cache.
- The quest becomes available without a network connection.

---

# 8. Feature 3 — Offline Mode

This is the most important feature.

The app must display a clear offline state:

```text
📵 OFFLINE MODE

No internet required.
Your quest is stored on this device.
```

The following must work offline:

- Opening the saved quest
- Starting the timer
- Viewing tasks
- Completing tasks
- Taking photos
- Saving photo evidence
- Calculating XP
- Completing the quest
- Updating streaks
- Viewing local history

No API request should be required for these operations.

---

# 9. Feature 4 — Quest Progress

The user can mark tasks complete.

Example:

```text
URBAN EXPLORER

✓ Find something red
✓ Discover a new tree
○ Walk somewhere unfamiliar
○ Sit for 5 minutes

Progress
████████░░ 50%
```

The progress state must persist if the application is closed.

---

# 10. Feature 5 — Photo Evidence

Some tasks may require evidence.

Example:

```json
{
  "requiresPhoto": true
}
```

The user can capture a photo directly from the phone.

### MVP behavior

- Store photo locally.
- Associate it with the relevant task.
- Allow the user to review/delete it.
- Do not upload it to a server.

### Future enhancement

A local/open-weight vision model can verify evidence.

Example:

```text
Photo
  ↓
Local vision model
  ↓
"Tree detected"
  ↓
Task verified
```

This is a **stretch goal**, not an MVP dependency.

---

# 11. Feature 6 — Quest Completion

When all required tasks are complete:

```text
🌱 YOU TOUCHED GRASS

30:42 OUTSIDE

████████████████████ 100%

+120 GRASS XP

🔥 4 DAY STREAK

[ DONE ]
```

The application stores:

- completion timestamp
- duration
- quest title
- tasks completed
- XP earned
- optional evidence references

---

# 12. Gamification

## Grass XP

Example scoring:

| Action | XP |
|---|---:|
| Complete easy quest | 50 |
| Complete medium quest | 100 |
| Complete hard quest | 150 |
| Complete optional bonus | +25 |
| Complete a streak milestone | +50 |

The exact scoring system can be adjusted during implementation.

## Streak

A streak increases when the user completes at least one quest on a day.

Example:

```text
MON ✓
TUE ✓
WED ✓
THU ✓
FRI —
SAT ✓

Current streak: 4 days
```

All streak data is local for the MVP.

---

# 13. Offline Architecture

## High-level architecture

```text
                         ONLINE
                           │
                           ▼
                  ┌─────────────────┐
                  │     Next.js     │
                  │       PWA       │
                  └────────┬────────┘
                           │
                     Generate Quest
                           │
                           ▼
                  ┌─────────────────┐
                  │     Ollama      │
                  │                 │
                  │ Open-weight LLM │
                  └────────┬────────┘
                           │
                    Structured JSON
                           │
                           ▼
                  ┌─────────────────┐
                  │    IndexedDB    │
                  │   Quest Pack    │
                  └────────┬────────┘
                           │
                     GO OUTSIDE
                           │
                           ▼
                    📵 OFFLINE MODE
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
           Tasks         Camera        Timer
             │             │             │
             └─────────────┼─────────────┘
                           │
                           ▼
                    Quest Completion
                           │
                           ▼
                     Local XP/History
```

---

# 14. Technology Stack

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- PWA
- Service Worker

## AI

- Ollama
- Qwen 2.5 3B/7B Instruct or another suitable open-weight instruction model

## Local Storage

- IndexedDB
- Dexie.js recommended for easier IndexedDB access

## Optional Future AI

- Open-weight local vision model

## No backend required for MVP

Avoid adding:

- PostgreSQL
- Prisma
- Firebase
- Redis
- WebSockets
- Authentication

unless a later feature genuinely requires them.

---

# 15. Data Model

## Quest

```typescript
type Quest = {
  id: string;
  title: string;
  duration: number;
  difficulty: "easy" | "medium" | "hard";
  activity: string;
  tasks: QuestTask[];
  createdAt: number;
};
```

## QuestTask

```typescript
type QuestTask = {
  id: string;
  description: string;
  requiresPhoto: boolean;
  completed: boolean;
  evidenceId?: string;
};
```

## QuestResult

```typescript
type QuestResult = {
  id: string;
  questId: string;
  completedAt: number;
  durationSeconds: number;
  xpEarned: number;
  completedTasks: number;
};
```

## UserStats

```typescript
type UserStats = {
  xp: number;
  currentStreak: number;
  longestStreak: number;
  questsCompleted: number;
  totalOutdoorMinutes: number;
};
```

---

# 16. Offline Strategy

## Service Worker

Cache:

- application shell
- JavaScript bundles
- CSS
- icons
- fonts
- static assets

## IndexedDB

Persist:

- generated quests
- quest progress
- quest history
- XP
- streak
- photo metadata
- local evidence

## Network behavior

### Online

```text
User → Next.js → Ollama
              ↓
          Quest JSON
              ↓
          IndexedDB
```

### Offline

```text
User
 ↓
PWA
 ↓
IndexedDB
 ↓
Quest
```

No server request should be necessary.

---

# 17. PWA Requirements

The application should:

- be installable
- have an app icon
- support standalone display
- cache the application shell
- detect online/offline state
- continue working after losing network connectivity

The app should display:

```text
Online:
🟢 ONLINE

Offline:
📵 OFFLINE
```

---

# 18. UI/UX

## Screen 1 — Home

```text
             🌱
        TOUCHGRASS

   Your AI outdoor companion

      [ CREATE A QUEST ]

          420 XP
       🔥 4 day streak
```

## Screen 2 — Create Quest

```text
CREATE YOUR QUEST

Time
[15] [30] [60]

Activity
[Walk] [Explore] [Nature] [Photo]

Difficulty
[Easy] [Medium] [Hard]

        [ GENERATE 🌱 ]
```

## Screen 3 — Quest

```text
🌳 URBAN EXPLORER

30 MINUTES

□ Find something red
□ Discover a new tree
□ Walk somewhere unfamiliar
□ Sit for 5 minutes

[ SAVE OFFLINE ]
```

## Screen 4 — Offline Quest

```text
📵 OFFLINE

URBAN EXPLORER

01:24
━━━━━━━━━━━━

✓ Find something red
○ Discover a new tree
○ Walk somewhere unfamiliar
○ Sit for 5 minutes
```

## Screen 5 — Completion

```text
🌱 YOU TOUCHED GRASS

30:42 OUTSIDE

████████████ 100%

+120 XP

🔥 4 DAY STREAK
```

---

# 19. Folder Structure

Recommended project structure:

```text
touchgrass-ai/
│
├── app/
│   ├── page.tsx
│   │
│   ├── prepare/
│   │   └── page.tsx
│   │
│   ├── quest/
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   ├── complete/
│   │   └── page.tsx
│   │
│   └── history/
│       └── page.tsx
│
├── components/
│   ├── QuestCard.tsx
│   ├── QuestGenerator.tsx
│   ├── QuestProgress.tsx
│   ├── QuestTimer.tsx
│   ├── CameraCapture.tsx
│   ├── OfflineBanner.tsx
│   ├── GrassXP.tsx
│   └── StreakDisplay.tsx
│
├── lib/
│   ├── ollama.ts
│   ├── db.ts
│   ├── offline.ts
│   ├── quest.ts
│   ├── xp.ts
│   └── streak.ts
│
├── types/
│   └── quest.ts
│
├── hooks/
│   ├── useOffline.ts
│   ├── useQuest.ts
│   └── useTimer.ts
│
├── public/
│   ├── icons/
│   ├── manifest.json
│   └── offline/
│
├── styles/
│   └── globals.css
│
├── prisma/                 # NOT REQUIRED FOR MVP
│
├── README.md
├── PRD.md
├── package.json
├── tsconfig.json
└── next.config.ts
```

### Important

The `prisma/` directory is intentionally marked as **not required**.

Do not introduce a database just because the project has user data. IndexedDB is sufficient for the MVP.

---

# 20. API / Module Responsibilities

## `lib/ollama.ts`

Responsible for:

- communicating with Ollama
- sending quest-generation prompts
- parsing model output
- validating JSON
- handling model errors

## `lib/db.ts`

Responsible for:

- IndexedDB initialization
- quest storage
- progress persistence
- history
- XP
- streak data
- evidence metadata

## `lib/offline.ts`

Responsible for:

- online/offline detection
- offline state
- service-worker integration helpers

## `lib/quest.ts`

Responsible for:

- quest validation
- fallback quests
- task completion logic
- completion detection

## `lib/xp.ts`

Responsible for:

- XP calculation
- bonus XP
- difficulty modifiers

## `lib/streak.ts`

Responsible for:

- calculating current streak
- updating longest streak
- handling missed days

---

# 21. AI Prompt Requirements

The quest generator prompt should instruct the model to:

1. Generate realistic physical activities.
2. Avoid dangerous activities.
3. Respect the user's available time.
4. Avoid requiring internet access.
5. Avoid requiring expensive equipment.
6. Produce structured JSON only.
7. Generate tasks that can realistically be completed outdoors.
8. Avoid requiring the user to enter private or dangerous areas.
9. Include optional photo evidence where appropriate.
10. Avoid repetitive quests when previous quest history is available.

Example system instruction:

```text
You are the quest-generation engine for TouchGrass AI.

Your job is to create safe, realistic outdoor activities that
encourage users to leave their screens.

The quest must:
- be completable without internet access
- require no expensive equipment
- fit within the requested duration
- be appropriate for a normal urban environment
- contain 3–5 tasks
- optionally include photo evidence
- never require entering private property
- never require dangerous behavior

Return valid JSON matching the provided schema.
```

---

# 22. Safety Requirements

The AI must not generate quests involving:

- dangerous roads
- trespassing
- climbing unsafe structures
- entering restricted areas
- dangerous wildlife interaction
- unsafe swimming
- illegal activities
- extreme physical challenges without appropriate context

If a generated quest fails validation, replace it with a safe fallback quest.

---

# 23. MVP Scope

## Must Have

- [ ] Next.js PWA
- [ ] Mobile-first UI
- [ ] Ollama integration
- [ ] Open-weight model quest generation
- [ ] Structured quest JSON
- [ ] IndexedDB persistence
- [ ] Offline quest access
- [ ] Offline task completion
- [ ] Timer
- [ ] Photo capture
- [ ] XP
- [ ] Streak
- [ ] Quest history
- [ ] Offline indicator
- [ ] PWA installability

## Should Have

- [ ] Better quest personalization
- [ ] Quest difficulty adaptation
- [ ] Photo evidence gallery
- [ ] Improved animations
- [ ] Better fallback quests

## Could Have

- [ ] Local vision model
- [ ] Offline maps
- [ ] GPS-based quests
- [ ] Weather-aware quest generation
- [ ] Local notifications

## Won't Have in MVP

- [ ] Authentication
- [ ] Cloud database
- [ ] Social profiles
- [ ] Leaderboards
- [ ] Friend system
- [ ] Cloud photo storage
- [ ] Real-time synchronization

---

# 24. Development Plan

## Phase 1 — Foundation

**~1 hour**

- Initialize Next.js
- Configure TypeScript
- Configure Tailwind
- Set up PWA
- Create base layout
- Create IndexedDB wrapper

## Phase 2 — AI Quest Generation

**~1 hour**

- Ollama integration
- Prompt engineering
- Quest JSON schema
- Response validation
- Fallback quests

## Phase 3 — Quest Experience

**~1.5 hours**

- Quest screen
- Task completion
- Timer
- Progress indicator
- Completion logic

## Phase 4 — Offline System

**~1.5 hours**

- Service worker
- App shell caching
- IndexedDB persistence
- Offline detection
- Offline quest flow

## Phase 5 — Gamification

**~45 minutes**

- XP
- Streaks
- History
- Completion screen

## Phase 6 — Evidence

**~45 minutes**

- Camera access
- Photo capture
- Local evidence storage
- Evidence gallery

## Phase 7 — Polish

**~1 hour**

- Mobile responsiveness
- Animations
- Empty states
- Error states
- Loading states
- Offline UX

## Phase 8 — Demo & Submission

**~1 hour**

- Test airplane mode
- Deploy
- Record demo
- Write DEV article
- Submit challenge

---

# 25. Demo Plan

The demo should prove the project's central claim.

### Demo sequence

1. Open TouchGrass AI.
2. Select:
   - 30 minutes
   - Explore
   - Easy
3. Generate quest using the open-weight model.
4. Save the quest for offline use.
5. Show the quest exists locally.
6. Disable Wi-Fi.
7. Disable mobile data.
8. Reload/open the PWA.
9. Show `📵 OFFLINE MODE`.
10. Start the quest.
11. Complete tasks.
12. Capture photo evidence.
13. Finish the quest.
14. Show XP/streak update.

The most important moment of the demo:

> **Internet disabled → application still works.**

---

# 26. Hacktoberfest Submission Story

The project should be positioned around three ideas:

### 1. Open AI

TouchGrass uses an open-weight model rather than requiring a proprietary cloud AI API.

### 2. Offline-first

The user can leave connectivity behind and still use the core application.

### 3. AI that gets you away from AI

The product deliberately uses AI to reduce screen time rather than increase it.

Potential tagline:

> **“An AI that tells you to stop using AI.”**

Alternative:

> **“Generate online. Touch grass offline.”**

---

# 27. Future Roadmap

## V2

- Local vision verification
- Offline maps
- GPS-based exploration
- Better personalization
- Weather-aware quests
- More activity categories

## V3

- Fully local AI inference on mobile
- Adaptive quest generation
- Environmental recognition
- Accessibility-aware quests
- Community-created quest templates

## Long-term

TouchGrass could evolve into a complete **offline-first outdoor AI companion** where the AI handles planning and personalization, while the actual experience happens away from the screen.

---

# 28. Definition of Done

The MVP is considered complete when:

- [ ] A user can generate a quest using an open-weight model.
- [ ] The quest can be saved locally.
- [ ] The app can be opened without internet after preparation.
- [ ] Tasks can be completed offline.
- [ ] Timer works offline.
- [ ] Photos can be captured and stored locally.
- [ ] Quest completion works offline.
- [ ] XP and streaks persist.
- [ ] PWA can be installed.
- [ ] The complete demo works with Wi-Fi and mobile data disabled.
- [ ] The project has a clear README explaining the architecture.
- [ ] The Hacktoberfest submission clearly demonstrates why open/local AI matters.

---

# 29. Final Product Definition

**TouchGrass AI is not an AI chatbot.**

It is an **offline-first outdoor quest engine**.

The fundamental loop is:

```text
        GENERATE
           │
           ▼
       PREPARE
           │
           ▼
       DISCONNECT
           │
           ▼
      GO OUTSIDE 🌱
           │
           ▼
       COMPLETE
           │
           ▼
       GET XP
           │
           ▼
        RETURN
```

The product succeeds when the user spends **less time interacting with the application and more time interacting with the real world**.
