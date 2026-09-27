import { ButtonLink } from "@/components/ui/button";
import { RingsMark } from "@/components/decor/logo";

export default function NotFound() {
  return (
    <main className="paper grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <RingsMark className="mx-auto size-14" />
        <p className="mt-6 font-script text-4xl text-gold-600">Oeps…</p>
        <h1 className="text-4xl font-semibold">Deze pagina bestaat niet</h1>
        <p className="mt-2 text-ink-500">Misschien is de link verouderd of verkeerd getypt.</p>
        <ButtonLink href="/" className="mt-8">Terug naar home</ButtonLink>
      </div>
    </main>
  );
}
