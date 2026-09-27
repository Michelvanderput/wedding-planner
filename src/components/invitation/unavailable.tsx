import { RingsMark } from "@/components/decor/logo";

export function InvitationUnavailable({ title, body }: { title: string; body: string }) {
  return (
    <main className="paper grid min-h-dvh place-items-center px-4 text-center">
      <div className="card max-w-md p-10">
        <RingsMark className="mx-auto size-12" />
        <h1 className="mt-6 text-3xl font-semibold">{title}</h1>
        <p className="mt-2 text-ink-500">{body}</p>
      </div>
    </main>
  );
}
