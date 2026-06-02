import Hero from '@/components/forside/Hero';
import UtvalgtKurs from '@/components/forside/UtvalgtKurs';
import Sitater from '@/components/forside/Sitater';
import { hentForsideInnhold } from '@/lib/data';

export default async function Forside() {
  const innhold = await hentForsideInnhold();

  return (
    <>
      <Hero
        {...(innhold.hero_overskrift ? { overskrift: innhold.hero_overskrift } : {})}
        {...(innhold.hero_underoverskrift ? { underoverskrift: innhold.hero_underoverskrift } : {})}
      />
      <UtvalgtKurs />
      <Sitater />
    </>
  );
}
