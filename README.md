# SpJersey

En nettbutikk for skreddersydde fotballdrakter (dropshipping). Next.js 16 App Router + Supabase (Postgres, Auth, RLS), deployed on Vercel.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database / local dev

This environment has no Docker daemon available, so the local Supabase stack (`supabase start`) cannot run here. Instead, the project uses the **hosted Supabase fallback** documented in `.planning/phases/01-foundation-data-model/01-RESEARCH.md` (Environment Availability section):

- The Supabase CLI project is linked to the hosted "SpJersey" project (`supabase/.temp/linked-project.json`, ref `azmjwngvhxiljpaqleyh`).
- Schema migrations live in `supabase/migrations/` and are applied to the hosted project with:
  ```bash
  npx supabase db push --linked
  ```
- TypeScript types are generated from the hosted schema with:
  ```bash
  npx supabase gen types typescript --linked > lib/supabase/types.ts
  ```
- `.env.local` (gitignored) holds the hosted project's `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

If Docker becomes available in a future environment, `supabase start` + `supabase db reset` can be used instead for a fully local Postgres stack — the migration files are portable and work with either path.

## Tests

```bash
npx vitest run
```

Integration tests under `tests/*.integration.test.ts` require the hosted Supabase env vars above (service-role + anon keys) to be present in `.env.local`.
