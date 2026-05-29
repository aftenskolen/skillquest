import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'samarbeidspartner',
  title: 'Samarbeidspartner',
  type: 'document',
  fields: [
    defineField({ name: 'navn', title: 'Navn', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'logo', title: 'Logo', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'beskrivelse', title: 'Beskrivelse', type: 'text', rows: 3 }),
    defineField({ name: 'lenke', title: 'Nettside', type: 'url' }),
    defineField({ name: 'kategori', title: 'Kategori', type: 'string' }),
  ],
});
