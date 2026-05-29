import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'kurs_markedsside',
  title: 'Kurs',
  type: 'document',
  fields: [
    defineField({ name: 'tittel', title: 'Tittel', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'tittel' }, validation: (r) => r.required() }),
    defineField({ name: 'ingress', title: 'Ingress', type: 'text', rows: 3 }),
    defineField({ name: 'beskrivelse_lang', title: 'Lang beskrivelse', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'hva_laerer_du', title: 'Hva lærer du', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'hvem_passer', title: 'Hvem passer kurset for', type: 'text', rows: 2 }),
    defineField({ name: 'coverbilde', title: 'Coverbilde', type: 'image', options: { hotspot: true }, fields: [defineField({ name: 'alt', title: 'Alt-tekst', type: 'string' })] }),
    defineField({
      name: 'kurstype', title: 'Kurstype', type: 'string',
      options: { list: ['norsk', 'fagbrev', 'arbeidsliv', 'livsmestring', 'annet'] },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'cefr_nivaa', title: 'CEFR-nivå', type: 'string',
      options: { list: ['A1', 'A2', 'B1', 'B2', 'ingen'] },
      initialValue: 'ingen',
    }),
    defineField({ name: 'forside_prioritet', title: 'Forsideprioritet (0 = ikke vis, 1 = høyest)', type: 'number', initialValue: 0 }),
    defineField({
      name: 'laereplan', title: 'Læreplan', type: 'array',
      of: [defineField({ name: 'modul', type: 'object', fields: [
        defineField({ name: 'tittel', title: 'Tittel', type: 'string' }),
        defineField({ name: 'beskrivelse', title: 'Beskrivelse', type: 'text' }),
      ] })],
    }),
  ],
});
