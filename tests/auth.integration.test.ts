import { expect, test } from "vitest";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const describeOrSkip = ADMIN_EMAIL && ADMIN_PASSWORD ? test : test.skip;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.warn(
    "tests/auth.integration.test.ts: ADMIN_EMAIL/ADMIN_PASSWORD not set in .env.local — " +
      "skipping. Run `npx tsx scripts/seed-admin.ts` after populating these env vars, then re-run."
  );
}

describeOrSkip(
  "seeded admin signInWithPassword returns a session",
  async () => {
    const supabase = createClient();
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
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL!,
      password: `${ADMIN_PASSWORD}-wrong`,
    });

    expect(error).not.toBeNull();
    expect(data.session).toBeNull();
  }
);
