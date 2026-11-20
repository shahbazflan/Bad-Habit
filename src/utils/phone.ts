/**
 * Shared E.164 phone normalization and validation helpers.
 * Standardizes Pakistani numbers (03XX..., +923XX..., 00923XX..., 923XX...)
 * into canonical E.164 (+923XXXXXXXXX) and supports valid international E.164 numbers.
 */

export function normalizePhoneToE164(raw?: string | null): string {
  const input = String(raw ?? '').trim();
  if (!input) return '';

  // Keep only digits and a leading '+' if present
  const hasLeadingPlus = input.startsWith('+');
  const digitsOnly = input.replace(/[^\d]/g, '');
  if (!digitsOnly) return '';

  let cleaned = hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;

  // Convert 00 international dialing prefix to '+'
  if (cleaned.startsWith('00')) {
    cleaned = `+${cleaned.slice(2)}`;
  }

  // Pakistan E.164 canonicalization (+923XXXXXXXXX)
  if (cleaned.startsWith('+92')) {
    const subscriber = cleaned.slice(3).replace(/^0+/, '');
    return subscriber ? `+92${subscriber}` : '+92';
  }
  if (cleaned.startsWith('92') && cleaned.length >= 12) {
    const subscriber = cleaned.slice(2).replace(/^0+/, '');
    return subscriber ? `+92${subscriber}` : '+92';
  }
  if (cleaned.startsWith('03') && cleaned.length === 11) {
    return `+92${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith('3') && cleaned.length === 10) {
    return `+92${cleaned}`;
  }

  if (hasLeadingPlus) {
    return `+${digitsOnly}`;
  }

  // Fallback: if international digits 8..15 without '+' or 00, return normalized string
  if (digitsOnly.length >= 8 && digitsOnly.length <= 15 && !digitsOnly.startsWith('0')) {
    return `+${digitsOnly}`;
  }

  return cleaned;
}

export function isValidPhoneNumber(raw?: string | null): boolean {
  const e164 = normalizePhoneToE164(raw);
  if (!e164) return false;
  if (e164.startsWith('+92')) {
    return /^\+923\d{9}$/.test(e164);
  }
  return /^\+[1-9]\d{7,14}$/.test(e164);
}

export function phonesMatch(a?: string | null, b?: string | null): boolean {
  const normA = normalizePhoneToE164(a);
  const normB = normalizePhoneToE164(b);
  return Boolean(normA && normB && normA === normB);
}

/**
 * Produces an alphanumeric Firestore document ID safe for `/phoneRegistry/{phoneKey}`
 * matching `^[a-zA-Z0-9_\-]+$`.
 */
export function toPhoneRegistryKey(raw?: string | null): string {
  const e164 = normalizePhoneToE164(raw);
  const digits = e164.replace(/[^\d]/g, '');
  if (digits.length < 8 || digits.length > 15) return '';
  return `p_${digits}`;
}
