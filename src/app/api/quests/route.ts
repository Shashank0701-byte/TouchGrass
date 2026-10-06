import { NextResponse } from "next/server";
import { makeFallbackQuest, isQuestSettings } from "@/lib/quest-generation";
import { generateQuestWithOllama } from "@/lib/ollama";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json({ error: "Send quest settings as JSON." }, { status: 415 });
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) {
        return NextResponse.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "The request origin is invalid." }, { status: 403 });
    }
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 2_048) {
    return NextResponse.json({ error: "Quest settings are too large." }, { status: 413 });
  }

  let settings: unknown;
  try {
    settings = await request.json();
  } catch {
    return NextResponse.json({ error: "Quest settings were not valid JSON." }, { status: 400 });
  }

  if (!isQuestSettings(settings)) {
    return NextResponse.json({ error: "Choose a supported duration, activity, and difficulty." }, { status: 400 });
  }

  try {
    const quest = await generateQuestWithOllama(settings, request.signal);
    return NextResponse.json({ quest, source: "ollama" });
  } catch {
    return NextResponse.json({
      quest: makeFallbackQuest(settings),
      source: "fallback",
      notice: "Your local model could not make a safe quest just now, so here is a ready-to-go one.",
    });
  }
}
