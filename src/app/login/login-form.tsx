"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Mail, MailCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Logo } from "@/components/decor/logo";
import { Petals } from "@/components/decor/petals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { publicOrigin } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup" | "magic";

export function LoginForm() {
  const sb = getSupabaseBrowser();
  const params = useSearchParams();
  const toast = useToast();
  const rawNext = params.get("next") || "/dashboard";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  /** Volledige navigatie: de nieuwe sessie-cookie gaat zeker mee en er wordt geen oude
   *  (gecachte) doorverwijzing naar /login hergebruikt. */
  const go = (url: string) => window.location.assign(url);

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const errParam = params.get("error");
  const [error, setError] = useState(
    errParam === "not_allowed"
      ? "Dit account heeft geen toegang tot deze planner. Alleen het bruidspaar kan inloggen."
      : errParam
        ? "Inloggen via de link is mislukt. Probeer het opnieuw."
        : "",
  );

  // Niet-toegestaan account direct uitloggen, zodat een ander account kan inloggen.
  useEffect(() => {
    if (errParam !== "not_allowed") return;
    setError("Dit account heeft geen toegang tot deze planner. Alleen het bruidspaar kan inloggen.");
    void sb?.auth.signOut();
  }, [errParam, sb]);

  const redirectTo = () =>
    `${publicOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!sb) return;
    setError("");
    setLoading(true);
    try {
      if (mode === "magic") {
        const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
        if (error) throw error;
        setSent(true);
      } else if (mode === "signup") {
        const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } });
        if (error) throw error;
        if (data.session) go(next);
        else setSent(true);
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welkom terug!");
        go(next);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        /invalid login/i.test(msg)
          ? "E-mailadres of wachtwoord klopt niet."
          : /already registered/i.test(msg)
            ? "Dit e-mailadres heeft al een account. Log in."
            : msg || "Er ging iets mis.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="paper relative grid min-h-dvh place-items-center px-4 py-10">
      <Petals count={10} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="card relative w-full max-w-md p-8"
      >
        <div className="flex justify-center">
          <Logo />
        </div>

        {!sb ? (
          <div className="mt-8 text-center">
            <h1 className="text-3xl font-semibold">Lokale modus</h1>
            <p className="mt-2 text-ink-500">
              Supabase is nog niet gekoppeld, dus je gegevens worden in deze browser bewaard. Je kunt direct beginnen.
            </p>
            <Link href="/dashboard" className="mt-6 inline-block font-medium text-rose-700 underline-offset-4 hover:underline">
              Naar het dashboard →
            </Link>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="sent" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 text-center">
                <div className="mx-auto grid size-16 place-items-center rounded-full bg-sage-50 ring-1 ring-sage-200">
                  <MailCheck className="size-7 text-sage-600" aria-hidden />
                </div>
                <h1 className="mt-5 text-3xl font-semibold">Check je inbox</h1>
                <p className="mt-2 text-ink-500">
                  We hebben een link gestuurd naar <strong className="text-ink-900">{email}</strong>. Klik erop om verder te gaan.
                </p>
                <button onClick={() => setSent(false)} className="mt-6 text-sm font-medium text-rose-700 hover:underline">
                  Ander e-mailadres gebruiken
                </button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="mt-6 text-center text-3xl font-semibold">
                  {mode === "signup" ? "Maak jullie account" : "Welkom terug"}
                </h1>
                <p className="mt-1 text-center text-ink-500">
                  {mode === "signup" ? "Begin vandaag met plannen." : "Log in om verder te plannen."}
                </p>

                <div className="mt-6 grid grid-cols-3 gap-1 rounded-full bg-ivory-deep p-1 text-sm" role="tablist">
                  {(
                    [
                      ["signin", "Inloggen"],
                      ["signup", "Registreren"],
                      ["magic", "Magic link"],
                    ] as const
                  ).map(([m, l]) => (
                    <button
                      key={m}
                      role="tab"
                      aria-selected={mode === m}
                      onClick={() => {
                        setMode(m);
                        setError("");
                      }}
                      className={cn(
                        "relative min-h-10 rounded-full px-2 font-medium transition-colors",
                        mode === m ? "text-rose-700" : "text-ink-500 hover:text-ink-900",
                      )}
                    >
                      {mode === m && (
                        <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-full bg-white shadow-sm" />
                      )}
                      <span className="relative">{l}</span>
                    </button>
                  ))}
                </div>

                <form onSubmit={submit} className="mt-6 space-y-4">
                  <Input
                    label="E-mailadres"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {mode !== "magic" && (
                    <Input
                      label="Wachtwoord"
                      type="password"
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      hint={mode === "signup" ? "Minimaal 6 tekens." : undefined}
                    />
                  )}
                  {error && (
                    <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                      {error}
                    </p>
                  )}
                  <Button type="submit" loading={loading} className="w-full">
                    {mode === "magic" && <Mail className="size-4" aria-hidden />}
                    {mode === "signin" ? "Inloggen" : mode === "signup" ? "Account aanmaken" : "Stuur mij een link"}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </main>
  );
}
