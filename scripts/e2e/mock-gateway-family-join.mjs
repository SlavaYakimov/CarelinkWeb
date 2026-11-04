#!/usr/bin/env node
/**
 * Minimal gateway stub for family-join e2e / screenshots (127.0.0.1:8088).
 */
import http from 'node:http';
import { randomUUID } from 'node:crypto';

const port = Number(process.env.MOCK_GATEWAY_PORT ?? 8088);
const familyId = process.env.MOCK_FAMILY_ID ?? '11111111-1111-4111-8111-111111111111';

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

const joinToken = 'e2ejointoken0001';
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);
  const path = url.pathname;

  if (req.method === 'POST' && path === '/v2/auth/join/email/request-code') {
    return json(res, 202, {});
  }
  if (req.method === 'POST' && path === '/v2/auth/join/email/verify-code') {
    return json(res, 200, { emailVerificationTicket: 'ticket-e2e', registered: false });
  }
  if (req.method === 'POST' && path === '/v2/auth/join/redeem') {
    return json(res, 200, { outcome: 'choose_path', userRefresh: 'refresh-e2e' });
  }
  if (req.method === 'POST' && path === '/v2/auth/join/qr/resolve') {
    return json(res, 200, {
      familyName: 'Семья Якимовых',
      keeperDisplayName: 'Слава',
      roleLabel: 'Участник',
      expiresAt,
      joinToken,
    });
  }
  if (req.method === 'GET' && path === '/v1/families/check-slug') {
    return json(res, 200, { available: true, slug: url.searchParams.get('slug') ?? 'demo' });
  }
  if (req.method === 'POST' && path.match(/^\/v1\/families\/[^/]+\/join-links$/)) {
    return json(res, 201, {
      joinToken,
      expiresAt,
      shareUrl: `http://127.0.0.1:3000/join?t=${joinToken}`,
    });
  }
  if (req.method === 'GET' && path.match(/^\/v1\/families\/[^/]+\/join-requests$/)) {
    return json(res, 200, {
      items: [
        {
          requestId: randomUUID(),
          displayName: 'Мама',
          scannedAt: new Date().toISOString(),
          status: 'pending',
          kind: 'qr',
        },
      ],
    });
  }
  if (req.method === 'POST' && path === '/v1/auth/token/refresh') {
    return json(res, 401, { code: 'UNAUTHORIZED' });
  }

  json(res, 404, { code: 'NOT_IMPLEMENTED', message: path });
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(JSON.stringify({ ok: true, port, familyId, joinToken }) + '\n');
});
