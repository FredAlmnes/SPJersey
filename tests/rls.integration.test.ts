import { afterAll, beforeAll, expect, test } from "vitest";
import { createClient } from "@/lib/supabase/client";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const PROVIDER = "test";
const PROVIDER_REF = "rls-anon-1";

const seedOrder = {
  provider: PROVIDER,
  provider_ref: PROVIDER_REF,
  status: "pending" as const,
  customer_name: "RLS Test Customer",
  customer_email: "rls-test@example.com",
  amount_total_ore: 35000,
  currency: "NOK",
};

beforeAll(async () => {
  const supabase = createServiceRoleClient();
  // Clean slate, then seed a real row so the anon SELECT is genuinely being
  // blocked by RLS rather than just returning empty because no rows exist.
  await supabase
    .from("orders")
    .delete()
    .eq("provider", PROVIDER)
    .eq("provider_ref", PROVIDER_REF);
  const { error } = await supabase.from("orders").insert(seedOrder);
  if (error) throw error;
});

afterAll(async () => {
  const supabase = createServiceRoleClient();
  await supabase
    .from("orders")
    .delete()
    .eq("provider", PROVIDER)
    .eq("provider_ref", PROVIDER_REF);
});

test("anon key cannot SELECT orders rows", async () => {
  const anon = createClient();
  const { data, error } = await anon
    .from("orders")
    .select("*")
    .eq("provider", PROVIDER)
    .eq("provider_ref", PROVIDER_REF);

  // Either an explicit permission error, or zero rows returned — never the
  // seeded customer row.
  if (error) {
    expect(error).not.toBeNull();
  } else {
    expect(data).toEqual([]);
  }
});

test("anon key cannot INSERT into orders", async () => {
  const anon = createClient();
  const { error } = await anon.from("orders").insert({
    provider: PROVIDER,
    provider_ref: "rls-anon-insert-attempt",
    status: "pending",
    customer_name: "Should Not Insert",
    customer_email: "should-not-insert@example.com",
    amount_total_ore: 35000,
    currency: "NOK",
  });

  expect(error).not.toBeNull();
});
