import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'kurs_visning',
  title: 'Kursstyring',
  type: 'document',
  fields: [
    defineField({
      name: 'wordpress_slug',
      title: 'WordPress-slug',
      description: 'Slug fra WordPress, f.eks. norsk-a1',
      type: 'slug',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'aktiv',
      title: 'Vis kurset',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'vis_paa_forside',
      title: 'Vis på forsiden',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'forside_prioritet',
      title: 'Forsideprioritet (1=øverst, 9=nederst)',
      type: 'number',
      validation: (Rule) => Rule.min(1).max(9),
    }),
    defineField({
      name: 'badge',
      title: 'Badge',
      type: 'string',
      options: {
        list: ['Nytt', 'Populært', 'Finansiert', 'Bestselger'],
      },
    }),
    defineField({
      name: 'fremhevet_tittel',
      title: 'Overstyr tittel (valgfritt)',
      description: 'Erstatter WordPress-tittelen hvis fylt inn',
      type: 'string',
    }),
    defineField({
      name: 'ingress_override',
      title: 'Overstyr ingress (valgfritt)',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'coverbilde_override',
      title: 'Overstyr coverbilde (valgfritt)',
      type: 'image',
      options: { hotspot: true },
    }),
  ],
  preview: {
    select: {
      title: 'fremhevet_tittel',
      slug: 'wordpress_slug.current',
      aktiv: 'aktiv',
    },
    prepare({ title, slug, aktiv }: { title?: string; slug?: string; aktiv?: boolean }) {
      return {
        title: title || slug || 'Ukjent kurs',
        subtitle: aktiv ? '✅ Aktiv' : '❌ Skjult',
      };
    },
  },
});
