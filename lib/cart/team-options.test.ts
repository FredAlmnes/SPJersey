import { describe, it, expect } from "vitest";
import { getTeamOptions, LANDSLAG_ID } from "./team-options";

describe("getTeamOptions", () => {
  it("returns [] for null", () => {
    expect(getTeamOptions(null)).toEqual([]);
  });

  it("returns [] for an unknown id", () => {
    expect(getTeamOptions("unknown-id")).toEqual([]);
  });

  it("returns NATIONAL_TEAMS for the Landslag pseudo-league id, including Norge", () => {
    const teams = getTeamOptions(LANDSLAG_ID);
    expect(teams.some((t) => t.name === "Norge")).toBe(true);
  });

  it("returns Premier League's 20 teams, including Arsenal", () => {
    const teams = getTeamOptions("premier-league");
    expect(teams).toHaveLength(20);
    expect(teams.some((t) => t.name === "Arsenal")).toBe(true);
  });
});
