import { useEffect, useState } from 'react';
import { STORAGE_KEYS, DEMO_STORAGE_PREFIX } from '../../config/app';
import { loadStored, saveStored } from '../../services/localStorage';

/** Shape of the offline-friendly candidate profile draft (FR-13). */
export interface ProfileDraft {
  editHeadline: string;
  editLocation: string;
  editAvailability: string;
  timestamp: string;
}

/**
 * Device-local preferences and drafts.
 * - `lowDataMode` stays shared across modes.
 * - `profileDraft` follows the active runtime mode's namespace so demo edits never contaminate real drafts.
 */
export function useLocalPrefs(mode: 'demo' | 'real' = 'real') {
  const profileDraftKey =
    mode === 'demo' ? `${DEMO_STORAGE_PREFIX}profileDraft` : STORAGE_KEYS.profileDraft;

  const [lowDataMode, setLowDataMode] = useState<boolean>(() =>
    loadStored(STORAGE_KEYS.lowDataMode, false)
  );
  // Offline-friendly profile draft (FR-13).
  const [profileDraft, setProfileDraft] = useState<ProfileDraft | null>(() =>
    loadStored<ProfileDraft | null>(profileDraftKey, null)
  );

  useEffect(() => saveStored(STORAGE_KEYS.lowDataMode, lowDataMode), [lowDataMode]);
  useEffect(() => saveStored(profileDraftKey, profileDraft), [profileDraftKey, profileDraft]);

  const saveDraft = (draft: ProfileDraft) => setProfileDraft(draft);
  return { lowDataMode, setLowDataMode, profileDraft, saveDraft };
}
