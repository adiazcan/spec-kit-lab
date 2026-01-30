import { useState, useRef, useId, type FormEvent } from "react";
import FocusLock from "react-focus-lock";
import { useCreateAdventure } from "../hooks/useAdventures";
import { parseError } from "../utils/errorMessages";

interface CreateAdventureFormProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * CreateAdventureForm - Modal form for creating new adventures
 * Includes validation, error handling, and accessibility features
 */
export default function CreateAdventureForm({
  isOpen,
  onClose,
}: CreateAdventureFormProps) {
  const nameId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");

  const createMutation = useCreateAdventure();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();

    // Validation
    if (!trimmedName) {
      setError("Adventure name is required");
      nameInputRef.current?.focus();
      return;
    }

    if (trimmedName.length > 100) {
      setError("Name must be 100 characters or less");
      nameInputRef.current?.focus();
      return;
    }

    try {
      // Note: Backend doesn't support adventure names yet
      // Creating with empty initial state
      await createMutation.mutateAsync({});
      // Success - close form and reset
      setName("");
      setError(null);
      onClose();
    } catch (err) {
      const errorMessage = await parseError(err);
      setError(errorMessage);
    }
  };

  const handleClose = () => {
    setName("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <FocusLock>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${nameId}-title`}
          className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <h2
            id={`${nameId}-title`}
            className="text-2xl font-bold text-gray-900 mb-4"
          >
            Create New Adventure
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor={nameId}
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Adventure Name
              </label>
              <input
                id={nameId}
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                autoFocus
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${nameId}-error` : undefined}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter adventure name..."
              />
              {error && (
                <p
                  id={`${nameId}-error`}
                  className="text-red-600 text-sm mt-1"
                  role="alert"
                >
                  {error}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {name.length}/100 characters
              </p>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={handleClose}
                disabled={createMutation.isPending}
                className="btn-secondary min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || !name.trim()}
                className="btn-primary min-h-[44px]"
              >
                {createMutation.isPending ? "Creating..." : "Create Adventure"}
              </button>
            </div>
          </form>
        </div>
      </FocusLock>
    </div>
  );
}
