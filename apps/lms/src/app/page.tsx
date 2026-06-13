import { hentInnloggetBruker } from "@skillquest/auth";

export default async function Page() {
  const { bruker } = (await hentInnloggetBruker())!;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold text-[#1B3A5C]">
        Hei, {bruker.navn}!
      </h1>
      <p className="mt-2 text-gray-500">Her vil kursene dine vises.</p>
    </main>
  );
}
