import { useEffect, useState } from "react";

/**
 * KeyboardShortcutsModal - Display available keyboard shortcuts
 * T083: Keyboard shortcut help modal triggered by ? key
 *
 * Features:
 * - Modal displays on ? key press
 * - Lists all available keyboard shortcuts
 * - Organized by category (Navigation, Commands, Combat)
 * - Accessible with keyboard and screen readers
 * - Click outside or press Escape to close
 * - Responsive design for all screen sizes
 *
 * @component
 * @example
 * ```tsx
 * const [showShortcuts, setShowShortcuts] = useState(false);
 *
 * return (
 *   <>
 *     <KeyboardShortcutsModal
 *       isOpen={showShortcuts}
 *       onClose={() => setShowShortcuts(false)}
 *     />
 *   </>
 * );
 * ```
 */

interface Shortcut {
  key: string;
  description: string;
  category: "navigation" | "input" | "combat" | "general";
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS: Shortcut[] = [
  // Navigation
  {
    key: "?",
    description: "Show this keyboard shortcuts help",
    category: "general",
  },
  {
    key: "Esc",
    description: "Close modals and dismiss overlays",
    category: "general",
  },

  // Input handling
  { key: "Enter", description: "Submit command or action", category: "input" },
  {
    key: "↑ / ↓",
    description: "Navigate through command history",
    category: "input",
  },
  { key: "Escape", description: "Clear current input", category: "input" },

  // Combat shortcuts
  {
    key: "Alt + A",
    description: "Perform Attack action (combat only)",
    category: "combat",
  },
  {
    key: "Alt + F",
    description: "Attempt to Flee (combat only)",
    category: "combat",
  },
  {
    key: "Alt + I",
    description: "Use Item from inventory",
    category: "combat",
  },

  // General navigation
  {
    key: "Tab",
    description: "Navigate between interactive elements",
    category: "navigation",
  },
  {
    key: "Shift + Tab",
    description: "Navigate backwards between elements",
    category: "navigation",
  },
];

/**
 * Group shortcuts by category for organized display
 */
function groupShortcutsByCategory(
  shortcuts: Shortcut[],
): Record<string, Shortcut[]> {
  return shortcuts.reduce(
    (acc, shortcut) => {
      const category = shortcut.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(shortcut);
      return acc;
    },
    {} as Record<string, Shortcut[]>,
  );
}

/**
 * Get category display name and color
 */
function getCategoryLabel(category: string): { label: string; color: string } {
  const categoryMap: Record<string, { label: string; color: string }> = {
    general: { label: "General", color: "text-gray-700" },
    navigation: { label: "Navigation", color: "text-blue-700" },
    input: { label: "Input & Commands", color: "text-green-700" },
    combat: { label: "Combat Actions", color: "text-red-700" },
  };
  return categoryMap[category] || { label: category, color: "text-gray-700" };
}

/**
 * KeyboardShortcutsModal Component
 */
export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    /**
     * Handle keyboard events to close modal
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const groupedShortcuts = groupShortcutsByCategory(SHORTCUTS);
  const categories = Object.keys(groupedShortcuts).sort();

  return (
    <>
      {/* Modal backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl z-50 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[80vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
          <h2 id="shortcuts-title" className="text-2xl font-bold">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 text-2xl leading-none p-0 w-8 h-8 flex items-center justify-center rounded hover:bg-blue-500 transition-colors"
            aria-label="Close shortcuts help"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-6">
          <div className="space-y-6">
            {categories.map((category) => {
              const categoryLabel = getCategoryLabel(category);
              const categoryShortcuts = groupedShortcuts[category];

              return (
                <div key={category}>
                  <h3
                    className={`text-lg font-semibold mb-3 ${categoryLabel.color}`}
                  >
                    {categoryLabel.label}
                  </h3>
                  <div className="space-y-2 ml-2 border-l-4 border-gray-200 pl-4">
                    {categoryShortcuts.map((shortcut, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <kbd className="flex-shrink-0 px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono text-gray-900 whitespace-nowrap">
                          {shortcut.key}
                        </kbd>
                        <span className="text-gray-700 text-sm flex-1 pt-1">
                          {shortcut.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Help text */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
            <p>
              <strong>Tip:</strong> Press{" "}
              <kbd className="px-1 bg-white border border-blue-300 rounded font-mono text-xs">
                ?
              </kbd>{" "}
              anytime to open this help dialog.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Got it
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * Custom hook to manage keyboard shortcuts modal state
 * Handles opening modal with ? key
 *
 * @example
 * ```tsx
 * const { showShortcuts, toggleShortcuts, isMounted } = useKeyboardShortcuts();
 *
 * useEffect(() => {
 *   if (!isMounted) return;
 *   const handleKeyDown = (e: KeyboardEvent) => {
 *     if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
 *       e.preventDefault();
 *       toggleShortcuts();
 *     }
 *   };
 *   window.addEventListener('keydown', handleKeyDown);
 *   return () => window.removeEventListener('keydown', handleKeyDown);
 * }, [toggleShortcuts, isMounted]);
 * ```
 */
export function useKeyboardShortcuts() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Handle global keyboard event for opening shortcuts modal
   */
  useEffect(() => {
    if (!isMounted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for ? key (Shift + /) on US keyboard
      if (
        (e.key === "?" || e.key === "/") &&
        e.shiftKey &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMounted]);

  const toggleShortcuts = () => {
    setShowShortcuts((prev) => !prev);
  };

  return {
    showShortcuts,
    toggleShortcuts,
    setShowShortcuts,
    isMounted,
  };
}

export default KeyboardShortcutsModal;
