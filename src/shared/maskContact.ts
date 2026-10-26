/** POPIA-friendly masking helpers for contact details shown before a candidate is shortlisted. */

export const NOT_PROVIDED = 'Not provided';

/** Keeps the last 2 digits, masks the rest: "+27 82 459 1102" -> "••• •• ••• ••02". */
export function maskPhone(phone?: string): string {
  if (!phone) return NOT_PROVIDED;
  const visible = 2;
  let digitsSeen = 0;
  const totalDigits = (phone.match(/\d/g) ?? []).length;
  if (totalDigits <= visible) return '••••';
  return phone.replace(/\d/g, (d) => (++digitsSeen > totalDigits - visible ? d : '•'));
}

/** Keeps the first character and the domain: "thabo@kasi.co.za" -> "t••••@kasi.co.za". */
export function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return NOT_PROVIDED;
  const [name, domain] = email.split('@');
  return `${name.slice(0, 1)}${'•'.repeat(Math.max(3, name.length - 1))}@${domain}`;
}
