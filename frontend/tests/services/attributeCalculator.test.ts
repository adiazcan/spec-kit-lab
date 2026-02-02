/**
 * Unit Tests for Attribute Calculator
 * Tests modifier calculation, formatting, and lookup functions
 * Target Coverage: >90% for critical calculation logic
 */

import { describe, it, expect } from "vitest";
import {
  calculateModifier,
  calculateAllModifiers,
  formatModifier,
  calculateModifierFast,
  getAttributeKeys,
  formatAttributesSummary,
  getHighestModifier,
} from "@/services/attributeCalculator";

describe("attributeCalculator", () => {
  describe("calculateModifier", () => {
    // Test all valid attribute values (3-18)
    const testCases = [
      { value: 3, expected: -4 },
      { value: 4, expected: -3 },
      { value: 5, expected: -3 },
      { value: 6, expected: -2 },
      { value: 7, expected: -2 },
      { value: 8, expected: -1 },
      { value: 9, expected: -1 },
      { value: 10, expected: 0 },
      { value: 11, expected: 0 },
      { value: 12, expected: 1 },
      { value: 13, expected: 1 },
      { value: 14, expected: 2 },
      { value: 15, expected: 2 },
      { value: 16, expected: 3 },
      { value: 17, expected: 3 },
      { value: 18, expected: 4 },
    ];

    testCases.forEach(({ value, expected }) => {
      it(`should calculate correct modifier for ${value} → ${expected}`, () => {
        expect(calculateModifier(value)).toBe(expected);
      });
    });

    it("should throw when value is below minimum (2)", () => {
      expect(() => calculateModifier(2)).toThrow(
        /must be integer between 3-18/,
      );
    });

    it("should throw when value is above maximum (19)", () => {
      expect(() => calculateModifier(19)).toThrow(
        /must be integer between 3-18/,
      );
    });

    it("should throw when value is not an integer (10.5)", () => {
      expect(() => calculateModifier(10.5)).toThrow(
        /must be integer between 3-18/,
      );
    });

    it("should throw when value is negative (-5)", () => {
      expect(() => calculateModifier(-5)).toThrow(
        /must be integer between 3-18/,
      );
    });

    it("should throw when value is null", () => {
      expect(() => calculateModifier(null as unknown as number)).toThrow(
        /must be integer between 3-18/,
      );
    });

    it("should throw when value is undefined", () => {
      expect(() => calculateModifier(undefined as unknown as number)).toThrow(
        /must be integer between 3-18/,
      );
    });

    it("should throw when value is NaN", () => {
      expect(() => calculateModifier(NaN)).toThrow(
        /must be integer between 3-18/,
      );
    });
  });

  describe("calculateAllModifiers", () => {
    it("should calculate modifiers for all attributes", () => {
      const attributes = {
        str: 14,
        dex: 8,
        int: 18,
        con: 12,
        cha: 10,
      };

      const result = calculateAllModifiers(attributes);

      expect(result).toEqual({
        str: 2,
        dex: -1,
        int: 4,
        con: 1,
        cha: 0,
      });
    });

    it("should handle partial attributes", () => {
      const attributes = { str: 16, dex: 12 };
      const result = calculateAllModifiers(attributes);

      expect(result).toEqual({
        str: 3,
        dex: 1,
      });
    });

    it("should handle empty attributes object", () => {
      const result = calculateAllModifiers({});
      expect(result).toEqual({});
    });

    it("should skip null and undefined values", () => {
      const attributes = {
        str: 14,
        dex: null as unknown as number,
        int: undefined as unknown as number,
        con: 12,
      };

      const result = calculateAllModifiers(attributes);

      expect(result).toEqual({
        str: 2,
        con: 1,
      });

      expect(result.dex).toBeUndefined();
      expect(result.int).toBeUndefined();
    });

    it("should throw if invalid attribute is included", () => {
      const attributes = { str: 25, dex: 12 };
      expect(() => calculateAllModifiers(attributes)).toThrow();
    });
  });

  describe("formatModifier", () => {
    it("should format positive modifiers with plus sign", () => {
      expect(formatModifier(1)).toBe("+1");
      expect(formatModifier(2)).toBe("+2");
      expect(formatModifier(4)).toBe("+4");
    });

    it("should format zero with plus sign", () => {
      expect(formatModifier(0)).toBe("+0");
    });

    it("should format negative modifiers without double sign", () => {
      expect(formatModifier(-1)).toBe("-1");
      expect(formatModifier(-2)).toBe("-2");
      expect(formatModifier(-4)).toBe("-4");
    });

    it("should handle large positive/negative values", () => {
      expect(formatModifier(10)).toBe("+10");
      expect(formatModifier(-10)).toBe("-10");
    });
  });

  describe("calculateModifierFast", () => {
    it("should return same result as calculateModifier using cache", () => {
      // Test a few values to verify cache consistency
      [3, 8, 10, 14, 18].forEach((value) => {
        expect(calculateModifierFast(value)).toBe(calculateModifier(value));
      });
    });

    it("should throw for values outside cache range", () => {
      expect(() => calculateModifierFast(2)).toThrow(
        /not in cache.*valid range 3-18/,
      );
      expect(() => calculateModifierFast(19)).toThrow(
        /not in cache.*valid range 3-18/,
      );
    });
  });

  describe("getAttributeKeys", () => {
    it("should return all attribute keys in order", () => {
      const keys = getAttributeKeys();
      expect(keys).toEqual(["str", "dex", "int", "con", "cha"]);
    });

    it("should return array in canonical order (for consistent iteration)", () => {
      const keys = getAttributeKeys();
      expect(keys[0]).toBe("str");
      expect(keys[4]).toBe("cha");
    });

    it("should have length of 5", () => {
      expect(getAttributeKeys()).toHaveLength(5);
    });
  });

  describe("formatAttributesSummary", () => {
    it("should format complete attribute summary", () => {
      const attributes = {
        str: 14,
        dex: 10,
        int: 18,
        con: 12,
        cha: 9,
      };

      const result = formatAttributesSummary(attributes);

      expect(result).toBe(
        "STR 14 (+2), DEX 10 (+0), INT 18 (+4), CON 12 (+1), CHA 9 (-1)",
      );
    });

    it("should handle edge case values", () => {
      const attributes = {
        str: 3,
        dex: 18,
        int: 10,
        con: 3,
        cha: 18,
      };

      const result = formatAttributesSummary(attributes);

      expect(result).toBe(
        "STR 3 (-4), DEX 18 (+4), INT 10 (+0), CON 3 (-4), CHA 18 (+4)",
      );
    });

    it("should use uppercase attribute names", () => {
      const attributes = {
        str: 10,
        dex: 10,
        int: 10,
        con: 10,
        cha: 10,
      };

      const result = formatAttributesSummary(attributes);

      // Check that all attribute codes are uppercase
      expect(result).toMatch(/STR.*DEX.*INT.*CON.*CHA/);
      expect(result).not.toMatch(/str|dex|int|con|cha/);
    });
  });

  describe("getHighestModifier", () => {
    it("should return highest modifier from attributes", () => {
      const attributes = {
        str: 10,
        dex: 14,
        int: 18,
        con: 12,
        cha: 9,
      };

      expect(getHighestModifier(attributes)).toBe(4); // INT 18 → +4
    });

    it("should work with all negative modifiers", () => {
      const attributes = {
        str: 3,
        dex: 5,
        int: 7,
        con: 6,
        cha: 4,
      };

      expect(getHighestModifier(attributes)).toBe(-2); // Highest is -2 (tied)
    });

    it("should work with all positive modifiers", () => {
      const attributes = {
        str: 16,
        dex: 14,
        int: 18,
        con: 15,
        cha: 17,
      };

      expect(getHighestModifier(attributes)).toBe(4); // INT 18 → +4
    });

    it("should work with all same values", () => {
      const attributes = {
        str: 14,
        dex: 14,
        int: 14,
        con: 14,
        cha: 14,
      };

      expect(getHighestModifier(attributes)).toBe(2); // All → +2
    });

    it("should handle edge minimum (all 3s)", () => {
      const attributes = {
        str: 3,
        dex: 3,
        int: 3,
        con: 3,
        cha: 3,
      };

      expect(getHighestModifier(attributes)).toBe(-4);
    });

    it("should handle edge maximum (all 18s)", () => {
      const attributes = {
        str: 18,
        dex: 18,
        int: 18,
        con: 18,
        cha: 18,
      };

      expect(getHighestModifier(attributes)).toBe(4);
    });
  });
});
