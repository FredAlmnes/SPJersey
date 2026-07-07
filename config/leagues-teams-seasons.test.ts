import { describe, it, expect } from "vitest";
import { CURRENT_SEASON, LEAGUES, NATIONAL_TEAMS } from "./leagues-teams-seasons";

describe("leagues-teams-seasons", () => {
  it("exposes exactly 5 leagues with the required names", () => {
    expect(LEAGUES).toHaveLength(5);
    const names = LEAGUES.map((l) => l.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "Premier League",
        "Eliteserien",
        "LaLiga",
        "Serie A",
        "Bundesliga",
      ]),
    );
  });

  it("gives every league a non-empty teams array", () => {
    for (const league of LEAGUES) {
      expect(Array.isArray(league.teams)).toBe(true);
      expect(league.teams.length).toBeGreaterThan(0);
    }
  });

  it("includes Norway and major football nations in NATIONAL_TEAMS", () => {
    const names = NATIONAL_TEAMS.map((t) => t.name);
    const hasNorway = names.some((n) => /norge|norway/i.test(n));
    expect(hasNorway).toBe(true);
    for (const nation of ["Brazil", "France", "Germany", "Spain", "England", "Argentina"]) {
      expect(names).toContain(nation);
    }
  });

  it("exports CURRENT_SEASON as a single constant equal to 2025/26", () => {
    expect(CURRENT_SEASON).toBe("2025/26");
  });

  it("never duplicates the season string inline per team", () => {
    for (const league of LEAGUES) {
      for (const team of league.teams) {
        expect(team).not.toHaveProperty("season");
      }
    }
    for (const team of NATIONAL_TEAMS) {
      expect(team).not.toHaveProperty("season");
    }
  });
});
