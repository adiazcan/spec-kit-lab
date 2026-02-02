/**
 * Command Input Component
 *
 * Provides a text input field for player commands with:
 * - Text input with Enter key submission
 * - Up/Down arrow navigation through command history
 * - Escape key to clear input
 * - Command validation with inline error display
 * - Loading/disabled state during API submission
 * - Submit button and keyboard support
 *
 * T027: Create CommandInput component with text input and submit button
 * T029: Implement keyboard event handlers (Enter, Up/Down, Escape)
 * T030: Add command validation with inline error display
 */

import React, { useCallback, useEffect } from "react";
import {
  useCommandInput,
  useCommandInputKeyboard,
} from "../../hooks/useCommandInput";

/**
 * Props for CommandInput component
 */
interface CommandInputProps {
  /**
   * Callback when a valid command is submitted
   * @param command - The validated command string
   */
  onSubmit: (command: string) => void | Promise<void>;

  /**
   * Callback when command input is disabled/enabled
   * (for disabling during API submission)
   * @param disabled - true if input should be disabled
   */
  onDisabledChange?: (disabled: boolean) => void;

  /**
   * Whether input should be disabled
   * (e.g., during loading or when adventure not loaded)
   */
  disabled?: boolean;

  /**
   * Placeholder text for the input field
   * @default "Enter a command... (↑/↓ for history, ESC to clear)"
   */
  placeholder?: string;
}

/**
 * CommandInput Component
 *
 * A text input field with command history navigation and validation.
 *
 * Features:
 * - Accepts player commands via text input
 * - Enter key submits command
 * - Up/Down arrow keys navigate command history
 * - Escape key clears the input
 * - Validates command (non-empty, max 500 chars)
 * - Shows validation errors inline
 * - Disabled state during API submission
 * - Keyboard shortcuts: Enter (submit), Up/Down (history), Escape (clear)
 *
 * @component
 * @example
 * const handleCommand = async (cmd: string) => {
 *   // Submit command to game engine
 *   const result = await gameApi.submitCommand(adventureId, cmd);
 * };
 *
 * return <CommandInput onSubmit={handleCommand} disabled={isLoading} />;
 */
export const CommandInput: React.FC<CommandInputProps> = ({
  onSubmit,
  onDisabledChange,
  disabled = false,
  placeholder = "Enter a command... (↑/↓ for history, ESC to clear)",
}) => {
  // Use the command input hook for state management
  const commandInput = useCommandInput();

  // Track disabled state changes
  useEffect(() => {
    onDisabledChange?.(disabled || commandInput.isSubmitting);
  }, [disabled, commandInput.isSubmitting, onDisabledChange]);

  /**
   * Handle Enter key - submit the command
   */
  const handleEnter = useCallback(() => {
    const command = commandInput.handleSubmit();
    if (command) {
      // Disable input during submission
      commandInput.setSubmitting(true);

      // Call the submission callback
      try {
        const result = onSubmit(command);

        // If it's a promise, wait for it to complete
        if (result instanceof Promise) {
          result
            .finally(() => {
              commandInput.setSubmitting(false);
            })
            .catch((error) => {
              console.error("Command submission error:", error);
            });
        } else {
          commandInput.setSubmitting(false);
        }
      } catch (error) {
        console.error("Command submission error:", error);
        commandInput.setSubmitting(false);
      }
    }
  }, [commandInput, onSubmit]);

  /**
   * Handle arrow key navigation through history
   */
  const handleArrowUp = useCallback(() => {
    commandInput.handleHistoryNavigation("up");
  }, [commandInput]);

  const handleArrowDown = useCallback(() => {
    commandInput.handleHistoryNavigation("down");
  }, [commandInput]);

  /**
   * Handle Escape key - clear input
   */
  const handleEscape = useCallback(() => {
    commandInput.handleEscape();
  }, [commandInput]);

  // Attach keyboard event listeners
  useCommandInputKeyboard(
    commandInput.inputRef as React.RefObject<HTMLInputElement>,
    handleEnter,
    handleArrowUp,
    handleArrowDown,
    handleEscape,
  );

  // Compute disabled state
  const isDisabled = disabled || commandInput.isSubmitting;

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Input Field Container */}
      <div className="flex gap-2 items-start">
        {/* Text Input */}
        <input
          ref={commandInput.inputRef}
          type="text"
          value={commandInput.currentInput}
          onChange={(e) => commandInput.handleInputChange(e.target.value)}
          placeholder={placeholder}
          disabled={isDisabled}
          maxLength={500}
          className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Command input"
          aria-invalid={!!commandInput.validationError}
          aria-describedby={
            commandInput.validationError ? "command-error" : undefined
          }
        />

        {/* Submit Button */}
        <button
          onClick={handleEnter}
          disabled={isDisabled}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-semibold text-white transition-colors min-w-max"
          aria-label="Submit command"
          title={isDisabled ? "Disabled" : "Submit (Enter)"}
        >
          {commandInput.isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Sending...
            </span>
          ) : (
            "Submit"
          )}
        </button>
      </div>

      {/* Error Message Display */}
      {commandInput.validationError && (
        <div
          id="command-error"
          className="text-red-400 text-sm px-1 animate-in fade-in duration-200"
          role="alert"
        >
          {commandInput.validationError}
        </div>
      )}

      {/* Character Count */}
      <div className="flex justify-between items-center px-1">
        <div className="text-gray-400 text-xs">
          History: {commandInput.history.length} command
          {commandInput.history.length !== 1 ? "s" : ""}
        </div>
        <div
          className={`text-xs ${
            commandInput.currentInput.length > 450
              ? "text-red-400"
              : commandInput.currentInput.length > 400
                ? "text-yellow-400"
                : "text-gray-500"
          }`}
        >
          {commandInput.currentInput.length}/500
        </div>
      </div>

      {/* Keyboard Shortcut Help */}
      <div className="text-gray-500 text-xs px-1">
        <span className="font-semibold">Shortcuts:</span> <kbd>↑/↓</kbd>{" "}
        history, <kbd>ESC</kbd> clear, <kbd>Enter</kbd> submit
      </div>
    </div>
  );
};
