import "@novolms/ui/globals.css";
import type { Metadata } from "next";
import { hentInnloggetBruker } from "@novolms/auth";
import { UserMenu } from "@novolms/ui";
import { AdminSidebar } from "@/components/AdminSidebar";

export const metadata: Metadata = {
  title: "novolms admin",
  description: "Admin-panel",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const brukerData = await hentInnloggetBruker().catch(() => null);

  return (
    <html lang="nb">
      <body className="min-h-screen bg-[#F4F6F8]">
        {brukerData && (
          <header className="border-b bg-white px-6 py-3 flex items-center justify-between sticky top-0 z-10">
            <a href="/" className="text-lg font-bold text-[#1B3A5C]">novolms admin</a>
            <UserMenu bruker={brukerData.bruker} roller={brukerData.roller} />
          </header>
        )}
        <div className="flex min-h-[calc(100vh-57px)]">
          {brukerData && <AdminSidebar />}
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
