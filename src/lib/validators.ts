/** Strip spaces, dashes, and parentheses so users can type numbers however feels natural. */
export function normalizePhone(input: string): string {
  return (input || "").replace(/[\s\-()]/g, "");
}

/**
 * Saudi mobile numbers only. Accepts:
 *  - Local:        05XXXXXXXX        (10 digits)
 *  - International: +9665XXXXXXXX / 9665XXXXXXXX / 009665XXXXXXXX
 */
export function isSaudiPhone(input: string): boolean {
  const v = normalizePhone(input);
  return /^(05\d{8}|(?:\+|00)?9665\d{8})$/.test(v);
}

export const SAUDI_PHONE_ERROR = "من فضلك أدخل رقم جوال سعودي صحيح (مثال: 05xxxxxxxx)";
