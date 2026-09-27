import { NextResponse } from "next/server";
import { isAiConfigured } from "@/lib/ai-server";

export function GET() {
  return NextResponse.json({ enabled: isAiConfigured });
}
