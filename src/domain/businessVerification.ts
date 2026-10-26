import { BusinessRegistrationType, BusinessVerificationDetails } from './types';

export interface BusinessVerificationValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates a South African business registration number based on entity type.
 * Examples:
 * - CIPC Pty Ltd / NPC / Public: 2021/123456/07 or 2019/123456/08
 * - CIPC Close Corp: CK2005/123456/23 or 2005/123456/23
 * - SARS Tax Number: 10 digits
 * - Municipal Permit: alphanumeric e.g. JHB-TRD-2024-00123
 */
export function validateRegistrationNumberFormat(
  type: BusinessRegistrationType,
  regNumber: string
): { isValidFormat: boolean; hint?: string } {
  const cleaned = regNumber.trim().toUpperCase();
  if (!cleaned) {
    return { isValidFormat: false, hint: 'Registration number is required.' };
  }

  if (type === 'cipc_pty_ltd' || type === 'cipc_npc') {
    // Expected standard CIPC format: YYYY/NNNNNN/NN
    const cipcRegex = /^(19|20)\d{2}\/\d{5,7}\/(07|08|06|21)$/;
    const rawNumberRegex = /^\d{10,14}$/;
    if (!cipcRegex.test(cleaned) && !rawNumberRegex.test(cleaned.replace(/[\/\s-]/g, ''))) {
      return {
        isValidFormat: false,
        hint: 'CIPC company numbers usually follow the format YYYY/NNNNNN/07 (e.g. 2022/123456/07).',
      };
    }
  }

  if (type === 'cipc_close_corp') {
    const ccRegex = /^(CK)?(19|20)\d{2}\/\d{5,7}\/23$/;
    const rawCcRegex = /^\d{10,12}$/;
    if (!ccRegex.test(cleaned) && !rawCcRegex.test(cleaned.replace(/[^0-9]/g, ''))) {
      return {
        isValidFormat: false,
        hint: 'Close Corporation numbers typically end with /23 (e.g. CK2004/012345/23).',
      };
    }
  }

  if (type === 'sars_sole_proprietor') {
    const digitsOnly = cleaned.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      return {
        isValidFormat: false,
        hint: 'SARS Income Tax reference numbers must be exactly 10 digits.',
      };
    }
  }

  if (type === 'municipal_trade_permit') {
    if (cleaned.length < 4) {
      return {
        isValidFormat: false,
        hint: 'Please provide a valid municipal trading permit or informal trader license number.',
      };
    }
  }

  return { isValidFormat: true };
}

/**
 * Validates the full business verification submission before submitting to administrators.
 */
export function validateBusinessVerification(
  details: Partial<BusinessVerificationDetails>
): BusinessVerificationValidationResult {
  const errors: string[] = [];

  if (!details.registrationType) {
    errors.push('Please select a business registration entity type.');
  }

  if (!details.legalRegisteredName || details.legalRegisteredName.trim().length < 3) {
    errors.push('Official registered legal business name must be at least 3 characters.');
  }

  if (!details.registrationNumber || details.registrationNumber.trim().length < 4) {
    errors.push('Please enter an official CIPC registration number or municipal trading permit.');
  } else if (details.registrationType) {
    const check = validateRegistrationNumberFormat(details.registrationType, details.registrationNumber);
    if (!check.isValidFormat && check.hint) {
      errors.push(check.hint);
    }
  }

  if (!details.physicalAddress || details.physicalAddress.trim().length < 6) {
    errors.push('Please provide the physical operating business address.');
  }

  if (!details.officialPhone || details.officialPhone.trim().replace(/\D/g, '').length < 9) {
    errors.push('Please provide a valid business telephone or mobile contact number (minimum 9 digits).');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
