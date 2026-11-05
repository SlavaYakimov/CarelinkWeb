import type { components } from '@/server/gateway/types.gen';

type BadRequestBody = components['schemas']['MemberLabelBadRequestBody'];

export class MemberLabelBatchError extends Error {
  readonly rejectedTargets: BadRequestBody['rejectedTargets'];

  constructor(payload: BadRequestBody) {
    super(payload.message ?? payload.code);
    this.name = 'MemberLabelBatchError';
    this.rejectedTargets = payload.rejectedTargets;
  }
}
