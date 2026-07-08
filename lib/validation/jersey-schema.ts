// lib/validation/jersey-schema.ts
// Zod schemas for the print name/number fields (PROD-04, D-20..D-22). Used
// client-side for live on-blur/on-change feedback (D-23, name-number-fields
// component) and re-usable server-side in Phase 3 for defense-in-depth.
import { z } from "zod";

const NAME_ERROR =
  "Kan bare inneholde bokstaver, mellomrom og bindestrek (maks 12 tegn).";
const NUMBER_ERROR = "Må være et helt tall mellom 0 og 99.";

// D-20: max 12 chars, Unicode letters (\p{L}, not a hardcoded Latin+diacritics
// class — see 02-RESEARCH.md Pitfall 3) plus space and hyphen. D-22: optional,
// empty string is valid (no validation runs on blank input).
export const jerseyNameSchema = z
  .string()
  .trim()
  .max(12, NAME_ERROR)
  .regex(/^[\p{L}\s-]*$/u, NAME_ERROR)
  .optional()
  .or(z.literal(""));

// D-21: integer 0-99 only. Regex-then-refine on the raw string (not
// z.coerce.number()) so strings like "1e2"/"0x10"/" 5 " can never coerce to
// an unexpected numeric value — see 02-RESEARCH.md Pitfall 4. D-22: optional,
// empty string is valid.
export const jerseyNumberSchema = z
  .union([
    z.literal(""),
    z
      .string()
      .regex(/^\d{1,2}$/, NUMBER_ERROR)
      .refine((val) => Number(val) >= 0 && Number(val) <= 99, NUMBER_ERROR),
  ])
  .optional();
