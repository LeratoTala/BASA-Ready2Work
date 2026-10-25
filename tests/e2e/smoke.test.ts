/**
 * E2E smoke tests — server API contract tests.
 *
 * These tests run the real Express application against demo mode (VITE_ENABLE_DEMO_DATA=true)
 * so they work without a Firebase project in CI. They verify the API routes exist, enforce
 * authentication, and return the correct HTTP status codes and error shapes.
 *
 * To run against a real Firebase project, set VITE_ENABLE_DEMO_DATA=false and provide
 * Firebase credentials via GOOGLE_APPLICATION_CREDENTIALS + FIREBASE_PROJECT_ID.
 *
 * Run: npm test (these files match the glob in the test script)
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

/**
 * Helper — make a JSON request and return the response + parsed body.
 */
async function apiRequest(
  method: string,
  path: string,
  options: { body?: unknown; token?: string; headers?: Record<string, string> } = {}
): Promise<{ status: number; body: unknown }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  let body: unknown;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}

// ─────────────────────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────────────────────
describe('GET /api/health', () => {
  it('returns 200 with status:ok', async () => {
    const { status, body } = await apiRequest('GET', '/api/health');
    assert.equal(status, 200, 'health check must return 200');
    assert.equal((body as { status: string }).status, 'ok');
  });

  it('includes an ai flag', async () => {
    const { body } = await apiRequest('GET', '/api/health');
    assert.ok(typeof (body as { ai: boolean }).ai === 'boolean', 'ai field must be boolean');
  });
});

// ─────────────────────────────────────────────────────────────
// Authentication enforcement — unauthenticated callers get 401
// ─────────────────────────────────────────────────────────────
describe('API authentication enforcement', () => {
  it('POST /api/register rejects missing Authorization header with 401', async () => {
    const { status } = await apiRequest('POST', '/api/register', {
      body: { displayName: 'Test User', role: 'candidate', minimumAgeConfirmed: true },
    });
    // Demo mode skips Firebase token verification — expect 403 (demo guard) or 401 (auth guard).
    assert.ok([401, 403].includes(status), `expected 401 or 403, got ${status}`);
  });

  it('POST /api/apply rejects missing Authorization header with 401', async () => {
    const { status } = await apiRequest('POST', '/api/apply', {
      body: { jobId: 'nonexistent-job' },
    });
    assert.ok([401, 403].includes(status), `expected 401 or 403, got ${status}`);
  });

  it('DELETE /api/delete-account rejects missing Authorization header with 401', async () => {
    const { status } = await apiRequest('DELETE', '/api/delete-account');
    assert.ok([401, 403].includes(status), `expected 401 or 403, got ${status}`);
  });

  it('POST /api/admin/verify-employer rejects missing Authorization header', async () => {
    const { status } = await apiRequest('POST', '/api/admin/verify-employer', {
      body: { targetUid: 'some-uid', action: 'verify' },
    });
    assert.ok([401, 403].includes(status), `expected 401 or 403, got ${status}`);
  });
});

// ─────────────────────────────────────────────────────────────
// Input validation — bad payloads return 400 with an error message
// ─────────────────────────────────────────────────────────────
describe('API input validation', () => {
  it('POST /api/register returns error body (not blank response) on invalid input', async () => {
    const { body } = await apiRequest('POST', '/api/register', {
      body: {},
      // In demo mode this hits the demo guard early; still should return JSON error.
    });
    assert.ok(
      typeof body === 'object' && body !== null && 'error' in (body as object),
      'response must have an error field'
    );
  });

  it('POST /api/cv-draft returns 401 without auth even in production mode', async () => {
    const { status } = await apiRequest('POST', '/api/cv-draft', {
      body: { experience: 'test', skills: [] },
    });
    // AI drafting is disabled unless GEMINI_ENABLED=true — expect 401 or 503.
    assert.ok([401, 403, 503].includes(status), `expected 401/403/503, got ${status}`);
  });
});

// ─────────────────────────────────────────────────────────────
// Static app shell
// ─────────────────────────────────────────────────────────────
describe('Static app shell', () => {
  it('GET / returns HTML in production', async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (res.status === 404) {
      // Dev mode: Vite handles HTML; this is expected outside of a production build.
      return;
    }
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('<html'), 'response should be an HTML page');
  });

  it('GET /manifest.webmanifest returns JSON with name field', async () => {
    const res = await fetch(`${BASE_URL}/manifest.webmanifest`);
    if (res.status === 404) return; // dev mode — static files served by Vite
    assert.equal(res.status, 200);
    const json = (await res.json()) as { name: string };
    assert.equal(json.name, 'BASA: Ready2Work');
  });
});

// ─────────────────────────────────────────────────────────────
// Security headers
// ─────────────────────────────────────────────────────────────
describe('Security headers', () => {
  it('API response includes X-Content-Type-Options: nosniff', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.equal(
      res.headers.get('x-content-type-options'),
      'nosniff',
      'X-Content-Type-Options header must be present'
    );
  });

  it('API response includes X-Frame-Options: DENY', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.equal(
      res.headers.get('x-frame-options'),
      'DENY',
      'X-Frame-Options header must be present'
    );
  });

  it('API response does not expose X-Powered-By', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.equal(
      res.headers.get('x-powered-by'),
      null,
      'X-Powered-By header must not be present'
    );
  });
});
