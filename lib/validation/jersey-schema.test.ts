import { describe, it, expect } from "vitest";
import { jerseyNameSchema, jerseyNumberSchema } from "./jersey-schema";

const NAME_ERROR = "Kan bare inneholde bokstaver, mellomrom og bindestrek (maks 12 tegn).";
const NUMBER_ERROR = "Må være et helt tall mellom 0 og 99.";

describe("jerseyNameSchema", () => {
  it("accepts empty string (optional, D-22)", () => {
    expect(jerseyNameSchema.safeParse("").success).toBe(true);
  });

  it("accepts international letters, spaces, and hyphens", () => {
    for (const name of ["Müller", "José", "Şahin", "Åge-Sørensen", "Ole Gunnar"]) {
      expect(jerseyNameSchema.safeParse(name).success).toBe(true);
    }
  });

  it("rejects digits", () => {
    expect(jerseyNameSchema.safeParse("Name123").success).toBe(false);
  });

  it("rejects strings over 12 characters (D-20)", () => {
    expect(jerseyNameSchema.safeParse("Toolongname12").success).toBe(false);
  });

  it("emits the exact UI-SPEC error message on failure", () => {
    const result = jerseyNameSchema.safeParse("Name123");
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(NAME_ERROR);
    } else {
      throw new Error("expected parse to fail");
    }
  });
});

describe("jerseyNumberSchema", () => {
  it("accepts empty string (optional, D-22)", () => {
    expect(jerseyNumberSchema.safeParse("").success).toBe(true);
  });

  it("accepts integer strings 0-99", () => {
    for (const n of ["0", "7", "99"]) {
      expect(jerseyNumberSchema.safeParse(n).success).toBe(true);
    }
  });

  it("rejects out-of-range, decimal, negative, and non-numeric input", () => {
    for (const n of ["100", "-1", "1.5", "abc"]) {
      expect(jerseyNumberSchema.safeParse(n).success).toBe(false);
    }
  });

  it("emits the exact UI-SPEC error message on failure", () => {
    const result = jerseyNumberSchema.safeParse("100");
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(NUMBER_ERROR);
    } else {
      throw new Error("expected parse to fail");
    }
  });
});
