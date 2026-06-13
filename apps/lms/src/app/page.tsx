import Link from "next/link";
import { redirect } from "next/navigation";
import { hentInnloggetBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";

export default async function DashboardPage() {
  const brukerData = await hentInnloggetBruker();
  if (!brukerData) redirect("/auth/logg-inn");
  const { bruker } = brukerData;
  const db = createServerClient();

  const { data: paameldinger } = await db
    .from("paamelding")
    .select(`
      id,
      status,
      tilgang_til,
      klasse (
        id,
        tittel,
        kurs (
          id,
          tittel,
          slug,
          kurstype,
          cefr_nivaa
        )
      )
    `)
    .eq("bruker_id", bruker.id)
    .in("status", ["aktiv", "paameldt"]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold text-[#1B3A5C]">
        Hei, {bruker.navn}!
      </h1>
      <p className="mt-1 text-gray-500">Mine kurs</p>

      {!paameldinger?.length ? (
        <p className="mt-8 text-gray-400">Du er ikke påmeldt noen kurs ennå.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {paameldinger.map((p) => {
            const klasse = p.klasse as unknown as { id: string; tittel: string; kurs: { id: string; tittel: { no: string }; slug: string; kurstype: string; cefr_nivaa: string | null } } | null;
            if (!klasse?.kurs) return null;
            const kurs = klasse.kurs;
            return (
              <Link
                key={p.id}
                href={`/kurs/${kurs.slug}`}
                className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:border-[#1B3A5C] hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      {kurs.kurstype.replace(/_/g, " ")}
                      {kurs.cefr_nivaa && kurs.cefr_nivaa !== "ingen" ? ` · ${kurs.cefr_nivaa}` : ""}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-[#1B3A5C] group-hover:underline">
                      {kurs.tittel.no}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">{klasse.tittel}</p>
                  </div>
                  <span className="text-2xl text-gray-300 group-hover:text-[#1B3A5C] transition-colors">→</span>
                </div>
                <div className="mt-4">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.status === "aktiv" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {p.status === "aktiv" ? "Aktiv" : "Påmeldt"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
