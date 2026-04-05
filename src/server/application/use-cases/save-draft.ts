import type {
  DraftRecord,
  DraftRepository,
  SaveDraftInput,
} from "@/server/ports/draft-repository";

export interface SaveDraftUseCaseDeps {
  draftRepository: DraftRepository;
}

export function createSaveDraftUseCase({
  draftRepository,
}: SaveDraftUseCaseDeps) {
  return async function saveDraft(input: SaveDraftInput): Promise<DraftRecord> {
    return draftRepository.save(input);
  };
}
