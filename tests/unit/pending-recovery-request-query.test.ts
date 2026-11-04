import { describe, expect, it } from 'vitest';
import {
  buildPendingRecoveryRequestSql,
  sqlStringLiteral,
  sqlUuidLiteral,
} from '../../scripts/e2e/pending-recovery-request-query.mjs';
import { hashRecoveryPhoneE164 } from '../../scripts/e2e/recovery-request-phone-hash.mjs';
import { normalizeRecoveryFamilySlug } from '../../scripts/e2e/resolve-recovery-family-id.mjs';

const FAMILY_ID = '11111111-1111-4111-8111-111111111111';
const PHONE_HASH = hashRecoveryPhoneE164('+79001234567', 'test-pepper');

describe('pending-recovery-request-query', () => {
  it('requires familyId and/or phoneHash', () => {
    expect(() => buildPendingRecoveryRequestSql({})).toThrow(/familyId and\/or phoneHash/);
  });

  it('scopes by family_id and phone_hash', () => {
    const sql = buildPendingRecoveryRequestSql({ familyId: FAMILY_ID, phoneHash: PHONE_HASH });
    expect(sql).toContain(`family_id = ${sqlUuidLiteral(FAMILY_ID)}`);
    expect(sql).toContain(`phone_hash = ${sqlStringLiteral(PHONE_HASH)}`);
    expect(sql).toContain("status = 'pending'");
    expect(sql).toContain('ORDER BY last_requested_at DESC LIMIT 1');
  });

  it('allows family-only scope for parallel compose families', () => {
    const sql = buildPendingRecoveryRequestSql({ familyId: FAMILY_ID });
    expect(sql).not.toContain('phone_hash');
    expect(sql).toContain(`family_id = ${sqlUuidLiteral(FAMILY_ID)}`);
  });

  it('allows phone-only scope when family id is unknown', () => {
    const sql = buildPendingRecoveryRequestSql({ phoneHash: PHONE_HASH });
    expect(sql).toContain(`phone_hash = ${sqlStringLiteral(PHONE_HASH)}`);
    expect(sql).not.toContain('family_id');
  });

  it('rejects invalid uuid and phone_hash literals', () => {
    expect(() => sqlUuidLiteral('not-a-uuid')).toThrow(/invalid uuid/);
    expect(() => sqlStringLiteral('bad;drop')).toThrow(/invalid phone_hash/);
  });
});

describe('normalizeRecoveryFamilySlug', () => {
  it('lowercases slug and strips workspace email domain', () => {
    expect(normalizeRecoveryFamilySlug('Yakimovs@workspaces.carelink.app')).toBe('yakimovs');
    expect(normalizeRecoveryFamilySlug('  e2eFamily  ')).toBe('e2efamily');
  });
});

describe('hashRecoveryPhoneE164', () => {
  it('is stable for the same E.164 and pepper', () => {
    const a = hashRecoveryPhoneE164('+79001234567', 'pepper-a');
    const b = hashRecoveryPhoneE164('+79001234567', 'pepper-a');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});
