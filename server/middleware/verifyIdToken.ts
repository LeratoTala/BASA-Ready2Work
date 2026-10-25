import type { NextFunction, Request, Response } from 'express';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { serverConfig } from '../config';

/** Lazily initialise the Admin SDK once. Uses Application Default Credentials on Cloud Run,
 *  or a service-account key file path in GOOGLE_APPLICATION_CREDENTIALS locally. */
function getAdminApp() {
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
  return getApps()[0];
}

function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
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
    (req as Request & { uid: string; tokenEmail?: string }).uid = decoded.uid;
    (req as Request & { uid: string; tokenEmail?: string }).tokenEmail = decoded.email;
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

/**
 * Express middleware: verifies a Firebase App Check token in the `X-Firebase-AppCheck` header.
 * In production this prevents abuse from non-app clients. In development it is skipped.
 *
 * Apply this middleware to all /api routes BEFORE verifyIdToken for defence-in-depth.
 * Reference: Firebase App Check — https://firebase.google.com/docs/app-check
 */
export async function verifyAppCheck(req: Request, res: Response, next: NextFunction) {
  // Skip in demo / development mode
  if (process.env.VITE_ENABLE_DEMO_DATA === 'true' || process.env.NODE_ENV !== 'production') {
    return next();
  }

  const appCheckToken = (req.headers['x-firebase-appcheck'] as string | undefined)?.trim();
  if (!appCheckToken) {
    return res.status(401).json({ error: 'App integrity check failed. Please refresh and try again.' });
  }

  try {
    const { getAppCheck } = await import('firebase-admin/app-check');
    await getAppCheck(getAdminApp()).verifyToken(appCheckToken);
    return next();
  } catch {
    return res.status(401).json({ error: 'App integrity check failed. Please refresh and try again.' });
  }
}
