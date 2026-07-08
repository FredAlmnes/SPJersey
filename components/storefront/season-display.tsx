// components/storefront/season-display.tsx
// Read-only "Sesong: 2025/26" label (D-14/D-15) — season is never a select;
// config/leagues-teams-seasons.ts exposes a single CURRENT_SEASON constant.
// Do NOT modify config/leagues-teams-seasons.ts to add a per-team season list.

import { CURRENT_SEASON } from "@/config/leagues-teams-seasons";

export function SeasonDisplay() {
  return (
    <p className="text-sm text-zinc-600 dark:text-zinc-400">
      Sesong:{" "}
      <span className="font-semibold text-black dark:text-zinc-50">
        {CURRENT_SEASON}
      </span>
    </p>
  );
}
