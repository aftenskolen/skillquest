import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'sitat',
  title: 'Sitat',
  type: 'document',
  fields: [
    defineField({ name: 'deltaker_navn', title: 'Deltakernavn', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'kurs_navn', title: 'Kursnavn', type: 'string' }),
    defineField({ name: 'sitat_tekst', title: 'Sitatekst', type: 'text', rows: 4, validation: (r) => r.required() }),
  ],
});
