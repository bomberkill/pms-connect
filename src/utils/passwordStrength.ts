/**
 * Mirrors the server's actual rule (Better Auth `minPasswordLength: 12`,
 * see src/lib/auth.ts) plus the design system's guidance: 12 chars + a
 * digit is the floor ("Solide"), a special character maxes it out
 * ("Très solide"). Anything short of the floor is shown as weak so the
 * user isn't told a password is fine right before the server rejects it.
 */
export type PasswordStrength = 0 | 1 | 2 | 3;

export const PASSWORD_MIN_LENGTH = 12;
const SPECIAL_CHAR_RE = /[^A-Za-z0-9]/;
const DIGIT_RE = /[0-9]/;
export { DIGIT_RE as PASSWORD_DIGIT_RE };

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password || password.length < 8) return 0;
  const meetsFloor = password.length >= 12 && DIGIT_RE.test(password);
  if (!meetsFloor) return 1;
  return SPECIAL_CHAR_RE.test(password) ? 3 : 2;
}
