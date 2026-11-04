/**
 * Pure SQL builder for compose E2E: scoped pending recovery_requests lookup.
 */

/**
 * @param {string} uuid
 */
export function sqlUuidLiteral(uuid) {
  const trimmed = String(uuid ?? '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(trimmed)) {
    throw new Error(`invalid uuid for SQL: ${trimmed.slice(0, 8)}…`);
  }
  return `'${trimmed}'::uuid`;
}

/**
 * @param {string} value
 */
export function sqlStringLiteral(value) {
  const trimmed = String(value ?? '');
  if (!/^[0-9a-f]+$/i.test(trimmed)) {
    throw new Error('invalid phone_hash literal for SQL');
  }
  return `'${trimmed}'`;
}

/**
 * @param {{ familyId?: string; phoneHash?: string }} criteria
 * @returns {string}
 */
export function buildPendingRecoveryRequestSql(criteria) {
  const familyId = criteria.familyId?.trim();
  const phoneHash = criteria.phoneHash?.trim();
  if (!familyId && !phoneHash) {
    throw new Error(
      'buildPendingRecoveryRequestSql: require familyId and/or phoneHash to avoid cross-family races',
    );
  }

  const clauses = ["status = 'pending'"];
  if (familyId) {
    clauses.push(`family_id = ${sqlUuidLiteral(familyId)}`);
  }
  if (phoneHash) {
    clauses.push(`phone_hash = ${sqlStringLiteral(phoneHash)}`);
  }

  return `SELECT id FROM recovery_requests WHERE ${clauses.join(' AND ')} ORDER BY last_requested_at DESC LIMIT 1`;
}
