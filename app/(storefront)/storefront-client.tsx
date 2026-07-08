"use client";

// app/(storefront)/storefront-client.tsx
// Client root (D-13/D-14/D-16): mounts CartProvider, owns the "draft"/
// editingId coordination state (02-RESEARCH.md Pattern 3) between the
// configurator form and the cart panel's "Rediger" flow (D-12), and lays
// out the two-column (desktop) / stacked (mobile) page.

import { useState } from "react";
import { CartProvider } from "@/lib/cart/cart-context";
import {
  ConfiguratorForm,
  EMPTY_DRAFT,
  type DraftJersey,
} from "@/components/storefront/configurator-form";
import { CartPanel } from "@/components/storefront/cart-panel";
import { CheckoutExplainer } from "@/components/storefront/checkout-explainer";
import type { CartItem } from "@/lib/cart/cart-types";

function itemToDraft(item: CartItem): DraftJersey {
  return {
    leagueId: item.leagueId,
    leagueName: item.leagueName,
    teamId: item.teamId,
    teamName: item.teamName,
    size: item.size,
    patchIds: item.patchIds,
    name: item.name ?? "",
    number: item.number !== undefined ? String(item.number) : "",
  };
}

export function StorefrontClient() {
  const [draft, setDraft] = useState<DraftJersey>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleEditItem(item: CartItem) {
    setEditingId(item.id);
    setDraft(itemToDraft(item));
  }

  function handleSubmitDone() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  }

  return (
    <CartProvider>
      {/* pb-32 reserves safe-area padding so the mobile fixed cart bar
          (CartPanel) never overlaps the form's own submit CTA; lg: removes
          it once the cart panel becomes a sticky side column. */}
      <div className="flex flex-1 flex-col px-4 pt-8 pb-32 lg:px-6 lg:pb-8">
        <h1 className="text-[28px] leading-[1.2] font-semibold tracking-tight text-black dark:text-zinc-50">
          Sett sammen draktene dine
        </h1>

        <div className="mt-6 flex flex-1 flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <div className="flex flex-1 flex-col gap-8">
            <ConfiguratorForm
              draft={draft}
              setDraft={setDraft}
              editingId={editingId}
              onSubmitDone={handleSubmitDone}
            />
            <CheckoutExplainer />
          </div>

          <CartPanel onEditItem={handleEditItem} />
        </div>
      </div>
    </CartProvider>
  );
}
