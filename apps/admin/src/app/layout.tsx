import "@skillquest/ui/globals.css";
import type { Metadata } from "next";
import { hentInnloggetBruker } from "@skillquest/auth";
import { UserMenu } from "@skillquest/ui";

export const metadata: Metadata = {
  title: "Skillquest Admin",
  description: "Admin-panel",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const brukerData = await hentInnloggetBruker().catch(() => null);

  return (
    <html lang="nb">
      <body className="min-h-screen bg-[#F4F6F8]">
        {brukerData && (
          <header className="border-b bg-white px-6 py-3 flex items-center justify-between">
            <a href="/" className="text-lg font-bold text-[#1B3A5C]">Skillquest Admin</a>
            <UserMenu bruker={brukerData.bruker} roller={brukerData.roller} />
          </header>
        )}
        {children}
      </body>
    </html>
  );
}
