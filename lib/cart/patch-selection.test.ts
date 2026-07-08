import { describe, it, expect } from "vitest";
import { togglePatch } from "./patch-selection";

describe("togglePatch", () => {
  it("selecting a real patch drops 'ingen'", () => {
    expect(togglePatch(["ingen"], "ligamerke")).toEqual(["ligamerke"]);
  });

  it("selecting 'ingen' clears other selections", () => {
    expect(togglePatch(["ligamerke"], "ingen")).toEqual(["ingen"]);
  });

  it("deselecting the last real patch falls back to ['ingen'], never empty", () => {
    expect(togglePatch(["ligamerke"], "ligamerke")).toEqual(["ingen"]);
  });

  it("selecting another real patch replaces the existing one (patches are mutually exclusive)", () => {
    expect(togglePatch(["ligamerke"], "champions-league")).toEqual([
      "champions-league",
    ]);
  });
});
