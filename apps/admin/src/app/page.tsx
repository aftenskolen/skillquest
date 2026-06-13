import { hentInnloggetBruker } from "@novolms/auth";

export default async function Page() {
  const { bruker, roller } = (await hentInnloggetBruker())!;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold text-[#1B3A5C]">Admin-panel</h1>
      <p className="mt-2 text-gray-500">
        Innlogget som <span className="font-medium">{bruker.navn}</span> ({roller.join(", ")})
      </p>
    </main>
  );
}
