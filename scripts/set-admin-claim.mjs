#!/usr/bin/env node
/**
 * Grants or revokes the `admin` custom claim (assessor/moderator) for a user.
 *
 *   node scripts/set-admin-claim.mjs <email> [--revoke]
 *
 * Requires: `npm i -D firebase-admin` and GOOGLE_APPLICATION_CREDENTIALS pointing at a
 * service-account key kept OUTSIDE the repository. Run this from a trusted machine only.
 * The user must sign out and back in for the claim to take effect.
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const [email, flag] = process.argv.slice(2);
if (!email) {
  console.error('Usage: node scripts/set-admin-claim.mjs <email> [--revoke]');
  process.exit(1);
}

initializeApp({ credential: applicationDefault() });
const auth = getAuth();
const user = await auth.getUserByEmail(email);
const revoke = flag === '--revoke';
await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), admin: !revoke });
console.log(`${revoke ? 'Revoked' : 'Granted'} admin claim for ${email} (${user.uid}).`);
