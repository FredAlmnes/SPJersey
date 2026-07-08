// lib/cart/cart-types.ts
// CartItem shape for the in-memory cart (D-11..D-13). No price field is ever
// stored here — see Pitfall 2 in 02-RESEARCH.md: price is always derived live
// from config/pricing-tiers.ts, never persisted on the item.

export type JerseySize = "S" | "M" | "L" | "XL" | "XXL" | "3XL";

export interface CartItem {
  id: string; // crypto.randomUUID(), generated only in the reducer 'add' path
  leagueId: string; // a LEAGUES id OR "landslag" (LANDSLAG_ID)
  leagueName: string; // display label ("Premier League" / "Landslag")
  teamId: string;
  teamName: string; // display label snapshotted at add-time
  season: string; // CURRENT_SEASON snapshot at add-time
  size: JerseySize;
  patchIds: string[]; // subset of PATCHES ids; ["ingen"] when no patch
  name?: string; // print name, already validated (D-20/D-22)
  number?: number; // print number 0..99 (D-21/D-22)
}

export type CartAction =
  | { type: "add"; item: CartItem }
  | { type: "update"; id: string; item: CartItem }
  | { type: "remove"; id: string };

export type CartState = CartItem[];
