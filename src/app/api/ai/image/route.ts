import { NextResponse } from "next/server";
import { IMAGE_MODEL, clip, fal, guard } from "@/lib/ai-server";

export const maxDuration = 60;

export async function POST(req: Request) {
  const blocked = await guard(req);
  if (blocked) return blocked;

  try {
    const body = (await req.json()) as { prompt?: string };
    const prompt = clip(body.prompt, 800).trim();
    if (!prompt) return NextResponse.json({ error: "Beschrijf eerst wat je wilt zien." }, { status: 400 });

    const res = await fal.subscribe(IMAGE_MODEL, {
      input: {
        prompt: `${prompt}. Elegant wedding photography, editorial, soft natural light, high detail`,
        image_size: "landscape_4_3",
        num_images: 1,
        enable_safety_checker: true,
      },
    });
    const url = (res.data as { images?: { url: string }[] }).images?.[0]?.url;
    if (!url) throw new Error("Geen afbeelding ontvangen");
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[ai/image]", e);
    return NextResponse.json({ error: "Het genereren van de afbeelding is mislukt." }, { status: 500 });
  }
}
