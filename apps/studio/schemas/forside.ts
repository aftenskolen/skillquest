import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'forside',
  title: 'Forside',
  type: 'document',
  fields: [
    defineField({
      name: 'hero_overskrift',
      title: 'Hero – overskrift',
      type: 'string',
      description: 'F.eks. «Lær noe nytt i dag.»',
    }),
    defineField({
      name: 'hero_underoverskrift',
      title: 'Hero – underoverskrift',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'om_ingress',
      title: 'Om oss – ingress',
      type: 'string',
      description: 'Teksten over nøkkeltallene nederst på siden',
    }),
    defineField({
      name: 'om_nokkeltal',
      title: 'Om oss – nøkkeltall',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'ikon', title: 'Ikon (emoji)', type: 'string' }),
            defineField({ name: 'verdi', title: 'Verdi', type: 'string' }),
          ],
          preview: {
            select: { title: 'verdi', subtitle: 'ikon' },
          },
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Forsideinnhold' };
    },
  },
});
