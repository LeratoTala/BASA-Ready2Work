import type { useDemoStore } from './useDemoStore';
import type { Role, User } from '../../domain/types';

/** The single contract every store implementation (demo or Firestore) must satisfy. */
export type BasaStore = Omit<ReturnType<typeof useDemoStore>, 'registerUser'> & {
  registerUser: (
    displayName: string,
    email: string,
    role: Role,
    minimumAgeConfirmed?: boolean
  ) => User | Promise<User>;
};
