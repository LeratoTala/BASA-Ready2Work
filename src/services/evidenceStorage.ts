import { deleteObject, getStorage, ref, uploadBytes } from 'firebase/storage';
import { getFirebase } from './firebase';
import { validateEvidenceFile } from './evidenceValidation';

export async function uploadCandidateEvidence(
  uid: string,
  claimId: string,
  file: File,
  fileId?: string
): Promise<string> {
  validateEvidenceFile(file);

  const cleanFileId = fileId || `doc_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const objectPath = `candidate-evidence/${uid}/${claimId}/${cleanFileId}`;
  const storage = getStorage(getFirebase().app);
  await uploadBytes(ref(storage, objectPath), file, { contentType: file.type });
  return objectPath;
}

export async function deleteCandidateEvidence(objectPath: string): Promise<void> {
  const storage = getStorage(getFirebase().app);
  await deleteObject(ref(storage, objectPath));
}
