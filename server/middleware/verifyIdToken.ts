import type { NextFunction, Request, Response } from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import { serverConfig } from '../config';

let adminAppInstance: any = null;
let adminAuthInstance: any = null;
let adminFirestoreInstance: Firestore | null = null;

/** Lazily initialise the Admin SDK on first use. */
async function getAdminApp() {
  if (!adminAppInstance) {
    const { cert, getApps, initializeApp } = await import('firebase-admin/app');
    if (getApps().length === 0) {
      const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      adminAppInstance = initializeApp(
        credentialPath
          ? { credential: cert(credentialPath), projectId: serverConfig.firebaseProjectId }
          : { projectId: serverConfig.firebaseProjectId }
      );
    } else {
      adminAppInstance = getApps()[0];
    }
  }
  return adminAppInstance;
}

async function getAdminAuth() {
  if (!adminAuthInstance) {
    const { getAuth } = await import('firebase-admin/auth');
    const app = await getAdminApp();
    adminAuthInstance = getAuth(app);
  }
  return adminAuthInstance;
}

export function getAdminFirestore(): Firestore {
  if (!adminFirestoreInstance) {
    // If Admin SDK app was initialized, retrieve firestore
    const { getFirestore } = require('firebase-admin/firestore');
    const { getApps } = require('firebase-admin/app');
    adminFirestoreInstance = getFirestore(getApps()[0]) as Firestore;
  }
  return adminFirestoreInstance;
}

export function setAdminFirestoreForTesting(mock: any) {
  adminFirestoreInstance = mock;
}

/**
 * Express middleware: verifies the Firebase ID token in `Authorization: Bearer <token>`.
 * Attaches the decoded UID to `req.uid` for downstream handlers.
 *
 * The server must ALWAYS verify the Firebase ID token and reject missing/invalid tokens with 401.
 * No environment flag may disable or bypass verification.
 * Reference: FR-14 / Phase 2b security requirement.
 */
export async function verifyIdToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in and try again.' });
  }

  const idToken = authHeader.slice(7).trim();
  if (!idToken) {
    return res.status(401).json({ error: 'Authentication required. Please sign in and try again.' });
  }

  try {
    const auth = await getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken, /* checkRevoked */ true);
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
  // Skip in development mode
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const appCheckToken = (req.headers['x-firebase-appcheck'] as string | undefined)?.trim();
  if (!appCheckToken) {
    return res.status(401).json({ error: 'App integrity check failed. Please refresh and try again.' });
  }

  try {
    const { getAppCheck } = await import('firebase-admin/app-check');
    const app = await getAdminApp();
    await getAppCheck(app).verifyToken(appCheckToken);
    return next();
  } catch {
    return res.status(401).json({ error: 'App integrity check failed. Please refresh and try again.' });
  }
}
