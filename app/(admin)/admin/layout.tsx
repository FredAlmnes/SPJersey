import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Defense-in-depth server re-check on top of middleware.ts's gate. Uses
// getUser() (server-revalidated), never getSession(), per CLAUDE.md.
//
// /admin/login is exempt: it lives under this same layout (see 01-04-PLAN.md
// file paths), so without this exemption an unauthenticated visit to
// /admin/login would redirect to /admin/login, re-rendering this layout and
// looping forever. middleware.ts forwards the current pathname via the
// x-pathname header so this check does not depend on a second guess at the
// request URL.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
