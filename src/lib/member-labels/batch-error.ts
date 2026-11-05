import type { components } from '@/server/gateway/types.gen';

type BatchFailure = components['schemas']['MemberLabelBatchFailure'];

export class MemberLabelBatchError extends Error {
  readonly rejectedTargets: BatchFailure['rejectedTargets'];
  readonly batchId?: string;

  constructor(payload: BatchFailure) {
    super(payload.message ?? payload.code);
    this.name = 'MemberLabelBatchError';
    this.rejectedTargets = payload.rejectedTargets;
    this.batchId = payload.batchId;
  }
}
