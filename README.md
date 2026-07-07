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

Integration tests under `tests/*.integration.test.ts` require the hosted Supabase env vars above (service-role + anon keys) to be present in `.env.local`. `tests/auth.integration.test.ts` and `tests/rls-admin.integration.test.ts` additionally require `ADMIN_EMAIL`/`ADMIN_PASSWORD` to be set and the admin to be seeded (see below) — they skip themselves with a console warning if those env vars are empty.

## Run the full stack locally

1. **Start the app's dependencies** — the hosted Supabase project (no local Docker stack in this environment; see "Database / local dev" above). Ensure `.env.local` has real values for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and choose values for `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

2. **Seed the single admin account** (one-off, safe to re-run) — creates the Supabase Auth user AND registers its email in the `admin_users` allowlist, which is what makes `is_admin()` grant the real admin DB access:
   ```bash
   npx tsx scripts/seed-admin.ts
   ```

3. **Run the dev server:**
   ```bash
   npm run dev
   ```

4. **Walk through the admin flow:**
   - Visit [http://localhost:3000/admin](http://localhost:3000/admin) — you should be redirected to `/admin/login` (unauthenticated).
   - Log in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from step 1.
   - You should land on `/admin`, showing a real order count read from the `orders` table via RLS (expected `0` until real orders exist).

**Alternative — Vercel preview deploy:** push a branch and open the generated Vercel preview URL instead of `localhost:3000`; the same `.env.local` values must be set as Vercel Environment Variables for the preview environment, and step 2's seed script can be run locally against the same hosted Supabase project (it does not need to run inside Vercel).
