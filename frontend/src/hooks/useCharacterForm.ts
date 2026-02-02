/**
 * useCharacterForm Hook
 * Manages form state, validation, and submission for character creation/editing
 *
 * Handles:
 * - Form data state (name, attributes)
 * - Field-level validation errors
 * - Dirty flag tracking
 * - Pre-population from existing character
 *
 * Does NOT handle API calls (that's done by parent component via onSubmit callback)
 */

import { useState, useCallback } from "react";
import { Character, CharacterFormData, Attributes } from "@/types/character";
import { ATTRIBUTE_CONSTRAINTS } from "@/types/character";

/**
 * Validation rules for form fields
 */
interface ValidationRules {
  minNameLength: number;
  maxNameLength: number;
  minAttribute: number;
  maxAttribute: number;
}

const DEFAULT_VALIDATION_RULES: ValidationRules = {
  minNameLength: 1,
  maxNameLength: 50,
  minAttribute: ATTRIBUTE_CONSTRAINTS.MIN,
  maxAttribute: ATTRIBUTE_CONSTRAINTS.MAX,
};

/**
 * Return type for useCharacterForm hook
 */
export interface UseCharacterFormReturn {
  // Form data
  formData: CharacterFormData;
  isDirty: boolean;
  isValid: boolean;

  // Errors (field -> error message)
  errors: Record<string, string>;

  // Update methods
  updateAttribute: (attr: keyof Attributes, value: number) => void;
  updateName: (name: string) => void;
  setFormData: (data: CharacterFormData) => void;

  // Validation
  validate: () => boolean;
  clearErrors: () => void;
  resetForm: (newData?: CharacterFormData) => void;
}

/**
 * Hook for managing character form state
 *
 * Supports both create (with adventureId) and edit (with existing character) modes.
 * Provides validation, dirty flag tracking, and error management.
 * Does NOT handle API submission - use onSubmit callback in component for that.
 *
 * @param character - Existing character to edit (optional, for edit mode)
 * @param adventureId - Adventure ID for creation mode (optional)
 * @param validationRules - Custom validation rules (optional)
 *
 * @returns Form state and update methods
 *
 * @example
 * ```typescript
 * // Create mode
 * const form = useCharacterForm(undefined, "adventure-123");
 *
 * // Edit mode
 * const form = useCharacterForm(existingCharacter);
 *
 * // With custom validation
 * const form = useCharacterForm(character, null, {
 *   maxNameLength: 30
 * });
 * ```
 */
export function useCharacterForm(
  character?: Character,
  adventureId?: string,
  validationRules?: Partial<ValidationRules>,
): UseCharacterFormReturn {
  const rules = { ...DEFAULT_VALIDATION_RULES, ...validationRules };

  // Initialize form data
  const initialFormData: CharacterFormData = {
    name: character?.name || "",
    adventureId: adventureId || character?.adventureId || "",
    attributes: character?.attributes || {
      str: 10,
      dex: 10,
      int: 10,
      con: 10,
      cha: 10,
    },
  };

  // ============ State ============
  const [formData, setFormDataState] =
    useState<CharacterFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  // ============ Derived State ============
  const isValid =
    Object.keys(errors).length === 0 &&
    formData.name.trim().length > 0 &&
    Object.values(formData.attributes).every(
      (val) => val >= rules.minAttribute && val <= rules.maxAttribute,
    );

  // ============ Methods ============

  /**
   * Validate all fields and set error messages
   * @returns true if all validations pass, false if any fail
   */
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate name
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      newErrors.name = "Character name is required";
    } else if (trimmedName.length > rules.maxNameLength) {
      newErrors.name = `Character name must be ${rules.maxNameLength} characters or less`;
    }

    // Validate each attribute
    const attrNames = {
      str: "Strength",
      dex: "Dexterity",
      int: "Intelligence",
      con: "Constitution",
      cha: "Charisma",
    } as const;

    for (const [key, value] of Object.entries(formData.attributes)) {
      if (value < rules.minAttribute || value > rules.maxAttribute) {
        const attrName =
          attrNames[key as keyof typeof attrNames] || key.toUpperCase();
        newErrors[key] =
          `${attrName} must be ${rules.minAttribute}-${rules.maxAttribute}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, rules.maxNameLength, rules.minAttribute, rules.maxAttribute]);

  /**
   * Update a single attribute value
   * Clamps to min-max range automatically
   */
  const updateAttribute = useCallback(
    (attr: keyof Attributes, value: number) => {
      const clampedValue = Math.max(
        rules.minAttribute,
        Math.min(rules.maxAttribute, value),
      );

      setFormDataState((prev) => ({
        ...prev,
        attributes: {
          ...prev.attributes,
          [attr]: clampedValue,
        },
      }));

      setIsDirty(true);

      // Clear error for this field when user starts correcting it
      if (errors[attr]) {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated[attr];
          return updated;
        });
      }
    },
    [rules.minAttribute, rules.maxAttribute, errors],
  );

  /**
   * Update character name
   */
  const updateName = useCallback(
    (name: string) => {
      setFormDataState((prev) => ({
        ...prev,
        name,
      }));

      setIsDirty(true);

      // Clear name error if user is fixing it
      if (errors.name && name.trim()) {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated.name;
          return updated;
        });
      }
    },
    [errors.name],
  );

  /**
   * Directly set entire form data object
   * (for full form replacement, like loading from server)
   */
  const setFormData = useCallback((data: CharacterFormData) => {
    setFormDataState(data);
    setIsDirty(false);
  }, []);

  /**
   * Clear all validation errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Reset form to initial state or provided data
   */
  const resetForm = useCallback(
    (newData?: CharacterFormData) => {
      const dataToSet = newData || initialFormData;
      setFormDataState(dataToSet);
      setErrors({});
      setIsDirty(false);
    },
    [initialFormData],
  );

  // ============ Return ============
  return {
    formData,
    isDirty,
    isValid,
    errors,
    updateAttribute,
    updateName,
    setFormData,
    validate,
    clearErrors,
    resetForm,
  };
}
