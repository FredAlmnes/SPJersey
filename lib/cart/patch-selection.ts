// lib/cart/patch-selection.ts
// Pure single-select toggle for patch checkboxes (PROD-03): a real jersey
// carries at most one competition patch (a team isn't in both its league
// and the Champions League patch slot at once), so all options - including
// "ingen" - are mutually exclusive. A single derived function rather than
// independent per-checkbox handlers keeps the resulting patchIds array
// always exactly one entry, never multiple and never empty.
export function togglePatch(current: string[], clickedId: string): string[] {
  if (current.includes(clickedId)) return ["ingen"];
  return [clickedId];
}
