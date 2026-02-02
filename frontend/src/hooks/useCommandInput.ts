/**
 * Command Input State Management Hook
 *
 * Custom React hook for managing text input state with command history
 * and arrow key navigation support.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { CommandInputState } from "../types/game";

const MAX_HISTORY_SIZE = 50;

/**
 * Custom hook for managing command input state
 *
 * @returns Object with command input state and handler methods
 *
 * Features:
 * - Text input with validation (non-empty, max 500 chars)
 * - Command history (last 50 commands)
 * - Arrow key navigation through history (Up/Down)
 * - Escape key to clear input
 * - Saves current input when navigating history
 * - Validation error messages
 */
export function useCommandInput() {
  const [inputState, setInputState] = useState<CommandInputState>({
    currentInput: "",
    history: [],
    historyIndex: -1,
    savedInput: "",
    validationError: null,
    isSubmitting: false,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Validate command input
   *
   * @param input - Command string to validate
   * @returns Error message or null if valid
   */
  const validateInput = useCallback((input: string): string | null => {
    if (!input.trim()) {
      return "Command cannot be empty";
    }

    if (input.length > 500) {
      return "Command is too long (max 500 characters)";
    }

    return null;
  }, []);

  /**
   * Handle input text change
   *
   * @param value - New input value
   */
  const handleInputChange = useCallback((value: string) => {
    setInputState((prev) => ({
      ...prev,
      currentInput: value,
      historyIndex: -1, // Reset history navigation
      validationError: null,
    }));
  }, []);

  /**
   * Handle command submission
   *
   * @returns Command text if valid, null if validation fails
   *
   * Validates input, adds to history, clears input, and returns command.
   */
  const handleSubmit = useCallback((): string | null => {
    const error = validateInput(inputState.currentInput);

    if (error) {
      setInputState((prev) => ({
        ...prev,
        validationError: error,
      }));
      return null;
    }

    const command = inputState.currentInput.trim();

    // Add to history
    setInputState((prev) => ({
      ...prev,
      history: [command, ...prev.history].slice(0, MAX_HISTORY_SIZE),
      currentInput: "",
      historyIndex: -1,
      validationError: null,
    }));

    return command;
  }, [inputState, validateInput]);

  /**
   * Handle arrow key navigation through history
   *
   * @param direction - "up" for previous command, "down" for next command
   */
  const handleHistoryNavigation = useCallback((direction: "up" | "down") => {
    setInputState((prev) => {
      const { history, historyIndex, currentInput, savedInput } = prev;

      if (history.length === 0) {
        return prev;
      }

      let newIndex = historyIndex;

      if (direction === "up") {
        // Navigate backward through history (older commands)
        if (historyIndex === -1) {
          // Start history navigation
          newIndex = 0;
        } else if (historyIndex < history.length - 1) {
          newIndex = historyIndex + 1;
        } else {
          // Already at oldest, stay there
          return prev;
        }
      } else {
        // Navigate forward through history (newer commands)
        if (historyIndex === -1) {
          // Can't go down from current input
          return prev;
        } else if (historyIndex > 0) {
          newIndex = historyIndex - 1;
        } else {
          // Reached newest, return to current input
          return {
            ...prev,
            historyIndex: -1,
            currentInput: savedInput,
          };
        }
      }

      // Save current input before switching to history
      const newSavedInput = historyIndex === -1 ? currentInput : savedInput;
      const newCurrentInput = newIndex >= 0 ? history[newIndex] : newSavedInput;

      return {
        ...prev,
        currentInput: newCurrentInput,
        historyIndex: newIndex,
        savedInput: newSavedInput,
      };
    });
  }, []);

  /**
   * Handle Escape key to clear input
   */
  const handleEscape = useCallback(() => {
    setInputState((prev) => ({
      ...prev,
      currentInput: "",
      historyIndex: -1,
      savedInput: "",
      validationError: null,
    }));
  }, []);

  /**
   * Set submitting state (during API call)
   *
   * @param submitting - true if API call in progress
   */
  const setSubmitting = useCallback((submitting: boolean) => {
    setInputState((prev) => ({
      ...prev,
      isSubmitting: submitting,
    }));
  }, []);

  /**
   * Get command history (read-only)
   */
  const getHistory = useCallback((): string[] => {
    return [...inputState.history];
  }, [inputState.history]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setInputState((prev) => ({
      ...prev,
      history: [],
      historyIndex: -1,
      savedInput: "",
    }));
  }, []);

  /**
   * Reset input state (for page navigation)
   */
  const reset = useCallback(() => {
    setInputState({
      currentInput: "",
      history: [],
      historyIndex: -1,
      savedInput: "",
      validationError: null,
      isSubmitting: false,
    });
  }, []);

  return {
    // State
    ...inputState,

    // Input handlers
    handleInputChange,
    handleSubmit,
    handleHistoryNavigation,
    handleEscape,

    // State setters
    setSubmitting,

    // History management
    getHistory,
    clearHistory,

    // State management
    reset,

    // Validation
    validateInput,

    // Ref for focus management
    inputRef,
  };
}

/**
 * Hook to attach keyboard event listeners to command input
 *
 * @param inputRef - React ref to input element
 * @param onEnter - Callback for Enter key
 * @param onArrowUp - Callback for Up arrow
 * @param onArrowDown - Callback for Down arrow
 * @param onEscape - Callback for Escape key
 */
export function useCommandInputKeyboard(
  inputRef: React.RefObject<HTMLInputElement>,
  onEnter: () => void,
  onArrowUp: () => void,
  onArrowDown: () => void,
  onEscape: () => void,
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard events when input is focused
      if (inputRef.current !== document.activeElement) {
        return;
      }

      switch (e.key) {
        case "Enter":
          e.preventDefault();
          onEnter();
          break;
        case "ArrowUp":
          e.preventDefault();
          onArrowUp();
          break;
        case "ArrowDown":
          e.preventDefault();
          onArrowDown();
          break;
        case "Escape":
          e.preventDefault();
          onEscape();
          break;
      }
    };

    const input = inputRef.current;
    if (input) {
      input.addEventListener("keydown", handleKeyDown);
      return () => {
        input.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [inputRef, onEnter, onArrowUp, onArrowDown, onEscape]);
}
