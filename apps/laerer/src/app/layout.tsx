import "@novolms/ui/globals.css";
import type { Metadata } from "next";
import { hentInnloggetBruker } from "@novolms/auth";
import { LaererSidebar } from "@/components/LaererSidebar";

export const metadata: Metadata = {
  title: "Lærerportal",
  description: "Novolms Lærerportal",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const brukerData = await hentInnloggetBruker();

  return (
    <html lang="nb">
      <body className="bg-[#F4F6F8]">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
          <span className="text-base font-bold text-[#1B3A5C]">Lærerportal</span>
          {brukerData && (
            <form action="/auth/logg-ut" method="post">
              <button className="text-sm text-gray-500 hover:text-[#1B3A5C]">Logg ut</button>
            </form>
          )}
        </header>
        {brukerData ? (
          <div className="flex">
            <LaererSidebar navn={brukerData.bruker.navn} />
            <main className="flex-1 p-8">{children}</main>
          </div>
        ) : (
          <main>{children}</main>
        )}
      </body>
    </html>
  );
}
