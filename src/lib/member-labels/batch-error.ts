import type { components } from '@/server/gateway/types.gen';

type BatchFailure = components['schemas']['MemberLabelBatchFailure'];

export class MemberLabelBatchError extends Error {
  readonly failures: BatchFailure['failures'];

  constructor(payload: BatchFailure) {
    super(payload.message ?? payload.code);
    this.name = 'MemberLabelBatchError';
    this.failures = payload.failures;
  }
}
