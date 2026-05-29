import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'informasjonsside',
  title: 'Informasjonsside',
  type: 'document',
  fields: [
    defineField({ name: 'tittel', title: 'Tittel', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'tittel' }, validation: (r) => r.required() }),
    defineField({ name: 'innhold', title: 'Innhold', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'sist_oppdatert', title: 'Sist oppdatert', type: 'date' }),
  ],
});
