// One-off script: creates the single Supabase Auth admin user AND registers
// the same email in the admin_users allowlist table, closing the is_admin()
// RLS loop (see supabase/migrations/20260707000000_init_schema.sql).
//
// Not run automatically. Run manually, once, with:
//   npx tsx scripts/seed-admin.ts
//
// Requires ADMIN_EMAIL, ADMIN_PASSWORD, SUPABASE_SERVICE_ROLE_KEY, and
// NEXT_PUBLIC_SUPABASE_URL to be set in .env.local (or the environment).
// Safe to re-run: detects an existing auth user by email and skips creation,
// but always upserts the admin_users allowlist row.
//
// NOTE: this script intentionally does NOT import
// lib/supabase/service-role.ts. That module starts with `import
// "server-only"`, a marker package that unconditionally throws when loaded
// outside Next.js's bundler (which normally aliases it away for
// server-side code) — see node_modules/server-only/index.js. Running this
// script under plain `tsx`/Node would hit that throw immediately, so the
// service-role client is constructed inline here instead, using the exact
// same construction as lib/supabase/service-role.ts.
import { existsSync } from "node:fs";
import path from "node:path";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  process.loadEnvFile(envLocalPath);
}

function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // never NEXT_PUBLIC_-prefixed
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function main() {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must both be set (in .env.local or the environment) before running this script."
    );
  }

  const supabase = createServiceRoleClient();

  // Step 1: create the auth user (or find the existing one — safe to re-run).
  let adminUserId: string | undefined;

  const { data: created, error: createError } =
    await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });

  if (createError) {
    const alreadyExists =
      createError.status === 422 ||
      /already registered|already exists/i.test(createError.message);

    if (!alreadyExists) {
      throw new Error(
        `Failed to create admin auth user: ${createError.message}`
      );
    }

    // Re-run path: look up the existing user by email so we can log its id.
    const { data: list, error: listError } =
      await supabase.auth.admin.listUsers();
    if (listError) {
      throw new Error(
        `Admin user already exists but could not be looked up: ${listError.message}`
      );
    }
    const existing = list.users.find((u) => u.email === ADMIN_EMAIL);
    adminUserId = existing?.id;
    console.log(
      `Admin auth user already exists for ${ADMIN_EMAIL} (id: ${adminUserId ?? "unknown"}) — skipping creation.`
    );
  } else {
    adminUserId = created.user?.id;
    console.log(
      `Created admin auth user for ${ADMIN_EMAIL} (id: ${adminUserId}).`
    );
  }

  // Step 2: upsert the SAME email into the admin_users allowlist. This is
  // the step that makes is_admin() (SECURITY DEFINER, matches auth.jwt() ->>
  // 'email' against admin_users) actually grant the real admin DB access.
  const { error: upsertError } = await supabase
    .from("admin_users")
    .upsert({ email: ADMIN_EMAIL }, { onConflict: "email" });

  if (upsertError) {
    throw new Error(
      `Failed to upsert ${ADMIN_EMAIL} into admin_users: ${upsertError.message}`
    );
  }

  console.log(
    `Upserted ${ADMIN_EMAIL} into admin_users — is_admin() will now resolve true for this account.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
