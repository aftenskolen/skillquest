import { redirect } from "next/navigation";
import { hentInnloggetBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";
import { KursSidebar, type SidebarModul, type SidebarSamling } from "@/components/KursSidebar";

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
    .select("id, klasse_id")
    .eq("bruker_id", bruker.id)
    .in("status", ["aktiv", "paameldt"])
    .limit(1)
    .maybeSingle();

  const [progresjonRes, samlingerRes] = await Promise.all([
    paamelding
      ? db
          .from("leksjon_progresjon")
          .select("leksjon_id, status")
          .eq("paamelding_id", paamelding.id)
      : Promise.resolve({ data: [] }),
    paamelding?.klasse_id
      ? db
          .from("samling")
          .select("id, dato_tid, type, status")
          .eq("klasse_id", paamelding.klasse_id)
          .neq("status", "avlyst")
          .order("dato_tid")
      : Promise.resolve({ data: [] }),
  ]);

  const fullforte = new Set(
    (progresjonRes.data ?? [])
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

  const samlingListe = samlingerRes.data ?? [];
  const samlingIder = samlingListe.map((s) => s.id);

  const { data: oppgaveTeller } = samlingIder.length > 0
    ? await db.from("oppgave").select("samling_id").in("samling_id", samlingIder)
    : { data: [] };

  const oppgavePerSamling = new Map<string, number>();
  for (const o of oppgaveTeller ?? []) {
    oppgavePerSamling.set(o.samling_id, (oppgavePerSamling.get(o.samling_id) ?? 0) + 1);
  }

  const samlinger: SidebarSamling[] = samlingListe.map((s) => ({
    id: s.id,
    dato_tid: s.dato_tid,
    type: s.type,
    status: s.status,
    antall_oppgaver: oppgavePerSamling.get(s.id) ?? 0,
    href: `/kurs/${params.slug}/samlinger/${s.id}`,
  }));

  const kursTittel = (kurs.tittel as unknown as { no: string }).no;

  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      <KursSidebar
        kursTittel={kursTittel}
        kursSlug={params.slug}
        moduler={moduler}
        samlinger={samlinger}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
