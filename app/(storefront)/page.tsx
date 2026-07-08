// app/(storefront)/page.tsx
// Thin Server Component shell for the storefront homepage ('/'). No data
// fetching - catalog/pricing data is statically imported inside the client
// tree, not DB-backed (02-RESEARCH.md).

import { StorefrontClient } from "./storefront-client";

export default function StorefrontPage() {
  return <StorefrontClient />;
}
