# Ja, ik wil! · Bruiloftsplanner

Een moderne, Nederlandstalige webapp waarmee stellen hun bruiloft zelf plannen. Alles staat in één overzichtelijk dashboard:

| Onderdeel | Wat je ermee doet |
|---|---|
| **Overzicht** | Live aftellen, voortgangsring, statistieken, eerstvolgende taken, RSVP en budget in één oogopslag |
| **Takenlijst** | Complete checklist die terugrekent vanaf de trouwdatum, per periode of categorie; taken toewijzen aan wie ze oppakt |
| **Gasten** | Dag- en avondgasten, RSVP, +1, dieetwensen, menukeuze en eigen vragen, Excel-template + import/export, persoonlijke links, QR-kaartjes en RSVP-herinneringen via WhatsApp/e-mail |
| **Budget** | Automatische verdeling, gepland vs. besteed, betaaldata en aanbetalingen, 'nog te betalen'-overzicht, waarschuwing bij overschrijding |
| **Leveranciers** | Pipeline-bord (Idee → Contact → Offerte → Geboekt), beoordelingen, direct naar budget, contracten en offertes uploaden |
| **Draaiboek** | Tijdlijn van de grote dag, printbaar; per onderdeel kiezen wie het op de uitnodiging ziet |
| **Tafelschikking** | Gasten naar tafels slepen (of kiezen via menu), capaciteitscontrole, visuele tafels, printversie |
| **Fotolijst** | Standaardlijst van must-have foto's, eigen toevoegingen, afvinken, printen of als tekst naar je fotograaf |
| **Cadeaulijst** | Cadeaus en geldpotten; gasten reserveren of dragen bij via hun uitnodiging, jullie zien wie wat geeft |
| **Inspiratie** | Moodboard met AI-gegenereerde beelden in jullie stijl en kleuren |
| **Uitnodiging** | Eigen uitnodigingswebsite voor gasten: programma, locatie + route, praktische info, FAQ, cadeaulijst, gastenboek, agenda-export en RSVP. Vormgeving naar keuze: 12 thema's, eigen kleuren, 10 lettertypecombinaties, achtergronden, versiering, indelingen en volgorde van onderdelen, met live voorbeeld |
| **Samen plannen** | Partner uitnodigen via een eenmalige link; maximaal twee beheerders per bruiloft |

### Voor gasten

- **Persoonlijke link** (`/rsvp/<token>`): uitnodiging met naam, het juiste programma (daggast ziet alles, avondgast alleen het avondprogramma) en een RSVP-formulier. Te delen via kopiëren of WhatsApp vanuit het gastenoverzicht.
- **Algemene link** (`/uitnodiging/<naam>`): optioneel, alleen zichtbaar als jullie hem publiceren. Zonder RSVP en zonder persoonlijke gegevens.

Gasten zien nooit het budget, andere gasten of leveranciers; dat wordt in de database afgedwongen.

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
2. Maak de tabellen aan. Kies één van beide:
   - **Eenvoudigst:** open **SQL Editor → New query**, plak de volledige inhoud van [`supabase/setup.sql`](supabase/setup.sql) en klik **Run**. Dat zijn alle migraties in één transactie; opnieuw draaien kan veilig.
   - **Automatisch via GitHub:** Supabase → **Project Settings → Integrations → GitHub**: koppel deze repo, zet *Supabase directory* op `.` (de map waarin `supabase/` staat), *Production branch* op de branch die je deployt en zet **Deploy to production** aan. Nieuwe bestanden in `supabase/migrations/` worden dan bij elke push uitgevoerd.

   Of met de CLI: `supabase link --project-ref <ref>` en daarna `supabase db push`.
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
- **Samen plannen**: `wedding_members` met maximaal 2 personen; de partner komt er alleen bij via een eenmalige code van de eigenaar (`create_partner_invite` / `accept_partner_invite`), en eigenaarschap kan niet worden overgenomen
- **Gasten zonder account**: `get_invitation`, `get_wedding_site` en `submit_rsvp` geven alleen de gegevens vrij die op de uitnodiging horen

### Alleen het bruidspaar laten inloggen

Standaard kan iedereen een account maken, maar ziet elk account alleen de eigen planning. Wil je dat verder niemand kan inloggen:

1. Zet in Vercel `ALLOWED_EMAILS` met jullie twee e-mailadressen, gescheiden door een komma:
   ```
   ALLOWED_EMAILS=emma@voorbeeld.nl,lucas@voorbeeld.nl
   ```
   Andere accounts worden bij het inloggen direct geweigerd en uitgelogd.
2. Maak jullie accounts aan en zet daarna in Supabase **Authentication → Providers → Email → Allow new users to sign up** uit.

Gastpagina's (uitnodiging en RSVP) blijven gewoon werken.

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

## Gastenlijst via Excel

Bij **Gasten → Excel import**:
1. Download het template. Het heeft keuzelijsten voor *Uitgenodigd als*, *Kant*, *+1* en *RSVP*, en een tabblad met uitleg.
2. Vul het in (Excel, Numbers, Google Sheets → downloaden als .xlsx) en upload het.
3. Je ziet eerst een voorbeeld: nieuwe gasten, gasten die worden bijgewerkt (zelfde naam) en regels met fouten.

Eigen bestanden werken ook: .xlsx of .csv, zolang er een kolom *Naam* in staat. Kolomnamen als *E-mail*, *Telefoon*, *Dieet*, *Type* en *Introducé* worden automatisch herkend. Met **Excel** (export) download je de huidige lijst in hetzelfde formaat, om aan te passen en opnieuw te uploaden.

De AI-routes zijn beschermd: in Supabase-modus alleen voor ingelogde gebruikers, en altijd met een eenvoudige rate limit (40 verzoeken per 10 minuten per gebruiker of IP).

## Deployen naar Vercel

1. Importeer de repo in [Vercel](https://vercel.com/new).
   - **Root Directory:** `./` (de hoofdmap van de repo, niet `src` of `supabase`)
   - **Framework Preset:** Next.js. `vercel.json` legt dit ook vast.
   - **Node.js-versie:** 20 of hoger (Project Settings → General). Next.js 16 werkt niet op Node 18.
2. Voeg bij **Settings → Environment Variables** toe:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (bijv. `https://jouw-app.vercel.app`)
   - `FAL_KEY`
3. Deploy. Pas je later variabelen aan die met `NEXT_PUBLIC_` beginnen? Doe dan een redeploy, want die worden tijdens de build ingebakken.

> Tip: gebruik je de Supabase-integratie in de Vercel Marketplace, dan worden de Supabase-variabelen automatisch gezet.
> De app accepteert zowel `NEXT_PUBLIC_SUPABASE_URL` als `SUPABASE_URL`, en voor de key `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_ANON_KEY` of `SUPABASE_PUBLISHABLE_KEY`.

### Controleren of alles werkt

Open `https://<jouw-app>/api/status`. Je ziet dan bijvoorbeeld:

```json
{ "storage": "supabase", "database": "ok", "ai": "enabled" }
```

- `database: "missing_tables"` → de migratie is nog niet uitgevoerd (zie *Supabase koppelen*, stap 2)
- `storage: "local"` → de Supabase-variabelen zijn niet gevonden; redeploy na het toevoegen ervan
- `ai: "disabled"` → `FAL_KEY` ontbreekt

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
