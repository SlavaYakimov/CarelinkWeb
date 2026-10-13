#!/usr/bin/env node
/**
 * Merges family-join delta from CarelinkMemory into vendored contracts (when contracts:sync unavailable).
 * Idempotent: skips if /auth/join/redeem already present.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dumpYaml, parseYaml } from './contracts-openapi-utils.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const authPath = join(root, 'contracts', 'auth.openapi.yaml');
const familyPath = join(root, 'contracts', 'family.openapi.yaml');

const auth = parseYaml(readFileSync(authPath, 'utf8'));
const family = parseYaml(readFileSync(familyPath, 'utf8'));

if (auth.paths?.['/auth/join/redeem']) {
  console.log('apply-family-join-contracts: auth already has join paths');
  process.exit(0);
}

auth.tags ??= [];
if (!auth.tags.some((t) => t.name === 'family-join')) {
  auth.tags.push({ name: 'family-join', description: 'QR and email family join (family-join)' });
}

Object.assign(auth.paths, {
  '/auth/join/email/request-code': {
    post: {
      tags: ['family-join'],
      operationId: 'joinEmailRequestCode',
      summary: 'Send 6-digit join email code (R5/R6)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/JoinEmailRequestCodeRequest' },
          },
        },
      },
      responses: {
        202: { description: 'Code sent (anti-enumeration)' },
        429: { $ref: '#/components/responses/RateLimit' },
      },
    },
  },
  '/auth/join/email/verify-code': {
    post: {
      tags: ['family-join'],
      operationId: 'joinEmailVerifyCode',
      summary: 'Verify 6-digit join email code',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/JoinEmailVerifyCodeRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Verification ticket for redeem',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/JoinEmailVerifyCodeResponse' },
            },
          },
        },
        400: { $ref: '#/components/responses/Error' },
        429: { $ref: '#/components/responses/RateLimit' },
      },
    },
  },
  '/auth/join/qr/resolve': {
    post: {
      tags: ['family-join'],
      operationId: 'joinQrResolve',
      summary: 'Preview family for QR join token (screen 48)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/JoinQrResolveRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Join preview',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/JoinQrResolveResponse' },
            },
          },
        },
        404: { $ref: '#/components/responses/Error' },
        410: { $ref: '#/components/responses/Error' },
      },
    },
  },
  '/auth/join/redeem': {
    post: {
      tags: ['family-join'],
      operationId: 'joinRedeem',
      summary: 'Unified join redeem (kind=qr|email)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/JoinRedeemRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Redeem outcome',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/JoinRedeemResponse' },
            },
          },
        },
        400: { $ref: '#/components/responses/Error' },
        401: { $ref: '#/components/responses/Error' },
        409: {
          description: 'Already in another family (R3)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        404: { $ref: '#/components/responses/Error' },
        429: { $ref: '#/components/responses/RateLimit' },
      },
    },
  },
});

const authSchemas = auth.components?.schemas ?? {};
Object.assign(authSchemas, {
  JoinEmailRequestCodeRequest: {
    type: 'object',
    required: ['email'],
    properties: { email: { type: 'string', format: 'email' } },
  },
  JoinEmailVerifyCodeRequest: {
    type: 'object',
    required: ['email', 'code'],
    properties: {
      email: { type: 'string', format: 'email' },
      code: { type: 'string', pattern: '^[0-9]{6}$' },
    },
  },
  JoinEmailVerifyCodeResponse: {
    type: 'object',
    required: ['emailVerificationTicket', 'registered'],
    properties: {
      emailVerificationTicket: { type: 'string' },
      registered: { type: 'boolean' },
    },
  },
  JoinQrResolveRequest: {
    type: 'object',
    required: ['joinToken'],
    properties: { joinToken: { type: 'string' } },
  },
  JoinQrResolveResponse: {
    type: 'object',
    required: ['familyName', 'keeperDisplayName', 'roleLabel', 'expiresAt'],
    properties: {
      familyName: { type: 'string' },
      keeperDisplayName: { type: 'string' },
      roleLabel: { type: 'string' },
      expiresAt: { type: 'string', format: 'date-time' },
      joinToken: { type: 'string' },
    },
  },
  JoinRedeemRequest: {
    type: 'object',
    required: ['kind'],
    properties: {
      kind: { type: 'string', enum: ['qr', 'email'] },
      joinToken: { type: 'string' },
      emailVerificationTicket: { type: 'string' },
      registration: { $ref: '#/components/schemas/JoinRegistrationPatch' },
    },
  },
  JoinRegistrationPatch: {
    type: 'object',
    properties: {
      displayName: { type: 'string', minLength: 1, maxLength: 128 },
      phone: { type: 'string', description: 'E.164' },
    },
  },
  JoinRedeemResponse: {
    oneOf: [
      { $ref: '#/components/schemas/JoinRedeemPending' },
      { $ref: '#/components/schemas/JoinRedeemSession' },
      { $ref: '#/components/schemas/JoinRedeemChoosePath' },
    ],
  },
  JoinRedeemPending: {
    type: 'object',
    required: ['outcome', 'requestId', 'approvalSecret', 'keeperDisplayName', 'message'],
    properties: {
      outcome: { type: 'string', enum: ['pending_approval'] },
      requestId: { type: 'string', format: 'uuid' },
      approvalSecret: { type: 'string' },
      keeperDisplayName: { type: 'string' },
      message: { type: 'string' },
    },
  },
  JoinRedeemSession: {
    type: 'object',
    required: ['outcome', 'session'],
    properties: {
      outcome: { type: 'string', enum: ['session'] },
      session: { $ref: '#/components/schemas/AuthSessionResponse' },
    },
  },
  JoinRedeemChoosePath: {
    type: 'object',
    required: ['outcome', 'userRefresh'],
    properties: {
      outcome: { type: 'string', enum: ['choose_path'] },
      userRefresh: { type: 'string' },
    },
  },
});
auth.components ??= {};
auth.components.schemas = authSchemas;

const errEnum = auth.components.schemas.ErrorResponse?.properties?.code?.enum;
const joinErrorCodes = [
  'JOIN_LINK_EXPIRED',
  'ALREADY_IN_FAMILY',
  'INVALID_JOIN_TOKEN',
  'EMAIL_CODE_EXPIRED',
  'EMAIL_CODE_INVALID',
];
if (Array.isArray(errEnum)) {
  for (const code of joinErrorCodes) {
    if (!errEnum.includes(code)) errEnum.push(code);
  }
}
const familyErrEnum = family.components?.schemas?.ErrorResponse?.properties?.code?.enum;
if (Array.isArray(familyErrEnum)) {
  for (const code of joinErrorCodes) {
    if (!familyErrEnum.includes(code)) familyErrEnum.push(code);
  }
}

if (auth.components.schemas.CreateFamilyRequest?.properties) {
  auth.components.schemas.CreateFamilyRequest.properties.slug = {
    type: 'string',
    minLength: 3,
    maxLength: 32,
    description: 'Public family slug (R7)',
  };
}

family.tags ??= [];
if (!family.tags.some((t) => t.name === 'family-join')) {
  family.tags.push({ name: 'family-join', description: 'QR join links and requests' });
}

Object.assign(family.paths, {
  '/families/check-slug': {
    get: {
      tags: ['family-join'],
      operationId: 'checkFamilySlug',
      summary: 'Live family slug availability (R7)',
      parameters: [
        {
          name: 'slug',
          in: 'query',
          required: true,
          schema: { type: 'string', minLength: 3, maxLength: 32 },
        },
      ],
      responses: {
        200: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CheckFamilySlugResponse' },
            },
          },
        },
      },
    },
  },
  '/families/{familyId}/join-links': {
    post: {
      tags: ['family-join'],
      operationId: 'createOrRefreshFamilyJoinLink',
      summary: 'Create or refresh family join QR/link (keeper)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'familyId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        201: {
          description: 'Join link issued',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/FamilyJoinLinkResponse' },
            },
          },
        },
        403: { $ref: '#/components/responses/Error' },
        404: { $ref: '#/components/responses/Error' },
      },
    },
  },
  '/families/{familyId}/join-requests': {
    get: {
      tags: ['family-join'],
      operationId: 'listFamilyJoinRequests',
      summary: 'Pending join requests (keeper)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'familyId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
        {
          name: 'status',
          in: 'query',
          schema: { type: 'string', enum: ['pending'], default: 'pending' },
        },
      ],
      responses: {
        200: {
          description: 'Pending join requests',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/JoinRequestListResponse' },
            },
          },
        },
        403: { $ref: '#/components/responses/Error' },
        404: { $ref: '#/components/responses/Error' },
      },
    },
  },
});

Object.assign(family.components?.schemas ?? {}, {
  FamilyJoinLinkResponse: {
    type: 'object',
    required: ['joinToken', 'expiresAt', 'shareUrl', 'shortCode'],
    properties: {
      joinToken: { type: 'string' },
      expiresAt: { type: 'string', format: 'date-time' },
      shareUrl: { type: 'string', format: 'uri' },
      shortCode: { type: 'string', description: 'Human-readable code for keeper UI' },
    },
  },
  JoinRequestListResponse: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/JoinRequestView' },
      },
    },
  },
  JoinRequestView: {
    type: 'object',
    required: ['requestId', 'displayName', 'scannedAt', 'status', 'kind'],
    properties: {
      requestId: { type: 'string', format: 'uuid' },
      displayName: { type: 'string' },
      scannedAt: { type: 'string', format: 'date-time' },
      status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
      kind: { type: 'string', enum: ['qr', 'email'] },
    },
  },
  CheckFamilySlugResponse: {
    type: 'object',
    required: ['available', 'slug'],
    properties: {
      available: { type: 'boolean' },
      slug: { type: 'string' },
    },
  },
});
family.components ??= {};
family.components.schemas = family.components.schemas ?? {};

writeFileSync(authPath, dumpYaml(auth), 'utf8');
writeFileSync(familyPath, dumpYaml(family), 'utf8');
console.log('apply-family-join-contracts: updated auth + family OpenAPI');
