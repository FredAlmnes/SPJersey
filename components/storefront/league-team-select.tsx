"use client";

// components/storefront/league-team-select.tsx
// Cascading league/Landslag -> team controlled selects (PROD-01, D-14, D-15).
// Invalid combinations are structurally impossible: the team select is
// disabled until a league is chosen, and its options are always derived via
// getTeamOptions(leagueId) — never duplicated inline.

import { useMemo } from "react";
import { LEAGUES } from "@/config/leagues-teams-seasons";
import { getTeamOptions, LANDSLAG_ID } from "@/lib/cart/team-options";

export interface LeagueTeamSelectProps {
  leagueId: string | null;
  teamId: string | null;
  onLeagueChange: (leagueId: string, leagueName: string) => void;
  onTeamChange: (teamId: string, teamName: string) => void;
}

const SELECT_CLASSES =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

export function LeagueTeamSelect({
  leagueId,
  teamId,
  onLeagueChange,
  onTeamChange,
}: LeagueTeamSelectProps) {
  const teamOptions = useMemo(() => getTeamOptions(leagueId), [leagueId]);

  return (
    <div className="flex flex-col gap-4">
      <label className="block text-sm text-zinc-700 dark:text-zinc-300">
        Liga eller landslag
        <select
          className={SELECT_CLASSES}
          value={leagueId ?? ""}
          onChange={(e) => {
            const selectedId = e.target.value;
            if (selectedId === LANDSLAG_ID) {
              onLeagueChange(LANDSLAG_ID, "Landslag");
              return;
            }
            const league = LEAGUES.find((l) => l.id === selectedId);
            if (league) {
              onLeagueChange(league.id, league.name);
            }
          }}
        >
          <option value="" disabled>
            Velg liga eller landslag
          </option>
          {LEAGUES.map((league) => (
            <option key={league.id} value={league.id}>
              {league.name}
            </option>
          ))}
          <option value={LANDSLAG_ID}>Landslag</option>
        </select>
      </label>

      <label className="block text-sm text-zinc-700 dark:text-zinc-300">
        Lag
        <select
          className={SELECT_CLASSES}
          value={teamId ?? ""}
          disabled={leagueId === null}
          onChange={(e) => {
            const selectedId = e.target.value;
            const team = teamOptions.find((t) => t.id === selectedId);
            if (team) {
              onTeamChange(team.id, team.name);
            }
          }}
        >
          <option value="" disabled>
            Velg lag
          </option>
          {teamOptions.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
