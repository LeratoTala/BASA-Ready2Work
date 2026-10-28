import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request, Response } from 'express';
import { verifyIdToken } from './verifyIdToken';

function createMockResponse() {
  const res: Partial<Response> & { statusCode?: number; jsonData?: unknown } = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res as Response;
  };
  res.json = (data: unknown) => {
    res.jsonData = data;
    return res as Response;
  };
  return res as Response & { statusCode: number; jsonData: any };
}

describe('verifyIdToken middleware security invariants', () => {
  it('returns 401 when Authorization header is completely missing', async () => {
    const req = { headers: {} } as Request;
    const res = createMockResponse();
    let nextCalled = false;

    await verifyIdToken(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false, 'next() must NOT be called without a token');
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.jsonData, {
      error: 'Authentication required. Please sign in and try again.',
    });
  });

  it('returns 401 when Authorization header does not start with Bearer', async () => {
    const req = { headers: { authorization: 'Basic 123456' } } as Request;
    const res = createMockResponse();
    let nextCalled = false;

    await verifyIdToken(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
  });

  it('returns 401 when Bearer token is whitespace or empty', async () => {
    const req = { headers: { authorization: 'Bearer   ' } } as Request;
    const res = createMockResponse();
    let nextCalled = false;

    await verifyIdToken(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
  });

  it('ALWAYS returns 401 even if VITE_ENABLE_DEMO_DATA=true is set in env', async () => {
    const originalEnv = process.env.VITE_ENABLE_DEMO_DATA;
    try {
      process.env.VITE_ENABLE_DEMO_DATA = 'true';
      const req = { headers: {} } as Request;
      const res = createMockResponse();
      let nextCalled = false;

      await verifyIdToken(req, res, () => {
        nextCalled = true;
      });

      assert.equal(
        nextCalled,
        false,
        'Security invariant violated: VITE_ENABLE_DEMO_DATA must NEVER bypass verifyIdToken'
      );
      assert.equal(res.statusCode, 401);
    } finally {
      if (originalEnv === undefined) {
        delete process.env.VITE_ENABLE_DEMO_DATA;
      } else {
        process.env.VITE_ENABLE_DEMO_DATA = originalEnv;
      }
    }
  });
});
