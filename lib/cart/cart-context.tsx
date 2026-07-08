"use client";

// lib/cart/cart-context.tsx
// Page-scoped cart Context + useReducer (D-13/D-14/D-16) — not a global
// store, not zustand. State/dispatch are split into two contexts so
// dispatch-only consumers don't re-render when the cart array changes.

import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import { cartReducer } from "./cart-reducer";
import type { CartAction, CartItem } from "./cart-types";

const CartStateContext = createContext<CartItem[] | null>(null);
const CartDispatchContext = createContext<Dispatch<CartAction> | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, []);

  return (
    <CartStateContext.Provider value={cart}>
      <CartDispatchContext.Provider value={dispatch}>{children}</CartDispatchContext.Provider>
    </CartStateContext.Provider>
  );
}

export function useCart(): CartItem[] {
  const cart = useContext(CartStateContext);
  if (cart === null) throw new Error("useCart must be used within CartProvider");
  return cart;
}

export function useCartDispatch(): Dispatch<CartAction> {
  const dispatch = useContext(CartDispatchContext);
  if (dispatch === null) throw new Error("useCartDispatch must be used within CartProvider");
  return dispatch;
}
