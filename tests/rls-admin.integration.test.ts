import { afterAll, beforeAll, expect, test } from "vitest";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

// Positive RLS proof: the authenticated seeded admin (via is_admin() email
// allowlist match) CAN SELECT a service-role-seeded orders row, while the
// anon key cannot. This is the regression guard for the silent
// placeholder-UUID / unpopulated-admin_users lockout (T-04-04).

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const PROVIDER = "test";
const PROVIDER_REF = "admin-read-1";

const seedOrder = {
  provider: PROVIDER,
  provider_ref: PROVIDER_REF,
  status: "pending" as const,
  customer_name: "RLS Admin Test Customer",
  customer_email: "rls-admin-test@example.com",
  amount_total_ore: 35000,
  currency: "NOK",
};

const canRun = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);
const runTest = canRun ? test : test.skip;

if (!canRun) {
  console.warn(
    "tests/rls-admin.integration.test.ts: ADMIN_EMAIL/ADMIN_PASSWORD not set in .env.local — " +
      "skipping. Run `npx tsx scripts/seed-admin.ts` after populating these env vars, then re-run."
  );
}

beforeAll(async () => {
  if (!canRun) return;
  const supabase = createServiceRoleClient();
  await supabase
    .from("orders")
    .delete()
    .eq("provider", PROVIDER)
    .eq("provider_ref", PROVIDER_REF);
  const { error } = await supabase.from("orders").insert(seedOrder);
  if (error) throw error;
});

afterAll(async () => {
  if (!canRun) return;
  const supabase = createServiceRoleClient();
  await supabase
    .from("orders")
    .delete()
    .eq("provider", PROVIDER)
    .eq("provider_ref", PROVIDER_REF);
});

runTest(
  "authenticated seeded admin CAN SELECT the seeded orders row",
  async () => {
    const anonForAuth = createClient();
    const { data: signInData, error: signInError } =
      await anonForAuth.auth.signInWithPassword({
        email: ADMIN_EMAIL!,
        password: ADMIN_PASSWORD!,
      });

    expect(signInError).toBeNull();
    const accessToken = signInData.session?.access_token;
    expect(accessToken).toBeTruthy();

    // Build a client that sends the admin's access token as the bearer
    // token, so PostgREST/RLS evaluates auth.jwt() ->> 'email' as the
    // admin's email — proving is_admin() actually resolves true for a real
    // authenticated session, not just that sign-in succeeded.
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    const { data, error } = await adminClient
      .from("orders")
      .select("*")
      .eq("provider", PROVIDER)
      .eq("provider_ref", PROVIDER_REF);

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect((data ?? []).length).toBeGreaterThanOrEqual(1);

    await anonForAuth.auth.signOut();
  }
);

runTest(
  "plain anon key CANNOT SELECT the same seeded orders row (differential control)",
  async () => {
    const anon = createClient();
    const { data, error } = await anon
      .from("orders")
      .select("*")
      .eq("provider", PROVIDER)
      .eq("provider_ref", PROVIDER_REF);

    if (error) {
      expect(error).not.toBeNull();
    } else {
      expect((data ?? []).length).toBe(0);
    }
  }
);
