import "@skillquest/ui/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skillquest Lærerportal",
  description: "Lærerportal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb">
      <body>{children}</body>
    </html>
  );
}
