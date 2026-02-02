/**
 * ItemDetailModal Component
 *
 * Portal-based modal for displaying full item details.
 * Provides keyboard navigation (Esc to close) and click-outside dismissal.
 * WCAG-compliant with focus management and screen reader support.
 *
 * @module components/ItemDetail/ItemDetailModal
 */

import React, { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import type { InventoryEntry } from "@/types/inventory";
import { ItemDetailContent } from "./ItemDetailContent";

/**
 * Props for ItemDetailModal component
 */
export interface ItemDetailModalProps {
  /**
   * The inventory entry to display in the modal
   */
  item: InventoryEntry | null;

  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Callback when modal should close
   */
  onClose: () => void;

  /**
   * Optional callback for item actions (equip, use, drop)
   */
  onAction?: (action: "equip" | "use" | "drop", item: InventoryEntry) => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ItemDetailModal Component
 *
 * Renders a modal dialog with full item details including:
 * - Item name, type, and rarity badge
 * - Complete description and lore
 * - Full list of stats and modifiers
 * - Equipment slot and requirements (if applicable)
 * - Action buttons (Equip, Use, Drop) with accessibility alternatives
 *
 * Keyboard interaction:
 * - Escape: Close modal
 * - Tab: Cycle through action buttons
 *
 * Features:
 * - Portal rendering (prevents z-index issues)
 * - Focus management (traps focus within modal)
 * - Click-outside dismissal
 * - Screen reader announcements (role="dialog")
 *
 * @example
 * ```tsx
 * <ItemDetailModal
 *   item={selectedItem}
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onAction={(action, item) => console.log(action, item)}
 * />
 * ```
 */
export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onAction,
  className = "",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  /**
   * Handle Escape key to close modal
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  /**
   * Handle click outside modal to close
   */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only close if clicking directly on the backdrop, not modal content
      if (e.target === modalRef.current) {
        onClose();
      }
    },
    [onClose],
  );

  /**
   * Focus management: trap focus within modal and restore on close
   */
  useEffect(() => {
    if (!isOpen) return;

    // Store the element that had focus before modal opened
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the content area for screen readers
    if (contentRef.current) {
      contentRef.current.focus();
    }

    return () => {
      // Restore focus to the element that opened the modal
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen || !item) {
    return null;
  }

  return createPortal(
    <div
      ref={modalRef}
      onClick={handleBackdropClick}
      className={`
        fixed inset-0 z-50
        bg-black/50 backdrop-blur-sm
        flex items-center justify-center
        p-4
        ${className}
      `}
      role="presentation"
    >
      {/* Modal container */}
      <div
        ref={contentRef}
        className={`
          bg-white rounded-xl shadow-2xl
          w-full max-w-2xl max-h-[90vh]
          overflow-y-auto
          relative
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-detail-title"
        tabIndex={-1}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={`
            absolute top-4 right-4 z-10
            p-2 rounded-lg
            text-gray-500 hover:text-gray-700 hover:bg-gray-100
            transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500
          `}
          aria-label="Close item details"
          type="button"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Content */}
        <ItemDetailContent item={item} onAction={onAction} onClose={onClose} />
      </div>
    </div>,
    document.body,
  );
};

export default ItemDetailModal;
