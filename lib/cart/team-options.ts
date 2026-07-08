// lib/cart/team-options.ts
// Pure cascading team derivation from league/Landslag selection (PROD-01, D-15).
// Framework-free so it runs under the node Vitest env; the Wave 2
// league-team-select component wraps this in useMemo.
import { LEAGUES, NATIONAL_TEAMS, type Team } from "@/config/leagues-teams-seasons";

export const LANDSLAG_ID = "landslag" as const;

export function getTeamOptions(leagueOrNationalId: string | null): Team[] {
  if (leagueOrNationalId === null) return [];
  if (leagueOrNationalId === LANDSLAG_ID) return NATIONAL_TEAMS;
  return LEAGUES.find((l) => l.id === leagueOrNationalId)?.teams ?? [];
}
