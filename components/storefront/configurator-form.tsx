"use client";

// components/storefront/configurator-form.tsx
// Single-page configurator form (D-11/D-12/D-14) composing every Wave 2
// field component in the UI-SPEC order: league/team -> season -> size ->
// patches -> name/number. Owns the "draft" jersey object, kept separate
// from the committed cart array (02-RESEARCH.md Pattern 3 - draft-vs-cart
// separation). crypto.randomUUID() is called only inside the submit
// handler, never during render, so the same tree can render on the server
// without a hydration mismatch.

import type { FormEvent } from "react";
import { CURRENT_SEASON } from "@/config/leagues-teams-seasons";
import { useCartDispatch } from "@/lib/cart/cart-context";
import type { CartItem, JerseySize } from "@/lib/cart/cart-types";
import {
  jerseyNameSchema,
  jerseyNumberSchema,
} from "@/lib/validation/jersey-schema";
import { LeagueTeamSelect } from "@/components/storefront/league-team-select";
import { SeasonDisplay } from "@/components/storefront/season-display";
import { SizeSelector } from "@/components/storefront/size-selector";
import { SizeGuideModal } from "@/components/storefront/size-guide-modal";
import { PatchCheckboxes } from "@/components/storefront/patch-checkboxes";
import { NameNumberFields } from "@/components/storefront/name-number-fields";

export interface DraftJersey {
  leagueId: string | null;
  leagueName: string;
  teamId: string | null;
  teamName: string;
  size: JerseySize | null;
  patchIds: string[];
  name: string;
  number: string; // kept as a string in the draft; converted on submit (D-21)
}

// D-12/D-14: "Ingen" pre-checked so the form is valid without an explicit
// patch decision; every other field starts empty/unselected.
export const EMPTY_DRAFT: DraftJersey = {
  leagueId: null,
  leagueName: "",
  teamId: null,
  teamName: "",
  size: null,
  patchIds: ["ingen"],
  name: "",
  number: "",
};

export interface ConfiguratorFormProps {
  draft: DraftJersey;
  setDraft: (d: DraftJersey) => void;
  editingId: string | null;
  onSubmitDone: () => void; // parent clears editingId + resets draft
}

export function ConfiguratorForm({
  draft,
  setDraft,
  editingId,
  onSubmitDone,
}: ConfiguratorFormProps) {
  const dispatch = useCartDispatch();

  const canSubmit =
    draft.leagueId !== null && draft.teamId !== null && draft.size !== null;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      !canSubmit ||
      draft.leagueId === null ||
      draft.teamId === null ||
      draft.size === null
    ) {
      return;
    }

    // Re-validate name/number on submit (never trust only the live
    // per-keystroke validation already shown by NameNumberFields).
    const nameResult = jerseyNameSchema.safeParse(draft.name);
    const numberResult = jerseyNumberSchema.safeParse(draft.number);
    if (!nameResult.success || !numberResult.success) {
      return;
    }

    const trimmedName = draft.name.trim();
    const trimmedNumber = draft.number.trim();

    const item: CartItem = {
      id: editingId ?? crypto.randomUUID(),
      leagueId: draft.leagueId,
      leagueName: draft.leagueName,
      teamId: draft.teamId,
      teamName: draft.teamName,
      season: CURRENT_SEASON,
      size: draft.size,
      patchIds: draft.patchIds,
      name: trimmedName === "" ? undefined : trimmedName,
      number: trimmedNumber === "" ? undefined : Number(trimmedNumber),
    };

    if (editingId) {
      dispatch({ type: "update", id: editingId, item });
    } else {
      dispatch({ type: "add", item });
    }

    onSubmitDone();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <LeagueTeamSelect
        leagueId={draft.leagueId}
        teamId={draft.teamId}
        onLeagueChange={(leagueId, leagueName) =>
          setDraft({
            ...draft,
            leagueId,
            leagueName,
            teamId: null,
            teamName: "",
          })
        }
        onTeamChange={(teamId, teamName) =>
          setDraft({ ...draft, teamId, teamName })
        }
      />

      {draft.teamId !== null && <SeasonDisplay />}

      <div className="relative">
        <SizeSelector
          value={draft.size}
          onChange={(size) => setDraft({ ...draft, size })}
        />
        <div className="absolute top-0 right-0">
          <SizeGuideModal />
        </div>
      </div>

      <PatchCheckboxes
        value={draft.patchIds}
        onChange={(patchIds) => setDraft({ ...draft, patchIds })}
      />

      <NameNumberFields
        name={draft.name}
        number={draft.number}
        onNameChange={(name) => setDraft({ ...draft, name })}
        onNumberChange={(number) => setDraft({ ...draft, number })}
      />

      <button
        type="submit"
        disabled={!canSubmit}
        className="min-h-11 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-emerald-500"
      >
        {editingId ? "Oppdater" : "Legg i handlekurv"}
      </button>
    </form>
  );
}
