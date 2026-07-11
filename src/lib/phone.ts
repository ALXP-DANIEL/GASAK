import {
  type CountryCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js/mobile";

/**
 * Malaysian phone number helpers built on `libphonenumber-js` (the industry
 * standard port of Google's libphonenumber).
 *
 * Storage uses E.164 with the `+60` country code (e.g. `+60123456789`),
 * which is what messaging / payment APIs expect. User input is the national
 * number (with or without a leading `0`), so we normalize on the way in and
 * strip back to national digits for display.
 */

const DEFAULT_COUNTRY: CountryCode = "MY";

/** Normalize any Malaysian phone input to E.164 `+60XXXXXXXX`. */
export function toMalaysiaPhone(input: string): string {
  const parsed = parsePhoneNumberFromString(input, DEFAULT_COUNTRY);
  if (parsed?.isValid()) return parsed.number;

  // Fallback: best-effort normalize (matches previous behavior) so we never
  // throw and still produce a `+60…` value for otherwise-unparseable input.
  const digits = input.replace(/\D/g, "").replace(/^60/, "").replace(/^0/, "");
  return digits ? `+60${digits}` : "";
}

/** Strip an E.164 (or national) value down to the national digits for display. */
export function toNationalPhone(input: string): string {
  const parsed = parsePhoneNumberFromString(input, DEFAULT_COUNTRY);
  if (parsed?.isValid()) return parsed.nationalNumber;

  return input.replace(/\D/g, "").replace(/^60/, "").replace(/^0/, "");
}
