import "@novolms/ui/globals.css";
import type { Metadata } from "next";
import { hentInnloggetBruker } from "@novolms/auth";
import { UserMenu } from "@novolms/ui";

export const metadata: Metadata = {
  title: "novolms",
  description: "Læremodus",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const brukerData = await hentInnloggetBruker().catch(() => null);

  return (
    <html lang="nb">
      <body className="min-h-screen bg-[#F4F6F8]">
        {brukerData && (
          <header className="border-b bg-white px-6 py-3 flex items-center justify-between">
            <a href="/" className="text-lg font-bold text-[#1B3A5C]">novolms</a>
            <UserMenu bruker={brukerData.bruker} roller={brukerData.roller} />
          </header>
        )}
        {children}
      </body>
    </html>
  );
}
