import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/** Liveness: process is up (deep checks — Redis/gateway — in W-03). */
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
