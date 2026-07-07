import { afterAll, expect, test } from "vitest";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const PROVIDER = "test";
const PROVIDER_REF = "dup-1";

const baseOrder = {
  provider: PROVIDER,
  provider_ref: PROVIDER_REF,
  status: "pending" as const,
  customer_name: "Idempotency Test Customer",
  customer_email: "idempotency-test@example.com",
  amount_total_ore: 35000,
  currency: "NOK",
};

afterAll(async () => {
  const supabase = createServiceRoleClient();
  await supabase
    .from("orders")
    .delete()
    .eq("provider", PROVIDER)
    .eq("provider_ref", PROVIDER_REF);
});

test("duplicate (provider, provider_ref) insert is rejected with 23505", async () => {
  const supabase = createServiceRoleClient();

  // Clean slate in case a prior run left a row behind.
  await supabase
    .from("orders")
    .delete()
    .eq("provider", PROVIDER)
    .eq("provider_ref", PROVIDER_REF);

  const first = await supabase.from("orders").insert(baseOrder).select().single();
  expect(first.error).toBeNull();

  const second = await supabase.from("orders").insert(baseOrder).select().single();
  expect(second.error).not.toBeNull();
  expect(second.error?.code).toBe("23505");
});
