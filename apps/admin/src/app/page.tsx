import { createServerClient } from "@novolms/db/server";

export default async function DashboardPage() {
  const db = createServerClient();

  const [
    { count: kursCount },
    { count: brukerCount },
    { count: paaMeldingCount },
    { count: klasseCount },
  ] = await Promise.all([
    db.from("kurs").select("*", { count: "exact", head: true }).eq("aktiv", true),
    db.from("bruker").select("*", { count: "exact", head: true }).eq("aktiv", true),
    db.from("paamelding").select("*", { count: "exact", head: true }).in("status", ["paameldt", "aktiv"]),
    db.from("klasse").select("*", { count: "exact", head: true }).eq("status", "aktiv"),
  ]);

  const stats = [
    { label: "Aktive kurs", value: kursCount ?? 0, href: "/kurs", color: "bg-blue-50 text-blue-700" },
    { label: "Registrerte brukere", value: brukerCount ?? 0, href: "/brukere", color: "bg-purple-50 text-purple-700" },
    { label: "Aktive påmeldinger", value: paaMeldingCount ?? 0, href: "/klasser", color: "bg-green-50 text-green-700" },
    { label: "Aktive klasser", value: klasseCount ?? 0, href: "/klasser", color: "bg-orange-50 text-orange-700" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1B3A5C] mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <a
            key={s.label}
            href={s.href}
            className="rounded-xl bg-white border border-gray-200 p-6 hover:shadow-sm transition-shadow"
          >
            <p className="text-sm font-medium text-gray-500">{s.label}</p>
            <p className={`mt-2 text-4xl font-bold ${s.color.split(" ")[1]}`}>{s.value}</p>
          </a>
        ))}
      </div>

      <div className="rounded-xl bg-white border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-[#1B3A5C] mb-1">Velkommen til novolms admin</h2>
        <p className="text-sm text-gray-500">Bruk sidemenyen til å administrere kurs, klasser og brukere.</p>
      </div>
    </div>
  );
}
