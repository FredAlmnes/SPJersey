import { describe, it, expect } from "vitest";
import { PATCHES } from "./patches";

describe("patches", () => {
  it("includes the four fixed patch options with stable ids and Norwegian labels", () => {
    expect(PATCHES.length).toBeGreaterThanOrEqual(4);
    const ids = PATCHES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes an Ingen (none) option", () => {
    const none = PATCHES.find((p) => p.id === "ingen");
    expect(none).toBeDefined();
    expect(none?.label).toMatch(/ingen/i);
  });

  it("includes Ligamerke, Champions League, and Europa/Conference League options", () => {
    const labels = PATCHES.map((p) => p.label.toLowerCase());
    expect(labels.some((l) => l.includes("liga"))).toBe(true);
    expect(labels.some((l) => l.includes("champions league"))).toBe(true);
    expect(labels.some((l) => l.includes("europa") || l.includes("conference"))).toBe(true);
  });

  it("carries no price field (included in base price, D-10)", () => {
    for (const patch of PATCHES) {
      expect(patch).not.toHaveProperty("price");
      expect(patch).not.toHaveProperty("priceOre");
    }
  });
});
