import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { Request, Response } from 'express';
import { handleRegister } from './register';
import { setAdminFirestoreForTesting, verifyIdToken } from '../middleware/verifyIdToken';

function createMockResponse() {
  const res: Partial<Response> & { statusCode?: number; jsonData?: any } = {};
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

describe('server registration route unit tests (fast, no emulator)', () => {
  let mockDocs: Map<string, any>;
  let mockDb: any;

  beforeEach(() => {
    mockDocs = new Map();
    mockDb = {
      doc: (path: string) => ({
        path,
        id: path.split('/').pop(),
      }),
      runTransaction: async (updateFn: (t: any) => Promise<any>) => {
        const t = {
          get: async (ref: any) => ({
            exists: mockDocs.has(ref.path),
            data: () => mockDocs.get(ref.path),
          }),
          create: (ref: any, data: any) => {
            if (mockDocs.has(ref.path)) throw new Error('Document already exists');
            mockDocs.set(ref.path, data);
          },
        };
        return updateFn(t);
      },
    };
    setAdminFirestoreForTesting(mockDb);
  });

  it('no token -> 401', async () => {
    const req = { headers: {} } as Request;
    const res = createMockResponse();
    let nextCalled = false;

    await verifyIdToken(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.jsonData, {
      error: 'Authentication required. Please sign in and try again.',
    });
  });

  it('valid token for new uid + candidate -> creates docs with 201', async () => {
    const req = {
      uid: 'cand-uid-1',
      tokenEmail: 'cand1@basa.co.za',
      body: {
        displayName: 'Thabo Candidate',
        role: 'candidate',
        minimumAgeConfirmed: true,
      },
    } as any;
    const res = createMockResponse();

    await handleRegister(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.jsonData.uid, 'cand-uid-1');
    assert.equal(res.jsonData.role, 'candidate');

    // Confirm documents created in mock firestore
    assert.equal(mockDocs.has('users/cand-uid-1'), true);
    assert.equal(mockDocs.has('candidateProfiles/cand-uid-1'), true);
    assert.equal(mockDocs.has('candidatePrivateProfiles/cand-uid-1'), true);

    const userDoc = mockDocs.get('users/cand-uid-1');
    assert.equal(userDoc.displayName, 'Thabo Candidate');
    assert.equal(userDoc.role, 'candidate');
    assert.equal(userDoc.accountStatus, 'active');
  });

  it('valid token for new uid + employer -> creates docs with free plan defaults', async () => {
    const req = {
      uid: 'emp-uid-1',
      tokenEmail: 'emp1@basa.co.za',
      body: {
        displayName: 'Acme Logistics',
        role: 'employer',
        minimumAgeConfirmed: true,
      },
    } as any;
    const res = createMockResponse();

    await handleRegister(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.jsonData.uid, 'emp-uid-1');
    assert.equal(res.jsonData.role, 'employer');

    const empProfile = mockDocs.get('employerProfiles/emp-uid-1');
    assert.equal(empProfile.businessName, 'Acme Logistics');
    assert.equal(empProfile.plan, 'free');
    assert.equal(empProfile.planStatus, 'active');
    assert.equal(empProfile.verificationStatus, 'pending');
  });

  it('role "admin" -> 400', async () => {
    const req = {
      uid: 'attacker-1',
      tokenEmail: 'attacker@evil.invalid',
      body: {
        displayName: 'Evil Admin',
        role: 'admin',
        minimumAgeConfirmed: true,
      },
    } as any;
    const res = createMockResponse();

    await handleRegister(req, res);

    assert.equal(res.statusCode, 400);
    assert.match(res.jsonData.error, /candidate or employer/i);
    assert.equal(mockDocs.has('users/attacker-1'), false);
  });

  it('second call is idempotent (returns 200 with alreadyRegistered: true)', async () => {
    const req = {
      uid: 'idempotent-uid',
      tokenEmail: 'user@basa.co.za',
      body: {
        displayName: 'Idempotent User',
        role: 'candidate',
        minimumAgeConfirmed: true,
      },
    } as any;
    const res1 = createMockResponse();
    await handleRegister(req, res1);
    assert.equal(res1.statusCode, 201);

    // Second call for the same account
    const res2 = createMockResponse();
    await handleRegister(req, res2);

    assert.equal(res2.statusCode, 200);
    assert.equal(res2.jsonData.uid, 'idempotent-uid');
    assert.equal(res2.jsonData.role, 'candidate');
    assert.equal(res2.jsonData.alreadyRegistered, true);
  });

  it('name too long is trimmed to 120 characters', async () => {
    const longName = 'A'.repeat(200);
    const req = {
      uid: 'longname-uid',
      tokenEmail: 'long@basa.co.za',
      body: {
        displayName: longName,
        role: 'candidate',
        minimumAgeConfirmed: true,
      },
    } as any;
    const res = createMockResponse();

    await handleRegister(req, res);

    assert.equal(res.statusCode, 201);
    const user = mockDocs.get('users/longname-uid');
    assert.equal(user.displayName.length, 120);
    assert.equal(user.displayName, 'A'.repeat(120));
  });

  it('uid taken from token, not from body', async () => {
    const req = {
      uid: 'token-verified-uid',
      tokenEmail: 'verified@basa.co.za',
      body: {
        uid: 'body-attacker-uid',
        displayName: 'Valid Name',
        role: 'candidate',
        minimumAgeConfirmed: true,
      },
    } as any;
    const res = createMockResponse();

    await handleRegister(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.jsonData.uid, 'token-verified-uid');
    assert.equal(mockDocs.has('users/token-verified-uid'), true);
    assert.equal(mockDocs.has('users/body-attacker-uid'), false);
  });
});
