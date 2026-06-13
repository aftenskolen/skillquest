import { redirect } from "next/navigation";
import { hentInnloggetBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";
import { KursSidebar, type SidebarModul } from "@/components/KursSidebar";

interface Props {
  children: React.ReactNode;
  params: { slug: string };
}

export default async function KursLayout({ children, params }: Props) {
  const brukerData = await hentInnloggetBruker();
  if (!brukerData) redirect("/auth/logg-inn");
  const { bruker } = brukerData;

  const db = createServerClient();

  const { data: kurs } = await db
    .from("kurs")
    .select(`
      id, tittel, slug,
      kurs_modul_kobling (
        rekkefolge, modul_id,
        innhold_modul (
          id, tittel,
          modul_leksjon_kobling (
            rekkefolge, leksjon_id,
            innhold_leksjon ( id, tittel, status )
          )
        )
      )
    `)
    .eq("slug", params.slug)
    .single();

  if (!kurs) redirect("/");

  const { data: paamelding } = await db
    .from("paamelding")
    .select("id")
    .eq("bruker_id", bruker.id)
    .in("status", ["aktiv", "paameldt"])
    .limit(1)
    .maybeSingle();

  const { data: progresjon } = paamelding
    ? await db
        .from("leksjon_progresjon")
        .select("leksjon_id, status")
        .eq("paamelding_id", paamelding.id)
    : { data: [] };

  const fullforte = new Set(
    (progresjon ?? [])
      .filter((p) => p.status === "fullfort")
      .map((p) => p.leksjon_id)
  );

  type RawModul = {
    id: string;
    tittel: { no: string };
    modul_leksjon_kobling: Array<{
      rekkefolge: number;
      leksjon_id: string;
      innhold_leksjon: { id: string; tittel: { no: string }; status: string } | null;
    }>;
  };

  const moduler: SidebarModul[] = [...((kurs as { kurs_modul_kobling: Array<{ rekkefolge: number; innhold_modul: unknown }> }).kurs_modul_kobling ?? [])]
    .sort((a, b) => a.rekkefolge - b.rekkefolge)
    .flatMap((kmk) => {
      const modul = kmk.innhold_modul as unknown as RawModul | null;
      if (!modul) return [];
      const leksjoner = [...(modul.modul_leksjon_kobling ?? [])]
        .sort((a, b) => a.rekkefolge - b.rekkefolge)
        .flatMap((mlk) => {
          const l = mlk.innhold_leksjon;
          if (!l || l.status !== "publisert") return [];
          return [{
            id: l.id,
            tittel: l.tittel.no,
            href: `/kurs/${params.slug}/leksjon/${l.id}`,
            fullfort: fullforte.has(l.id),
          }];
        });
      return [{ id: modul.id, tittel: modul.tittel.no, leksjoner }];
    });

  const kursTittel = (kurs.tittel as unknown as { no: string }).no;

  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      <KursSidebar
        kursTittel={kursTittel}
        kursSlug={params.slug}
        moduler={moduler}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
