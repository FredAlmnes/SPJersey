// lib/cart/patch-selection.ts
// Pure 'ingen' mutual-exclusivity toggle for patch checkboxes (PROD-03,
// Pitfall 6): a single derived function rather than independent per-checkbox
// handlers, so the resulting patchIds array is never invalid (both "ingen"
// and another patch checked) or empty.
export function togglePatch(current: string[], clickedId: string): string[] {
  if (clickedId === "ingen") return ["ingen"];

  const withoutNone = current.filter((id) => id !== "ingen");
  const next = withoutNone.includes(clickedId)
    ? withoutNone.filter((id) => id !== clickedId)
    : [...withoutNone, clickedId];

  return next.length === 0 ? ["ingen"] : next;
}
