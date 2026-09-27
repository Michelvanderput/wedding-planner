# Ja, ik wil! · Bruiloftsplanner

Een moderne, Nederlandstalige webapp waarmee stellen hun bruiloft zelf plannen. Alles staat in één overzichtelijk dashboard:

| Onderdeel | Wat je ermee doet |
|---|---|
| **Overzicht** | Live aftellen, voortgangsring, statistieken, eerstvolgende taken, RSVP en budget in één oogopslag |
| **Takenlijst** | Complete checklist die terugrekent vanaf de trouwdatum, gegroepeerd per periode of categorie |
| **Gasten** | Dag- en avondgasten, RSVP-status, +1, dieetwensen, lijst plakken, CSV-export, persoonlijke RSVP-links |
| **Budget** | Automatische verdeling, gepland vs. besteed per categorie, betaalstatus, gekoppeld aan leveranciers |
| **Leveranciers** | Pipeline-bord (Idee → Contact → Offerte → Geboekt), beoordelingen, direct naar budget |
| **Draaiboek** | Tijdlijn van de grote dag, printbaar |
| **Tafelschikking** | Gasten naar tafels slepen (of kiezen via menu), capaciteitscontrole, visuele tafels |
| **Inspiratie** | Moodboard met AI-gegenereerde beelden in jullie stijl en kleuren |

### AI-versnellers (fal.ai)

- **Vraag het Flora**: AI-weddingcoach op het dashboard
- **AI-suggesties**: extra persoonlijke taken voor de takenlijst
- **Uitnodigingstekst**: in verschillende tonen, voor dag- of avondgasten
- **Offerte-mail**: concept-e-mail per leverancier, direct te openen in je mailprogramma
- **Draaiboek genereren**: complete dagplanning op basis van ceremonietijd en wensen
- **Moodboard**: beelden genereren (Flux Schnell) + prompt verfraaien

Zonder `FAL_KEY` werkt de app gewoon; de AI-knoppen verdwijnen dan of tonen een melding.

---

## Techniek

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** met een eigen design system (rozenblad, champagne, salie, ivoor)
- **Framer Motion** voor animaties (houdt rekening met `prefers-reduced-motion`)
- **Supabase** (Postgres + Auth + Row Level Security) — optioneel
- **fal.ai** via server-side API-routes (je key komt nooit in de browser)

### Twee opslagmodi

De app kiest automatisch:

1. **Lokale modus**: geen Supabase-variabelen ingesteld. Data staat in `localStorage`, er is geen login nodig. Ideaal om direct te testen.
2. **Supabase-modus**: `NEXT_PUBLIC_SUPABASE_URL` en `NEXT_PUBLIC_SUPABASE_ANON_KEY` zijn gezet. Gebruikers loggen in (wachtwoord of magic link) en data wordt veilig per account opgeslagen. Een planning uit lokale modus kan bij de onboarding met één klik worden geïmporteerd.

---

## Lokaal draaien

```bash
npm install
cp .env.example .env.local   # vul in wat je hebt (alles is optioneel)
npm run dev
```

Open http://localhost:3000.

## Supabase koppelen

1. Maak een project aan op [supabase.com](https://supabase.com).
2. Ga naar **SQL Editor**, plak de inhoud van [`supabase/migrations/20260927000000_init.sql`](supabase/migrations/20260927000000_init.sql) en klik op **Run**.
   (Of gebruik de CLI: `supabase link --project-ref <ref>` en daarna `supabase db push`.)
3. Kopieer uit **Project Settings → API** de *Project URL* en de *anon public key* naar:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
4. Ga naar **Authentication → URL Configuration**:
   - *Site URL*: `https://jouw-app.vercel.app`
   - *Redirect URLs*: `https://jouw-app.vercel.app/auth/callback` (en `http://localhost:3000/auth/callback` voor lokaal)
5. Wil je dat mensen direct kunnen inloggen zonder e-mailbevestiging? Zet dan **Authentication → Providers → Email → Confirm email** uit.

Wat het schema regelt:
- Tabellen voor bruiloften, taken, gasten, leveranciers, budget, draaiboek, tafels en inspiratie
- **Row Level Security**: gebruikers zien alleen hun eigen bruiloft
- `wedding_members`: klaar om later een partner of ceremoniemeester mee te laten plannen
- `get_rsvp` / `submit_rsvp`: veilige functies waarmee gasten zonder account via hun persoonlijke link kunnen reageren (`/rsvp/<token>`)

## fal.ai koppelen

Zet je key in de omgevingsvariabelen (alleen server-side):

```
FAL_KEY=...
```

Optioneel kun je de modellen aanpassen:

```
FAL_LLM_MODEL=google/gemini-2.5-flash     # via fal "openrouter/router"
FAL_IMAGE_MODEL=fal-ai/flux/schnell
```

De AI-routes zijn beschermd: in Supabase-modus alleen voor ingelogde gebruikers, en altijd met een eenvoudige rate limit (40 verzoeken per 10 minuten per gebruiker of IP).

## Deployen naar Vercel

1. Push deze repo naar GitHub en importeer hem in [Vercel](https://vercel.com/new). Het framework (Next.js) wordt automatisch herkend.
2. Voeg bij **Settings → Environment Variables** toe:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (bijv. `https://jouw-app.vercel.app`)
   - `FAL_KEY`
3. Deploy. Pas je later variabelen aan die met `NEXT_PUBLIC_` beginnen? Doe dan een redeploy, want die worden tijdens de build ingebakken.

> Tip: gebruik je de Supabase-integratie in de Vercel Marketplace, dan worden de Supabase-variabelen automatisch gezet.

## Projectstructuur

```
src/
  app/
    page.tsx                 landingspagina
    login/                   inloggen / registreren / magic link
    auth/callback/           Supabase OAuth/e-mail callback
    rsvp/[token]/            publieke RSVP-pagina voor gasten
    (app)/onboarding/        wizard in 5 stappen
    (app)/dashboard/…        alle dashboardpagina's
    api/ai/{text,image,status}  fal.ai-routes (server-side)
  components/               UI, dashboard-shell, decoratie
  lib/
    store.tsx                centrale state (optimistische updates)
    data/                    lokale en Supabase-adapter (zelfde interface)
    defaults.ts              checklist, budgetverdeling, draaiboek, demodata
    ai-server.ts             fal-client, rate limit, prompts-helpers
  proxy.ts                   sessie verversen + routes beschermen (Next 16 "proxy")
supabase/migrations/         databaseschema + RLS
```
