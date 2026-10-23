import { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../../config/app';
import { loadStored, saveStored } from '../../services/localStorage';

/** Device-local preferences and drafts. These are intentionally NOT synced to the backend. */
export function useLocalPrefs() {
  const [lowDataMode, setLowDataMode] = useState<boolean>(() => loadStored(STORAGE_KEYS.lowDataMode, false));
  // Offline-friendly profile draft (FR-13).
  const [profileDraft, setProfileDraft] = useState<any>(() => loadStored(STORAGE_KEYS.profileDraft, null));

  useEffect(() => saveStored(STORAGE_KEYS.lowDataMode, lowDataMode), [lowDataMode]);
  useEffect(() => saveStored(STORAGE_KEYS.profileDraft, profileDraft), [profileDraft]);

  const saveDraft = (draft: any) => setProfileDraft(draft);
  return { lowDataMode, setLowDataMode, profileDraft, saveDraft };
}
