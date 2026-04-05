import type { CharacterDraftPayload } from "@/server/ports/character-repository";

import type { CharacterValidationResult } from "@/server/domain/character-core/character-core.types";

export const CHARACTER_WARNING_CONCEPT_SHORT = "CHARACTER_CORE_WARNING_CONCEPT_SHORT";
export const CHARACTER_WARNING_CUSTOM_INVENTORY = "CHARACTER_CORE_WARNING_CUSTOM_INVENTORY";
export const CHARACTER_WARNING_CUSTOM_SPELL = "CHARACTER_CORE_WARNING_CUSTOM_SPELL";

export function validateCharacterDraftPayload(draft: CharacterDraftPayload): CharacterValidationResult {
  const hardIssues: CharacterValidationResult["hardIssues"] = [];
  const warnings: CharacterValidationResult["warnings"] = [];

  if (draft.name.trim().length === 0) {
    hardIssues.push({
      code: "CHARACTER_CORE_REQUIRED_NAME",
      path: "name",
      message: "Character name is required.",
    });
  }

  if (draft.classRef.name.trim().length === 0) {
    hardIssues.push({
      code: "CHARACTER_CORE_REQUIRED_CLASS_NAME",
      path: "classRef.name",
      message: "Class name is required.",
    });
  }

  if (draft.classRef.source.trim().length === 0) {
    hardIssues.push({
      code: "CHARACTER_CORE_REQUIRED_CLASS_SOURCE",
      path: "classRef.source",
      message: "Class source is required.",
    });
  }

  if (draft.level !== 1) {
    hardIssues.push({
      code: "CHARACTER_CORE_LEVEL_ONE_REQUIRED",
      path: "level",
      message: "Initial character creation supports level 1 only.",
    });
  }

  if (draft.concept.trim().length < 10) {
    warnings.push({
      code: CHARACTER_WARNING_CONCEPT_SHORT,
      path: "concept",
      message: "Concept is short and may be hard to recognize later.",
    });
  }

  if (draft.inventory) {
    for (let index = 0; index < draft.inventory.length; index += 1) {
      const entry = draft.inventory[index];
      const path = `inventory.${index}`;

      if (!entry || entry.label.trim().length === 0) {
        hardIssues.push({
          code: "CHARACTER_CORE_INVENTORY_LABEL_REQUIRED",
          path: `${path}.label`,
          message: "Inventory item label is required.",
        });
      }

      if (!Number.isInteger(entry.quantity) || entry.quantity < 1) {
        hardIssues.push({
          code: "CHARACTER_CORE_INVENTORY_QUANTITY_INVALID",
          path: `${path}.quantity`,
          message: "Inventory item quantity must be at least 1.",
        });
      }

      if (!entry.catalogRef) {
        warnings.push({
          code: CHARACTER_WARNING_CUSTOM_INVENTORY,
          path,
          message: "Custom inventory entries are allowed, but not catalog-backed.",
        });
      }
    }
  }

  if (draft.spells) {
    for (let index = 0; index < draft.spells.length; index += 1) {
      const entry = draft.spells[index];
      const path = `spells.${index}`;

      if (!entry || entry.label.trim().length === 0) {
        hardIssues.push({
          code: "CHARACTER_CORE_SPELL_LABEL_REQUIRED",
          path: `${path}.label`,
          message: "Spell label is required.",
        });
      }

      if (!entry.catalogRef) {
        warnings.push({
          code: CHARACTER_WARNING_CUSTOM_SPELL,
          path,
          message: "Custom spell entries are allowed, but not catalog-backed.",
        });
      }
    }
  }

  return {
    hardIssues,
    warnings,
  };
}
