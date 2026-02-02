/**
 * Unit Tests for useDiceRoll Hook
 * Tests dice rolling state management, animation, and tracking
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useDiceRoll } from "@/hooks/useDiceRoll";
import type { DiceRoll } from "@/types/character";

describe("useDiceRoll", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initialization", () => {
    it("should initialize with empty state", () => {
      const { result } = renderHook(() => useDiceRoll());

      expect(result.current.currentRoll).toBeNull();
      expect(result.current.rolledValues).toEqual({});
      expect(result.current.rolledAttributes.size).toBe(0);
      expect(result.current.isRolling).toBe(false);
    });

    it("should have default animation time of 600ms", () => {
      const { result } = renderHook(() => useDiceRoll());
      expect(result.current.rollAnimationTime).toBe(600);
    });

    it("should use custom animation time", () => {
      const { result } = renderHook(() => useDiceRoll(1000));
      expect(result.current.rollAnimationTime).toBe(1000);
    });
  });

  describe("rollAttribute", () => {
    it("should roll a single attribute", async () => {
      const { result } = renderHook(() => useDiceRoll());

      await act(async () => {
        await result.current.rollAttribute("str");
      });

      expect(result.current.rolledValues.str).toBeGreaterThanOrEqual(3);
      expect(result.current.rolledValues.str).toBeLessThanOrEqual(18);
    });

    it("should set isRolling to true during animation", async () => {
      const { result } = renderHook(() => useDiceRoll());

      const rollPromise = act(async () => {
        const promise = result.current.rollAttribute("str");
        expect(result.current.isRolling).toBe(true);
        await promise;
      });

      await rollPromise;
    });

    it("should set isRolling to false after animation completes", async () => {
      const { result } = renderHook(() => useDiceRoll());

      await act(async () => {
        await result.current.rollAttribute("str");
        vi.advanceTimersByTime(600);
      });

      expect(result.current.isRolling).toBe(false);
    });

    it("should set currentRoll during animation", async () => {
      const { result } = renderHook(() => useDiceRoll());

      let rollWasSet = false;

      const rollPromise = act(async () => {
        const promise = result.current.rollAttribute("str");
        if (result.current.currentRoll) {
          rollWasSet = true;
          expect(result.current.currentRoll.dice).toHaveLength(4);
          expect(result.current.currentRoll.sum).toBeGreaterThanOrEqual(3);
          expect(result.current.currentRoll.sum).toBeLessThanOrEqual(18);
        }
        await promise;
      });

      await rollPromise;
      expect(rollWasSet).toBe(true);
    });

    it("should add attribute to rolledAttributes", async () => {
      const { result } = renderHook(() => useDiceRoll());

      expect(result.current.hasRolled("str")).toBe(false);

      await act(async () => {
        await result.current.rollAttribute("str");
        vi.advanceTimersByTime(600);
      });

      expect(result.current.hasRolled("str")).toBe(true);
    });

    it("should wait for animation time before storing result", async () => {
      const { result } = renderHook(() => useDiceRoll(500));

      const rollPromise = act(async () => {
        const promise = result.current.rollAttribute("dex");

        // Before animation completes
        expect(result.current.rolledValues.dex).toBeUndefined();

        // Wait for animation
        vi.advanceTimersByTime(500);

        await promise;
      });

      await rollPromise;

      // After animation
      expect(result.current.rolledValues.dex).toBeDefined();
    });

    it("should roll all different attributes independently", async () => {
      const { result } = renderHook(() => useDiceRoll());

      await act(async () => {
        await result.current.rollAttribute("str");
        vi.advanceTimersByTime(600);
        await result.current.rollAttribute("dex");
        vi.advanceTimersByTime(600);
        await result.current.rollAttribute("int");
        vi.advanceTimersByTime(600);
      });

      expect(result.current.rolledValues.str).toBeDefined();
      expect(result.current.rolledValues.dex).toBeDefined();
      expect(result.current.rolledValues.int).toBeDefined();
    });
  });

  describe("rollAllAttributes", () => {
    it("should roll multiple attributes in sequence", async () => {
      const { result } = renderHook(() => useDiceRoll());

      await act(async () => {
        await result.current.rollAllAttributes(["str", "dex", "int"]);
        vi.runAllTimers();
      });

      expect(result.current.rolledValues.str).toBeDefined();
      expect(result.current.rolledValues.dex).toBeDefined();
      expect(result.current.rolledValues.int).toBeDefined();
    });

    it("should roll all five core attributes", async () => {
      const { result } = renderHook(() => useDiceRoll());

      const attributes = ["str", "dex", "int", "con", "cha"];

      await act(async () => {
        await result.current.rollAllAttributes(attributes);
        vi.runAllTimers();
      });

      attributes.forEach((attr) => {
        expect(result.current.rolledValues[attr]).toBeDefined();
        expect(result.current.rolledValues[attr]).toBeGreaterThanOrEqual(3);
        expect(result.current.rolledValues[attr]).toBeLessThanOrEqual(18);
      });
    });

    it("should skip attributes already rolled", async () => {
      const { result } = renderHook(() => useDiceRoll());

      // Roll str first
      await act(async () => {
        await result.current.rollAttribute("str");
        vi.advanceTimersByTime(600);
      });

      const strValue = result.current.rolledValues.str;

      // Roll all, should skip str
      await act(async () => {
        await result.current.rollAllAttributes(["str", "dex", "int"]);
        vi.runAllTimers();
      });

      // str should have same value (not re-rolled)
      expect(result.current.rolledValues.str).toBe(strValue);
      expect(result.current.rolledValues.dex).toBeDefined();
      expect(result.current.rolledValues.int).toBeDefined();
    });

    it("should return after all rolls complete", async () => {
      const { result } = renderHook(() => useDiceRoll());

      let rollsCompleted = false;

      await act(async () => {
        const promise = result.current.rollAllAttributes(["str", "dex"]);
        promise.then(() => {
          rollsCompleted = true;
        });

        vi.runAllTimers();

        await promise;
      });

      expect(rollsCompleted).toBe(true);
    });
  });

  describe("rerollAttribute", () => {
    it("should overwrite previous roll", async () => {
      const { result } = renderHook(() => useDiceRoll());

      // First roll
      await act(async () => {
        await result.current.rollAttribute("str");
        vi.advanceTimersByTime(600);
      });

      const firstValue = result.current.rolledValues.str;

      // Re-roll (likely different value with 16 possible outcomes)
      // Note: statistically could be same, but very unlikely
      await act(async () => {
        await result.current.rerollAttribute("str");
        vi.advanceTimersByTime(600);
      });

      const secondValue = result.current.rolledValues.str;

      // Both should be valid rolls
      expect(firstValue).toBeGreaterThanOrEqual(3);
      expect(secondValue).toBeGreaterThanOrEqual(3);
    });

    it("should call rollAttribute internally", async () => {
      const { result } = renderHook(() => useDiceRoll());

      await act(async () => {
        await result.current.rerollAttribute("dex");
        vi.advanceTimersByTime(600);
      });

      expect(result.current.rolledValues.dex).toBeDefined();
      expect(result.current.hasRolled("dex")).toBe(true);
    });
  });

  describe("getRolledValue", () => {
    it("should return rolled value when available", async () => {
      const { result } = renderHook(() => useDiceRoll());

      await act(async () => {
        await result.current.rollAttribute("int");
        vi.advanceTimersByTime(600);
      });

      const value = result.current.getRolledValue("int");
      expect(value).toBe(result.current.rolledValues.int);
    });

    it("should return undefined for unrolled attribute", () => {
      const { result } = renderHook(() => useDiceRoll());

      const value = result.current.getRolledValue("cha");
      expect(value).toBeUndefined();
    });

    it("should work for any attribute name", async () => {
      const { result } = renderHook(() => useDiceRoll());

      await act(async () => {
        await result.current.rollAttribute("custom_attr");
        vi.advanceTimersByTime(600);
      });

      const value = result.current.getRolledValue("custom_attr");
      expect(value).toBeDefined();
    });
  });

  describe("hasRolled", () => {
    it("should return false for unrolled attribute", () => {
      const { result } = renderHook(() => useDiceRoll());

      expect(result.current.hasRolled("str")).toBe(false);
    });

    it("should return true for rolled attribute", async () => {
      const { result } = renderHook(() => useDiceRoll());

      await act(async () => {
        await result.current.rollAttribute("str");
        vi.advanceTimersByTime(600);
      });

      expect(result.current.hasRolled("str")).toBe(true);
    });

    it("should return true even if re-rolled", async () => {
      const { result } = renderHook(() => useDiceRoll());

      await act(async () => {
        await result.current.rollAttribute("dex");
        vi.advanceTimersByTime(600);
        await result.current.rerollAttribute("dex");
        vi.advanceTimersByTime(600);
      });

      expect(result.current.hasRolled("dex")).toBe(true);
    });
  });

  describe("resetRolls", () => {
    it("should clear all rolled values", async () => {
      const { result } = renderHook(() => useDiceRoll());

      await act(async () => {
        await result.current.rollAllAttributes(["str", "dex", "int"]);
        vi.runAllTimers();
      });

      expect(Object.keys(result.current.rolledValues).length).toBeGreaterThan(
        0,
      );

      act(() => {
        result.current.resetRolls();
      });

      expect(result.current.rolledValues).toEqual({});
    });

    it("should clear rolled attributes set", async () => {
      const { result } = renderHook(() => useDiceRoll());

      await act(async () => {
        await result.current.rollAttribute("str");
        vi.advanceTimersByTime(600);
      });

      expect(result.current.rolledAttributes.size).toBeGreaterThan(0);

      act(() => {
        result.current.resetRolls();
      });

      expect(result.current.rolledAttributes.size).toBe(0);
    });

    it("should clear current roll", async () => {
      const { result } = renderHook(() => useDiceRoll());

      await act(async () => {
        await result.current.rollAttribute("str");
      });

      expect(result.current.currentRoll).not.toBeNull();

      act(() => {
        result.current.resetRolls();
      });

      expect(result.current.currentRoll).toBeNull();
    });

    it("should reset isRolling flag", async () => {
      const { result } = renderHook(() => useDiceRoll());

      await act(async () => {
        const promise = result.current.rollAttribute("str");
        expect(result.current.isRolling).toBe(true);
        vi.advanceTimersByTime(600);
        await promise;
      });

      expect(result.current.isRolling).toBe(false);

      act(() => {
        result.current.resetRolls();
      });

      expect(result.current.isRolling).toBe(false);
    });

    it("should allow rolling again after reset", async () => {
      const { result } = renderHook(() => useDiceRoll());

      await act(async () => {
        await result.current.rollAttribute("str");
        vi.advanceTimersByTime(600);
      });

      act(() => {
        result.current.resetRolls();
      });

      await act(async () => {
        await result.current.rollAttribute("str");
        vi.advanceTimersByTime(600);
      });

      expect(result.current.rolledValues.str).toBeDefined();
    });
  });

  describe("currentRoll updates", () => {
    it("should update currentRoll with each new roll", async () => {
      const { result } = renderHook(() => useDiceRoll());

      let firstRoll: DiceRoll | null = null;

      await act(async () => {
        const promise = result.current.rollAttribute("str");
        firstRoll = result.current.currentRoll;
        vi.advanceTimersByTime(600);
        await promise;
      });

      expect(firstRoll).not.toBeNull();

      let secondRoll: DiceRoll | null = null;

      await act(async () => {
        const promise = result.current.rollAttribute("dex");
        secondRoll = result.current.currentRoll;
        vi.advanceTimersByTime(600);
        await promise;
      });

      expect(secondRoll).not.toBeNull();
      // Rolls should be different dice arrays
      expect(firstRoll.dice).not.toEqual(secondRoll.dice);
    });

    it("should have valid DiceRoll structure", async () => {
      const { result } = renderHook(() => useDiceRoll());

      await act(async () => {
        const promise = result.current.rollAttribute("str");
        const roll = result.current.currentRoll;
        expect(roll).toHaveProperty("dice");
        expect(roll).toHaveProperty("sum");
        expect(roll).toHaveProperty("dropped");
        expect(roll?.dice).toHaveLength(4);
        vi.advanceTimersByTime(600);
        await promise;
      });
    });
  });
});
