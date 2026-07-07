// config/patches.ts
// Fixed patch list (D-09..D-10). No price field — patches are included in the
// base price, never an upcharge.
export interface Patch {
  id: string;
  label: string;
}

export const PATCHES: Patch[] = [
  { id: "ligamerke", label: "Ligamerke" },
  { id: "champions-league", label: "Champions League-merke" },
  { id: "europa-conference-league", label: "Europa League/Conference League-merke" },
  { id: "ingen", label: "Ingen" },
];
