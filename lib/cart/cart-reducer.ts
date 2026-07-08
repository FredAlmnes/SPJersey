// lib/cart/cart-reducer.ts
// Pure cart reducer (D-11..D-13) — the testable core of the live cart.
// No React import, no side effects: always returns a new array reference.
import type { CartAction, CartState } from "./cart-types";

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "add":
      return [...state, action.item];
    case "update":
      return state.map((item) => (item.id === action.id ? action.item : item));
    case "remove":
      return state.filter((item) => item.id !== action.id);
  }
}
