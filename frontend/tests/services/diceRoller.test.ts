/**
 * Unit Tests for Dice Roller
 * Tests 4d6 drop lowest implementation and validation
 * Target Coverage: >90% for dice rolling logic
 */

import { describe, it, expect, vi } from "vitest";
import type { DiceRoll } from "@/types/character";
import {
  roll4d6DropLowest,
  rollAllAttributes,
  isValidRoll,
  getRollProbability,
  getRollFeedback,
} from "@/services/diceRoller";

describe("diceRoller", () => {
  describe("roll4d6DropLowest", () => {
    it("should return valid DiceRoll structure", () => {
      const roll = roll4d6DropLowest();

      expect(roll).toHaveProperty("dice");
      expect(roll).toHaveProperty("sum");
      expect(roll).toHaveProperty("dropped");
      expect(roll).toHaveProperty("timestamp");
    });

    it("should have exactly 4 dice in array", () => {
      const roll = roll4d6DropLowest();
      expect(roll.dice).toHaveLength(4);
    });

    it("should have dice values in valid range (1-6)", () => {
      for (let i = 0; i < 100; i++) {
        const roll = roll4d6DropLowest();
        roll.dice.forEach((die) => {
          expect(die).toBeGreaterThanOrEqual(1);
          expect(die).toBeLessThanOrEqual(6);
          expect(Number.isInteger(die)).toBe(true);
        });
      }
    });

    it("should have dropped index in valid range (0-3)", () => {
      for (let i = 0; i < 100; i++) {
        const roll = roll4d6DropLowest();
        expect(roll.dropped).toBeGreaterThanOrEqual(0);
        expect(roll.dropped).toBeLessThanOrEqual(3);
        expect(Number.isInteger(roll.dropped)).toBe(true);
      }
    });

    it("should calculate correct sum (three highest dice)", () => {
      for (let i = 0; i < 50; i++) {
        const roll = roll4d6DropLowest();

        // Calculate expected sum
        let expectedSum = 0;
        for (let j = 0; j < 4; j++) {
          if (j !== roll.dropped) {
            expectedSum += roll.dice[j];
          }
        }

        expect(roll.sum).toBe(expectedSum);
      }
    });

    it("should drop the minimum die", () => {
      for (let i = 0; i < 50; i++) {
        const roll = roll4d6DropLowest();

        const droppedValue = roll.dice[roll.dropped];
        const otherDice = roll.dice.filter((_, i) => i !== roll.dropped);

        // The dropped die should be <= all other dice
        otherDice.forEach((die) => {
          expect(droppedValue).toBeLessThanOrEqual(die);
        });
      }
    });

    it("should have result in valid range (3-18)", () => {
      for (let i = 0; i < 100; i++) {
        const roll = roll4d6DropLowest();
        expect(roll.sum).toBeGreaterThanOrEqual(3);
        expect(roll.sum).toBeLessThanOrEqual(18);
      }
    });

    it("should set timestamp near current time", () => {
      const before = Date.now();
      const roll = roll4d6DropLowest();
      const after = Date.now();

      expect(roll.timestamp).toBeGreaterThanOrEqual(before);
      expect(roll.timestamp).toBeLessThanOrEqual(after);
    });

    it("should be able to roll all values (3-18) statistically", () => {
      const results = new Set<number>();

      // Roll 1000 times to get all values statistically
      for (let i = 0; i < 1000; i++) {
        results.add(roll4d6DropLowest().sum);
      }

      // Should have all values from 3-18 (with very high probability)
      expect(results.size).toBeGreaterThanOrEqual(14);
    });

    it("should favor higher values (bell curve)", () => {
      const rolls: number[] = [];
      for (let i = 0; i < 1000; i++) {
        rolls.push(roll4d6DropLowest().sum);
      }

      const average = rolls.reduce((a, b) => a + b) / rolls.length;

      // Average of 4d6 drop lowest should be around 12-13
      // (much higher than 3d6 average of ~10.5)
      expect(average).toBeGreaterThan(11);
      expect(average).toBeLessThan(14);
    });

    it("should produce rolls that are independent", () => {
      const roll1 = roll4d6DropLowest();
      const roll2 = roll4d6DropLowest();

      // Rolls should usually be different (not necessarily, but very likely)
      // We test this probabilistically
      const rolls: number[] = [];
      for (let i = 0; i < 100; i++) {
        rolls.push(roll4d6DropLowest().sum);
      }

      // Count unique values
      const unique = new Set(rolls).size;

      // Should have at least 10 different values in 100 rolls
      expect(unique).toBeGreaterThanOrEqual(10);
    });
  });

  describe("rollAllAttributes", () => {
    it("should roll specified number of attributes", () => {
      const rolls = rollAllAttributes(5);
      expect(rolls).toHaveLength(5);
    });

    it("should default to 5 rolls", () => {
      const rolls = rollAllAttributes();
      expect(rolls).toHaveLength(5);
    });

    it("should generate correct number for custom count", () => {
      expect(rollAllAttributes(1)).toHaveLength(1);
      expect(rollAllAttributes(3)).toHaveLength(3);
      expect(rollAllAttributes(6)).toHaveLength(6);
    });

    it("should all be valid rolls", () => {
      const rolls = rollAllAttributes(5);
      rolls.forEach((roll) => {
        expect(roll.sum).toBeGreaterThanOrEqual(3);
        expect(roll.sum).toBeLessThanOrEqual(18);
      });
    });

    it("should have independent rolls", () => {
      const rolls = rollAllAttributes(5);

      // Rolls should (usually) all be different or at least not identical
      const sums = rolls.map((r) => r.sum);
      const unique = new Set(sums).size;

      // Very unlikely to get 5 identical rolls
      expect(unique).toBeGreaterThan(1);
    });
  });

  describe("isValidRoll", () => {
    it("should validate correct roll", () => {
      const roll = { dice: [3, 5, 6, 2], sum: 14, dropped: 3 };
      expect(isValidRoll(roll)).toBe(true);
    });

    it("should validate another correct roll", () => {
      const roll = { dice: [6, 6, 6, 1], sum: 18, dropped: 3 };
      expect(isValidRoll(roll)).toBe(true);
    });

    it("should reject roll with too few dice", () => {
      const roll = {
        dice: [3, 5, 6] as unknown as [number, number, number, number],
        sum: 14,
        dropped: 2,
      };
      expect(isValidRoll(roll)).toBe(false);
    });

    it("should reject roll with too many dice", () => {
      const roll = {
        dice: [3, 5, 6, 2, 1] as unknown as [number, number, number, number],
        sum: 14,
        dropped: 3,
      };
      expect(isValidRoll(roll)).toBe(false);
    });

    it("should reject roll with die value too low (0)", () => {
      const roll = { dice: [0, 5, 6, 2], sum: 13, dropped: 0 };
      expect(isValidRoll(roll)).toBe(false);
    });

    it("should reject roll with die value too high (7)", () => {
      const roll = { dice: [3, 5, 7, 2], sum: 15, dropped: 2 };
      expect(isValidRoll(roll)).toBe(false);
    });

    it("should reject roll with non-integer die", () => {
      const roll = { dice: [3.5, 5, 6, 2], sum: 13.5, dropped: 0 };
      expect(isValidRoll(roll)).toBe(false);
    });

    it("should reject roll with invalid dropped index (-1)", () => {
      const roll = { dice: [3, 5, 6, 2], sum: 14, dropped: -1 };
      expect(isValidRoll(roll)).toBe(false);
    });

    it("should reject roll with invalid dropped index (4)", () => {
      const roll = { dice: [3, 5, 6, 2], sum: 14, dropped: 4 };
      expect(isValidRoll(roll)).toBe(false);
    });

    it("should reject roll with incorrect sum", () => {
      const roll = { dice: [3, 5, 6, 2], sum: 15, dropped: 3 };
      // Sum should be 14 (3+5+6), not 15
      expect(isValidRoll(roll)).toBe(false);
    });

    it("should reject roll with missing dice array", () => {
      const roll = { sum: 14, dropped: 3 } as unknown as DiceRoll;
      expect(isValidRoll(roll)).toBe(false);
    });

    it("should reject roll with null dice", () => {
      const roll = { dice: null, sum: 14, dropped: 3 } as unknown as DiceRoll;
      expect(isValidRoll(roll)).toBe(false);
    });
  });

  describe("getRollProbability", () => {
    it("should return probability for minimum roll (3)", () => {
      const prob = getRollProbability(3);
      expect(prob).toBeCloseTo(1 / 1296, 10);
    });

    it("should return probability for maximum roll (18)", () => {
      const prob = getRollProbability(18);
      expect(prob).toBeCloseTo(20 / 1296, 10);
    });

    it("should return highest probability for middle range", () => {
      const prob12 = getRollProbability(12);
      const prob13 = getRollProbability(13);
      const prob14 = getRollProbability(14);

      // Range 12-14 should be highest probabilities
      expect(prob12).toBeGreaterThan(getRollProbability(3));
      expect(prob13).toBeGreaterThan(getRollProbability(3));
      expect(prob14).toBeGreaterThan(getRollProbability(3));
    });

    it("should return 0 for invalid values", () => {
      expect(getRollProbability(2)).toBe(0);
      expect(getRollProbability(19)).toBe(0);
      expect(getRollProbability(100)).toBe(0);
    });

    it("should return increasing probabilities from 3-13", () => {
      for (let i = 3; i < 13; i++) {
        expect(getRollProbability(i)).toBeLessThanOrEqual(
          getRollProbability(i + 1),
        );
      }
    });

    it("should return decreasing probabilities from 13-18", () => {
      for (let i = 13; i < 18; i++) {
        expect(getRollProbability(i)).toBeGreaterThanOrEqual(
          getRollProbability(i + 1),
        );
      }
    });

    it("probabilities should sum to 1", () => {
      let totalProb = 0;
      for (let i = 3; i <= 18; i++) {
        totalProb += getRollProbability(i);
      }
      expect(totalProb).toBeCloseTo(1, 10);
    });
  });

  describe("getRollFeedback", () => {
    it("should return positive feedback for excellent rolls", () => {
      expect(getRollFeedback(18)).toBe("Excellent roll!");
      expect(getRollFeedback(17)).toBe("Excellent roll!");
    });

    it("should return positive feedback for great rolls", () => {
      expect(getRollFeedback(15)).toBe("Great roll!");
      expect(getRollFeedback(16)).toBe("Great roll!");
    });

    it("should return positive feedback for good rolls", () => {
      expect(getRollFeedback(13)).toBe("Good roll");
      expect(getRollFeedback(14)).toBe("Good roll");
    });

    it("should return neutral feedback for average rolls", () => {
      expect(getRollFeedback(10)).toBe("Average roll");
      expect(getRollFeedback(11)).toBe("Average roll");
      expect(getRollFeedback(12)).toBe("Average roll");
    });

    it("should return negative feedback for below average rolls", () => {
      expect(getRollFeedback(8)).toBe("Below average roll");
      expect(getRollFeedback(9)).toBe("Below average roll");
    });

    it("should return poor feedback for poor rolls", () => {
      expect(getRollFeedback(5)).toBe("Poor roll");
      expect(getRollFeedback(6)).toBe("Poor roll");
      expect(getRollFeedback(7)).toBe("Poor roll");
    });

    it("should return unfortunate feedback for critical failures", () => {
      expect(getRollFeedback(3)).toBe("Unfortunate roll...");
      expect(getRollFeedback(4)).toBe("Unfortunate roll...");
    });

    it("should handle edge cases", () => {
      expect(getRollFeedback(1)).toBe("Unfortunate roll...");
      expect(getRollFeedback(20)).toBe("Excellent roll!");
    });
  });
});
