import type { NextFunction, Request, Response } from 'express';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { serverConfig } from '../config';

/** Lazily initialise the Admin SDK once. Uses Application Default Credentials on Cloud Run,
 *  or a service-account key file path in GOOGLE_APPLICATION_CREDENTIALS locally. */
function getAdminAuth() {
  if (getApps().length === 0) {
    // If a service-account JSON path is provided via env, use it explicitly.
    // Otherwise fall back to Application Default Credentials (Cloud Run / GCE).
    const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    initializeApp(
      credentialPath
        ? { credential: cert(credentialPath), projectId: serverConfig.firebaseProjectId }
        : { projectId: serverConfig.firebaseProjectId }
    );
  }
  return getAuth();
}

/**
 * Express middleware: verifies the Firebase ID token in `Authorization: Bearer <token>`.
 * Attaches the decoded UID to `req.uid` for downstream handlers.
 *
 * Skipped when VITE_ENABLE_DEMO_DATA=true so local dev without Firebase still works.
 * Reference: FR-14 / Phase 2b security requirement.
 */
export async function verifyIdToken(req: Request, res: Response, next: NextFunction) {
  // Demo mode — no Firebase project, skip verification entirely.
  if (process.env.VITE_ENABLE_DEMO_DATA === 'true') {
    return next();
  }

  const authHeader = req.headers.authorization ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in and try again.' });
  }

  const idToken = authHeader.slice(7).trim();
  if (!idToken) {
    return res.status(401).json({ error: 'Authentication required. Please sign in and try again.' });
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken, /* checkRevoked */ true);
    // Attach uid so route handlers can log or scope the request without re-decoding.
    (req as Request & { uid: string }).uid = decoded.uid;
    return next();
  } catch (err) {
    const code = (err as { code?: string }).code ?? '';
    if (code === 'auth/id-token-revoked') {
      return res.status(401).json({ error: 'Your session has been revoked. Please sign in again.' });
    }
    // Expired, malformed, wrong project — all treated as unauthenticated.
    return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }
}
