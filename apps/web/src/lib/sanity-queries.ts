export const FORSIDE_INNHOLD_QUERY = `
  *[_type == "forside" && _id == "singleton-forside"][0] {
    hero_overskrift,
    hero_underoverskrift,
    om_ingress,
    om_nokkeltal[] {
      ikon,
      verdi,
    },
  }
`;

export const FORSIDE_KURS_QUERY = `
  *[_type == "kurs_visning" && aktiv == true && vis_paa_forside == true]
  | order(forside_prioritet asc) {
    "slug": wordpress_slug.current,
    forside_prioritet,
    badge,
    fremhevet_tittel,
    ingress_override,
    coverbilde_override,
  }
`;

export const ALLE_KURS_QUERY = `
  *[_type == "kurs_visning" && aktiv == true] {
    "slug": wordpress_slug.current,
    badge,
    fremhevet_tittel,
    ingress_override,
    coverbilde_override,
  }
`;
