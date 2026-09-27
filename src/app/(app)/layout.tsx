import { WeddingProvider } from "@/lib/store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <WeddingProvider>{children}</WeddingProvider>;
}
