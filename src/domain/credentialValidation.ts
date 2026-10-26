import crypto from 'node:crypto';
import type { CredentialEvidence, CredentialCheckStatus } from './types';

/**
 * Section 35.3: Known Issuer Configuration Map
 * Configures allowed verification domains and recommended ID regex patterns.
 * Unknown patterns trigger "needs_review" without rejecting the credential.
 */
export interface IssuerConfig {
  displayName: string;
  allowedDomains: string[];
  idPattern?: RegExp;
  category: 'proctored_exam' | 'course_badge' | 'trade_certificate' | 'other';
  isAccredited?: boolean; // Strictly for verified SAQA/statutory bodies
}

export const ISSUER_CONFIGS: Record<string, IssuerConfig> = {
  'SAQA': {
    displayName: 'South African Qualifications Authority (SAQA)',
    allowedDomains: ['saqa.org.za', 'www.saqa.org.za'],
    idPattern: /^[0-9A-Z\-\/]{4,20}$/i,
    category: 'trade_certificate',
    isAccredited: true,
  },
  'Credly': {
    displayName: 'Credly / Acclaim',
    allowedDomains: ['credly.com', 'www.credly.com'],
    idPattern: /^[a-z0-9\-]{8,36}$/i,
    category: 'course_badge',
    isAccredited: false,
  },
  'Coursera': {
    displayName: 'Coursera',
    allowedDomains: ['coursera.org', 'www.coursera.org'],
    idPattern: /^[A-Z0-9]{8,24}$/i,
    category: 'course_badge',
    isAccredited: false,
  },
  'Microsoft': {
    displayName: 'Microsoft Certified Professional',
    allowedDomains: ['learn.microsoft.com', 'microsoft.com', 'credly.com'],
    idPattern: /^[a-z0-9\-]{6,24}$/i,
    category: 'proctored_exam',
    isAccredited: false,
  },
  'Cisco': {
    displayName: 'Cisco Networking Academy',
    allowedDomains: ['netacad.com', 'credly.com', 'cisco.com'],
    idPattern: /^[a-z0-9\-]{6,24}$/i,
    category: 'course_badge',
    isAccredited: false,
  },
  'South African Red Cross': {
    displayName: 'South African Red Cross Society (SARCS)',
    allowedDomains: ['redcross.org.za', 'www.redcross.org.za'],
    idPattern: /^SARCS-[0-9]{4,12}$/i,
    category: 'proctored_exam',
    isAccredited: false,
  },
  'Specialty Coffee Association': {
    displayName: 'Specialty Coffee Association (SCA)',
    allowedDomains: ['sca.coffee', 'education.sca.coffee'],
    idPattern: /^SCA-[0-9]{5,10}$/i,
    category: 'proctored_exam',
    isAccredited: false,
  },
};

export const COMMON_ISSUER_NAMES = [
  'SAQA',
  'Credly',
  'Coursera',
  'Microsoft',
  'Cisco',
  'South African Red Cross',
  'Specialty Coffee Association',
  'Other',
];

const DEFAULT_CREDENTIAL_SALT = 'basa_ready2work_credential_salt_2026';

/**
 * Section 35.6: Mask Credential ID.
 * Personal data protection: displays only the last 4 characters in public/unprivileged views.
 */
export function maskCredentialId(credentialId?: string): string {
  if (!credentialId) return '';
  const trimmed = credentialId.trim();
  if (trimmed.length <= 4) return '••••';
  const visible = trimmed.slice(-4);
  const maskedPrefix = '•'.repeat(Math.min(8, trimmed.length - 4));
  return `${maskedPrefix}${visible}`;
}

/**
 * Section 35.3: Duplicate Detection Salted Hash.
 * Generates an anonymous salted SHA-256 hash of normalized (issuer + credentialId).
 * Used for detecting duplicate claims across candidate accounts without exposing personal IDs.
 */
