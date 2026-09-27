import { NextResponse } from "next/server";
import { clip, complete, extractJson, guard } from "@/lib/ai-server";

export const maxDuration = 60;

const SYSTEM = `Je bent "Flora", een warme, deskundige Nederlandse weddingplanner.
Je schrijft in helder, vriendelijk Nederlands (je/jullie-vorm), praktisch en concreet.
Je kent Nederlandse gebruiken: ondertrouw bij de gemeente, daggasten en avondgasten, ceremoniemeester, getuigen.`;

type Ctx = Record<string, unknown>;

const describe = (c: Ctx) =>
  [
    c.couple && `Stel: ${clip(c.couple, 120)}`,
    c.date && `Datum: ${clip(c.date, 40)}`,
    c.venue && `Locatie: ${clip(c.venue, 120)}`,
    c.city && `Plaats: ${clip(c.city, 80)}`,
    c.style && `Stijl: ${clip(c.style, 80)}`,
    c.guests && `Aantal gasten: ${clip(c.guests, 10)}`,
    c.budget && `Budget: €${clip(c.budget, 12)}`,
  ]
    .filter(Boolean)
    .join("\n");

export async function POST(req: Request) {
  const blocked = await guard(req);
  if (blocked) return blocked;

  let body: { task?: string; context?: Ctx };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek" }, { status: 400 });
  }
  const c = body.context ?? {};

  try {
    switch (body.task) {
      case "checklist": {
        const out = await complete(
          `${describe(c)}
Bestaande taken: ${clip(c.existing, 1500)}

Bedenk 6 extra, persoonlijke taken die passen bij deze bruiloft en die nog NIET in de lijst staan.
Antwoord ALLEEN met JSON: [{"title": string, "category": string, "months_before": number, "priority": "low"|"medium"|"high"}]
Kies category uit: Algemeen, Locatie, Ceremonie, Catering, Kleding & styling, Fotografie, Muziek, Bloemen & decoratie, Drukwerk, Gasten, Vervoer, Huwelijksreis.`,
          SYSTEM,
        );
        return NextResponse.json({ items: extractJson(out) });
      }

      case "timeline": {
        const out = await complete(
          `${describe(c)}
Tijd ceremonie: ${clip(c.ceremony_time, 10) || "14:00"}
Wensen: ${clip(c.wishes, 400) || "geen"}

Maak een realistisch draaiboek voor de trouwdag van ochtend tot einde feest (10-14 onderdelen).
Antwoord ALLEEN met JSON: [{"start_time": "HH:MM", "end_time": "HH:MM", "title": string, "location": string, "notes": string}]`,
          SYSTEM,
          1600,
        );
        return NextResponse.json({ items: extractJson(out) });
      }

      case "invitation": {
        const out = await complete(
          `${describe(c)}
Type: ${c.invited_to === "evening" ? "avondgasten" : "daggasten"}
Toon: ${clip(c.tone, 60) || "warm en feestelijk"}

Schrijf een korte uitnodigingstekst (max 90 woorden) die op een kaart of in een bericht kan. Geen onderwerpregel, geen uitleg.`,
          SYSTEM,
          500,
        );
        return NextResponse.json({ text: out });
      }

      case "vendor_email": {
        const out = await complete(
          `${describe(c)}
Leverancier: ${clip(c.vendor, 120)} (${clip(c.category, 60)})
Aanvullende wensen: ${clip(c.wishes, 400) || "geen"}

Schrijf een beknopte, vriendelijke e-mail om een offerte aan te vragen. Begin met "Onderwerp: ..." op de eerste regel.`,
          SYSTEM,
          700,
        );
        return NextResponse.json({ text: out });
      }

      case "image_prompt": {
        const out = await complete(
          `Stijl: ${clip(c.style, 80)}; kleuren: ${clip(c.colors, 120)}; onderwerp: ${clip(c.subject, 200)}.
Schrijf één Engelse, beeldende prompt (max 50 woorden) voor een AI-beeldgenerator die een moodboard-foto voor deze bruiloft maakt. Alleen de prompt, zonder aanhalingstekens.`,
          "You write concise, vivid prompts for image models.",
          200,
        );
        return NextResponse.json({ text: out.replace(/^["']|["']$/g, "") });
      }

      case "coach": {
        const question = clip(c.question, 800).trim();
        if (!question) return NextResponse.json({ error: "Stel eerst een vraag." }, { status: 400 });
        const out = await complete(
          `Over deze bruiloft:
${describe(c)}
Voortgang: ${clip(c.progress, 200)}

Vraag: ${question}

Geef een kort, concreet antwoord (max 150 woorden). Gebruik eventueel een korte opsomming.`,
          SYSTEM,
          600,
        );
        return NextResponse.json({ text: out });
      }

      default:
        return NextResponse.json({ error: "Onbekende taak" }, { status: 400 });
    }
  } catch (e) {
    console.error("[ai/text]", e);
    return NextResponse.json({ error: "De AI-assistent kon even niet antwoorden. Probeer het opnieuw." }, { status: 500 });
  }
}
