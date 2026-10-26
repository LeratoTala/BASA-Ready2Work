import type { Role } from '../src/domain/types';

export interface RegistrationData {
  user: {
    uid: string;
    displayName: string;
    email: string;
    role: Exclude<Role, 'admin'>;
    createdAt: string;
    accountStatus: 'active';
    minimumAgeConfirmed: true;
  };
  candidateProfile?: Record<string, unknown>;
  candidatePrivateProfile?: Record<string, unknown>;
  employerProfile?: Record<string, unknown>;
}

export function buildRegistrationData(
  uid: string,
  email: string,
  input: unknown,
  createdAt: string
): RegistrationData {
  const body = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim().slice(0, 120) : '';
  const role = body.role;

  if (!uid || !email || !displayName) throw new Error('A verified account and display name are required.');
  if (body.minimumAgeConfirmed !== true) throw new Error('Confirm that you meet the minimum age to use BASA.');
  if (role !== 'candidate' && role !== 'employer') throw new Error('Choose candidate or employer access.');

  const user: RegistrationData['user'] = {
    uid,
    displayName,
    email,
    role: role as Exclude<Role, 'admin'>,
    createdAt,
    accountStatus: 'active',
    minimumAgeConfirmed: true,
  };
  if (role === 'candidate') {
    return {
      user,
      candidateProfile: {
        uid,
        fullName: displayName,
        headline: '',
        experienceSummary: '',
        skillIds: [],
        locationArea: '',
        availability: 'immediate',
        popiaVisibility: 'private',
        updatedAt: createdAt,
      },
      candidatePrivateProfile: { uid, contactEmail: email },
    };
  }

  return {
    user,
    employerProfile: {
      uid,
      businessName: displayName,
      industry: '',
      description: '',
      locationArea: '',
      verificationStatus: 'pending',
      contactEmail: email,
      createdAt,
    },
  };
}