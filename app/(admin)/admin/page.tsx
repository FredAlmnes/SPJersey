import { createClient } from "@/lib/supabase/server";

// Walking-skeleton dashboard: one real, RLS-scoped read against `orders`.
// Expected count is 0 until Phase 3/4 create real order rows.
export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true });

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
          Bestillinger
        </h1>
        {error ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">
            Kunne ikke hente bestillinger: {error.message}
          </p>
        ) : (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Antall bestillinger: <span className="font-medium">{count ?? 0}</span>
          </p>
        )}
      </div>
    </div>
  );
}