export function generateCredentialHash(issuer: string, credentialId?: string, salt = DEFAULT_CREDENTIAL_SALT): string | null {
  if (!credentialId || !credentialId.trim()) return null;
  const normalized = `${issuer.trim().toLowerCase()}:::${credentialId.trim().toUpperCase()}`;
  return crypto.createHmac('sha256', salt).update(normalized).digest('hex');
}

/**
 * Section 35.3: Check if a credential has expired.
 */
export function isCredentialExpired(expiresOn?: string, referenceDate: Date = new Date()): boolean {
  if (!expiresOn || !expiresOn.trim()) return false;
  const expiry = new Date(expiresOn);
  if (isNaN(expiry.getTime())) return false;
  return expiry.getTime() < referenceDate.getTime();
}

export interface CredentialInputValidationResult {
  isValid: boolean;
  error?: string;
  initialCheckStatus: CredentialCheckStatus;
  checkNote?: string;
  isExpired: boolean;
}

/**
 * Section 35.2 & 35.3: Validate Credential Submission.
 * Client and server-side validation rules.
 */
export function validateCredentialInput(input: {
  issuer: string;
  credentialName: string;
  credentialId?: string;
  verifyUrl?: string;
  fileRef?: string;
  issuedOn?: string;
  expiresOn?: string;
}): CredentialInputValidationResult {
  const issuer = input.issuer?.trim();
  const name = input.credentialName?.trim();
  const id = input.credentialId?.trim();
  const url = input.verifyUrl?.trim();
  const file = input.fileRef?.trim();

  // 1. Mandatory Core Names
  if (!issuer) {
    return { isValid: false, error: 'Please select or enter the certificate issuer.', initialCheckStatus: 'needs_review', isExpired: false };
  }
  if (!name) {
    return { isValid: false, error: 'Please enter the credential or badge title.', initialCheckStatus: 'needs_review', isExpired: false };
  }

  // 2. Section 35.2 & 35.7: Must provide AT LEAST ONE of Credential ID, Verify Link, or File Upload
  if (!id && !url && !file) {
    return {
      isValid: false,
      error: 'Please provide at least one piece of proof: an ID number, a verification link, or an uploaded photo/document.',
      initialCheckStatus: 'needs_review',
      isExpired: false,
    };
  }

  // 3. Section 35.3: Verification link security (HTTPS only, SSRF safe)
  let initialCheckStatus: CredentialCheckStatus = 'unchecked';
  let checkNote: string | undefined;

  if (url) {
    if (!/^https:\/\//i.test(url)) {
      return {
        isValid: false,
        error: 'Verification links must start with https:// for your safety.',
        initialCheckStatus: 'needs_review',
        isExpired: false,
      };
    }

    try {
      const parsedUrl = new URL(url);
      const host = parsedUrl.hostname.toLowerCase();
      const config = ISSUER_CONFIGS[issuer];

      if (config && config.allowedDomains.length > 0) {
        const domainMatches = config.allowedDomains.some(
          (d) => host === d || host.endsWith(`.${d}`)
        );
        if (!domainMatches) {
          initialCheckStatus = 'needs_review';
          checkNote = `Verification link domain (${host}) does not match standard ${issuer} domain. Assessor manual check required.`;
        }
      } else if (issuer === 'Other') {
        initialCheckStatus = 'needs_review';
        checkNote = `Custom issuer link (${host}) queued for assessor review.`;
      }
    } catch {
      return { isValid: false, error: 'Please enter a valid website address.', initialCheckStatus: 'needs_review', isExpired: false };
    }
  }

  // 4. Section 35.3: Issuer ID Format Pattern Check
  if (id) {
    const config = ISSUER_CONFIGS[issuer];
    if (config?.idPattern && !config.idPattern.test(id)) {
      initialCheckStatus = 'needs_review';
      checkNote = checkNote
        ? `${checkNote} ID format does not match typical pattern for ${issuer}.`
        : `ID format does not match typical pattern for ${issuer} (${id}). Queued for assessor review.`;
    }
  }

  // 5. Expiry Check
  const isExpired = isCredentialExpired(input.expiresOn);

  return {
    isValid: true,
    initialCheckStatus,
    checkNote,
    isExpired,
  };
}
