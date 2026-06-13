# novolms

Læringsplattform for Aftenskolen.

## Kom i gang

**Forutsetninger:** Node.js 20+, pnpm 8+

```bash
# Installer pnpm globalt
npm install -g pnpm

# Klon og installer avhengigheter
git clone <repo-url>
cd skillquest
pnpm install

# Sett opp miljøvariabler
cp apps/web/.env.local.example apps/web/.env.local
# Fyll inn verdier i .env.local

# Start nettsiden lokalt
pnpm dev:web

# Start alle apper
pnpm dev
```

## Struktur

```
skillquest/
├── apps/          # Next.js-apper og Sanity Studio
├── packages/      # Delte biblioteker (ui, db, auth, utils)
├── supabase/      # Databasemigrasjoner og testdata
└── .github/       # CI/CD-konfigurasjon
```

## Apper

| App | Port | Beskrivelse |
|-----|------|-------------|
| web | 3000 | Nettside – kurs, påmelding, innhold |
| lms | 3001 | Læremodus – moduler, oppgaver, progresjon |
| admin | 3002 | Admin-panel – kursstyring, brukere, rapporter |
| laerer | 3003 | Lærerportal – klasser, tilbakemeldinger |
| studio | 3004 | Sanity Studio – innholdsstyring |

## Pakker

| Pakke | Beskrivelse |
|-------|-------------|
| `@novolms/ui` | Delt komponentbibliotek (shadcn/ui-basert) |
| `@novolms/db` | Supabase-klient og TypeScript-typer |
| `@novolms/auth` | NextAuth.js-konfigurasjon |
| `@novolms/utils` | Delte hjelpefunksjoner |
