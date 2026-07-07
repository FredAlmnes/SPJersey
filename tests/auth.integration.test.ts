import { expect, test } from "vitest";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const describeOrSkip = ADMIN_EMAIL && ADMIN_PASSWORD ? test : test.skip;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.warn(
    "tests/auth.integration.test.ts: ADMIN_EMAIL/ADMIN_PASSWORD not set in .env.local — " +
      "skipping. Run `npx tsx scripts/seed-admin.ts` after populating these env vars, then re-run."
  );
}

// Plain @supabase/supabase-js client, not the browser-only createBrowserClient
// wrapper from lib/supabase/client.ts — that wrapper requires a cookie
// getAll/setAll bridge that only exists in a real browser/Next.js request
// context, and throws when invoked directly under Node/Vitest.
function createTestClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

describeOrSkip(
  "seeded admin signInWithPassword returns a session",
  async () => {
    const supabase = createTestClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL!,
      password: ADMIN_PASSWORD!,
    });

    expect(error).toBeNull();
    expect(data.session).not.toBeNull();
    expect(data.session?.access_token).toBeTruthy();

    await supabase.auth.signOut();
  }
);

describeOrSkip(
  "wrong password returns an error, not a session",
  async () => {
    const supabase = createTestClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL!,
      password: `${ADMIN_PASSWORD}-wrong`,
    });

    expect(error).not.toBeNull();
    expect(data.session).toBeNull();
  }
);
