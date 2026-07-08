import { describe, it, expect } from "vitest";
import { cartReducer } from "./cart-reducer";
import type { CartItem, CartState } from "./cart-types";

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: "item-1",
    leagueId: "premier-league",
    leagueName: "Premier League",
    teamId: "arsenal",
    teamName: "Arsenal",
    season: "2025/26",
    size: "L",
    patchIds: ["ingen"],
    ...overrides,
  };
}

describe("cartReducer", () => {
  it("add appends the item and grows length by 1", () => {
    const state: CartState = [makeItem({ id: "existing" })];
    const item = makeItem({ id: "new-item" });
    const next = cartReducer(state, { type: "add", item });

    expect(next).toHaveLength(2);
    expect(next[1]).toEqual(item);
  });

  it("update replaces only the matching id, preserving order and other items", () => {
    const first = makeItem({ id: "a", teamName: "Arsenal" });
    const second = makeItem({ id: "b", teamName: "Brentford" });
    const third = makeItem({ id: "c", teamName: "Chelsea" });
    const state: CartState = [first, second, third];

    const updatedSecond = makeItem({ id: "b", teamName: "Burnley" });
    const next = cartReducer(state, { type: "update", id: "b", item: updatedSecond });

    expect(next).toHaveLength(3);
    expect(next[0]).toEqual(first);
    expect(next[1]).toEqual(updatedSecond);
    expect(next[2]).toEqual(third);
  });

  it("remove removes only the matching id", () => {
    const first = makeItem({ id: "a" });
    const second = makeItem({ id: "b" });
    const state: CartState = [first, second];

    const next = cartReducer(state, { type: "remove", id: "a" });

    expect(next).toHaveLength(1);
    expect(next[0]).toEqual(second);
  });

  it("remove of a non-existent id leaves state unchanged", () => {
    const state: CartState = [makeItem({ id: "a" }), makeItem({ id: "b" })];

    const next = cartReducer(state, { type: "remove", id: "does-not-exist" });

    expect(next).toEqual(state);
    expect(next).toHaveLength(2);
  });

  it("returns a new array reference and never mutates the input state", () => {
    const state: CartState = [makeItem({ id: "a" })];

    const added = cartReducer(state, { type: "add", item: makeItem({ id: "b" }) });
    expect(added).not.toBe(state);

    const updated = cartReducer(state, { type: "update", id: "a", item: makeItem({ id: "a", size: "XL" }) });
    expect(updated).not.toBe(state);

    const removed = cartReducer(state, { type: "remove", id: "a" });
    expect(removed).not.toBe(state);

    // original state untouched
    expect(state).toHaveLength(1);
    expect(state[0].size).toBe("L");
  });
});
