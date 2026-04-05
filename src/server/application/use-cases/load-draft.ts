import type {
  DraftRecord,
  DraftRepository,
  LoadDraftInput,
} from "@/server/ports/draft-repository";

export interface LoadDraftUseCaseDeps {
  draftRepository: DraftRepository;
}

export function createLoadDraftUseCase({
  draftRepository,
}: LoadDraftUseCaseDeps) {
  return async function loadDraft(
    input: LoadDraftInput,
  ): Promise<DraftRecord | null> {
    return draftRepository.load(input);
  };
}
