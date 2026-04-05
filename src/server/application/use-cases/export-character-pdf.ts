import { AuthUnauthenticatedError } from "@/server/application/errors/auth-errors";
import { CharacterNotFoundError } from "@/server/application/errors/character-core-errors";
import type { CharacterAggregate, CharacterRepository } from "@/server/ports/character-repository";
import type { SessionContextPort } from "@/server/ports/session-context";

export type CharacterPdfExportMode = "official" | "summary";

export interface ExportCharacterPdfInput {
  characterId: string;
  mode: CharacterPdfExportMode;
}

export interface ExportCharacterPdfResult {
  filename: string;
  contentType: "application/pdf";
  bytes: Uint8Array;
}

export interface ExportCharacterPdfUseCaseDeps {
  sessionContext: SessionContextPort;
  characterRepository: CharacterRepository;
}

export type ExportCharacterPdfUseCase = (input: ExportCharacterPdfInput) => Promise<ExportCharacterPdfResult>;

function buildExportText(mode: CharacterPdfExportMode, character: CharacterAggregate): string {
  const title = mode === "official" ? "Character Sheet (Official-like)" : "Character Summary";
  const inventory = (character.inventory ?? []).map((entry) => `${entry.label} x${entry.quantity}`).join("\n") || "None";
  const spells = (character.spells ?? []).map((entry) => `${entry.label} (${entry.status})`).join("\n") || "None";

  return [
    title,
    `Name: ${character.name}`,
    `Class: ${character.buildState.classRef.name} (${character.buildState.classRef.source})`,
    `Level: ${character.buildState.level}`,
    `Concept: ${character.buildState.concept}`,
    "",
    "Inventory:",
    inventory,
    "",
    "Spells:",
    spells,
  ].join("\n");
}

export function createExportCharacterPdfUseCase({
  sessionContext,
  characterRepository,
}: ExportCharacterPdfUseCaseDeps): ExportCharacterPdfUseCase {
  return async function exportCharacterPdf(input) {
    const session = await sessionContext.getSessionContext();

    if (!session.userId) {
      throw new AuthUnauthenticatedError();
    }

    const character = await characterRepository.getByIdForOwner(input.characterId, session.userId);

    if (!character) {
      throw new CharacterNotFoundError();
    }

    const encoded = new TextEncoder().encode(buildExportText(input.mode, character));

    return {
      filename: `${character.name.replace(/\s+/g, "-").toLowerCase()}-${input.mode}.pdf`,
      contentType: "application/pdf",
      bytes: encoded,
    };
  };
}
