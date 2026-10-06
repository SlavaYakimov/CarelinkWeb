import { describe, it, expect } from 'vitest';
import { GatewayError } from '@/server/gateway/errors';
import {
  delegateUnavailableCopy,
  delegateUnavailablePath,
  mapDelegateGatewayError,
  parseDelegateUnavailableReason,
} from '@/lib/delegate-errors';

describe('mapDelegateGatewayError (#165)', () => {
  it('maps 410 DELEGATE_EXPIRED to expired screen', () => {
    expect(
      mapDelegateGatewayError(new GatewayError({ code: 'DELEGATE_EXPIRED', status: 410 })),
    ).toBe('expired');
    expect(mapDelegateGatewayError(new GatewayError({ code: 'UNKNOWN', status: 410 }))).toBe(
      'expired',
    );
  });

  it('maps 409 CONFLICT to handled screen', () => {
    expect(mapDelegateGatewayError(new GatewayError({ code: 'CONFLICT', status: 409 }))).toBe(
      'handled',
    );
    expect(mapDelegateGatewayError(new GatewayError({ code: 'ALREADY_EXISTS', status: 409 }))).toBe(
      'handled',
    );
  });

  it('maps 404 NOT_FOUND to closed screen', () => {
    expect(mapDelegateGatewayError(new GatewayError({ code: 'NOT_FOUND', status: 404 }))).toBe(
      'closed',
    );
  });

  it('maps 400 BAD_REQUEST to bad-request screen', () => {
    expect(mapDelegateGatewayError(new GatewayError({ code: 'BAD_REQUEST', status: 400 }))).toBe(
      'bad-request',
    );
  });

  it('does not treat INVALID_OTP as delegate token expiry', () => {
    expect(mapDelegateGatewayError(new GatewayError({ code: 'INVALID_OTP', status: 400 }))).toBe(
      null,
    );
  });

  it('maps keeper auth errors', () => {
    expect(
      mapDelegateGatewayError(new GatewayError({ code: 'DELEGATE_NOT_ALLOWED', status: 403 })),
    ).toBe('forbidden');
    expect(mapDelegateGatewayError(new GatewayError({ code: 'UNAUTHORIZED', status: 401 }))).toBe(
      'login',
    );
  });
});

describe('delegate unavailable UI', () => {
  it('builds paths and copy for each reason', () => {
    expect(delegateUnavailablePath('expired')).toBe('/delegate/unavailable?reason=expired');
    expect(delegateUnavailableCopy('expired').title).toContain('истекла');
    expect(delegateUnavailableCopy('handled').title).toContain('обработан');
    expect(delegateUnavailableCopy('closed').title).toContain('закрыт');
  });

  it('parses reason query param', () => {
    expect(parseDelegateUnavailableReason('handled')).toBe('handled');
    expect(parseDelegateUnavailableReason('invalid')).toBeNull();
  });
});
