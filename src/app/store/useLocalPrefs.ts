import { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../../config/app';
import { loadStored, saveStored } from '../../services/localStorage';

/** Shape of the offline-friendly candidate profile draft (FR-13). */
export interface ProfileDraft {
  editHeadline: string;
  editLocation: string;
  editAvailability: string;
  timestamp: string;
}

/** Device-local preferences and drafts. These are intentionally NOT synced to the backend. */
export function useLocalPrefs() {
  const [lowDataMode, setLowDataMode] = useState<boolean>(() => loadStored(STORAGE_KEYS.lowDataMode, false));
  // Offline-friendly profile draft (FR-13).
  const [profileDraft, setProfileDraft] = useState<ProfileDraft | null>(() =>
    loadStored<ProfileDraft | null>(STORAGE_KEYS.profileDraft, null)
  );

  useEffect(() => saveStored(STORAGE_KEYS.lowDataMode, lowDataMode), [lowDataMode]);
  useEffect(() => saveStored(STORAGE_KEYS.profileDraft, profileDraft), [profileDraft]);

  const saveDraft = (draft: ProfileDraft) => setProfileDraft(draft);
  return { lowDataMode, setLowDataMode, profileDraft, saveDraft };
}
