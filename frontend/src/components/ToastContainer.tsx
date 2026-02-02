/**
 * Toast Notification Component
 * T119: Toast notifications for successful operations
 *
 * Features:
 * - Auto-dismiss after 4 seconds
 * - Supports multiple toast types (success, error, info)
 * - Customizable duration
 * - Smooth fade-in/out animations
 * - Accessible with aria-live regions
 * - Stack multiple toasts vertically
 *
 * @component
 */

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps extends Toast {
  onDismiss: (id: string) => void;
}

/**
 * Individual toast notification
 */
function ToastItem({
  id,
  message,
  type,
  duration = 4000,
  onDismiss,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  const typeStyles: Record<ToastType, string> = {
    success: "bg-green-50 text-green-800 border-green-200",
    error: "bg-red-50 text-red-800 border-red-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
    warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
  };

  const icons: Record<ToastType, string> = {
    success: "✓",
    error: "✕",
    info: "ℹ",
    warning: "⚠",
  };

  return (
    <div
      className={`max-w-sm mx-auto mb-4 px-4 py-3 border rounded-lg flex items-center gap-3 animate-fade-in ${typeStyles[type]}`}
      role="alert"
      aria-live="polite"
    >
      <span className="text-lg font-bold flex-shrink-0">{icons[type]}</span>
      <p className="flex-1">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 text-lg leading-none opacity-50 hover:opacity-75"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
}

/**
 * Toast container component
 * Manages multiple toast notifications
 *
 * @example
 * ```tsx
 * const [toasts, setToasts] = useState<Toast[]>([]);
 *
 * const showToast = (message: string, type: ToastType = "success") => {
 *   const id = Date.now().toString();
 *   setToasts(prev => [...prev, { id, message, type }]);
 * };
 *
 * return (
 *   <>
 *     <button onClick={() => showToast("Character created!")}>
 *       Create
 *     </button>
 *     <ToastContainer
 *       toasts={toasts}
 *       onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
 *     />
 *   </>
 * );
 * ```
 */
export interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/**
 * Custom hook for managing toasts
 * Simplifies toast management in components
 *
 * @example
 * ```tsx
 * const { toasts, showToast, dismissToast } = useToast();
 *
 * const handleCreate = async () => {
 *   try {
 *     await createCharacter(data);
 *     showToast("Character created successfully!");
 *   } catch (error) {
 *     showToast("Failed to create character", "error");
 *   }
 * };
 * ```
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (
    message: string,
    type: ToastType = "success",
    duration?: number,
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, showToast, dismissToast };
}

export default ToastContainer;
