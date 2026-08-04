import type {
  ErpSubmission,
  ErpSubmissionPayload,
  ErpSubmissionPersonBlock,
} from "./types";

export interface ErpSubmissionRecordRef {
  submissionId: string;
  empno: string;
  name: string;
  slotIndex: number;
  date: string;
}

export function countPayloadRecords(personBlocks: ErpSubmissionPersonBlock[]): number {
  let count = 0;
  for (const block of personBlocks) {
    for (const slot of block.slots) {
      count += Object.keys(slot).length;
    }
  }
  return count;
}

function cleanupPersonBlocks(
  personBlocks: ErpSubmissionPersonBlock[],
): ErpSubmissionPersonBlock[] {
  return personBlocks
    .map((block) => ({
      ...block,
      slots: block.slots.filter((slot) => Object.keys(slot).length > 0),
    }))
    .filter((block) => block.slots.length > 0);
}

export function removeRecordsFromPayload(
  payload: ErpSubmissionPayload,
  refs: ErpSubmissionRecordRef[],
): ErpSubmissionPayload | null {
  const personBlocks = structuredClone(payload.personBlocks);

  for (const ref of refs) {
    const block = personBlocks.find(
      (item) => item.empno === ref.empno && item.name === ref.name,
    );
    if (!block || ref.slotIndex < 0 || ref.slotIndex >= block.slots.length) {
      continue;
    }
    delete block.slots[ref.slotIndex][ref.date];
  }

  const cleanedBlocks = cleanupPersonBlocks(personBlocks);
  if (cleanedBlocks.length === 0) {
    return null;
  }

  return {
    ...payload,
    personBlocks: cleanedBlocks,
  };
}

export function applyRecordDeletionsToSubmission(
  submission: ErpSubmission,
  refs: ErpSubmissionRecordRef[],
): ErpSubmissionPayload | null {
  const refsForSubmission = refs.filter(
    (ref) => ref.submissionId === submission.id,
  );
  if (refsForSubmission.length === 0) {
    return submission.payload;
  }
  return removeRecordsFromPayload(submission.payload, refsForSubmission);
}

export function buildUpdatedSubmissionAfterDelete(
  submission: ErpSubmission,
  refs: ErpSubmissionRecordRef[],
): Pick<ErpSubmission, "recordCount" | "personCount" | "payload"> | null {
  const payload = applyRecordDeletionsToSubmission(submission, refs);
  if (!payload) {
    return null;
  }

  return {
    payload,
    personCount: payload.personBlocks.length,
    recordCount: countPayloadRecords(payload.personBlocks),
  };
}

export function applyDeletionsToSubmissions(
  submissions: ErpSubmission[],
  refs: ErpSubmissionRecordRef[],
): ErpSubmission[] {
  if (refs.length === 0) {
    return submissions;
  }

  const affectedIds = new Set(refs.map((ref) => ref.submissionId));
  return submissions.flatMap((submission) => {
    if (!affectedIds.has(submission.id)) {
      return [submission];
    }
    const updated = buildUpdatedSubmissionAfterDelete(submission, refs);
    if (!updated) {
      return [];
    }
    return [{ ...submission, ...updated }];
  });
}
