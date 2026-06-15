'use strict';

// Pragmatic email format check (not full RFC 5322). It covers the vast
// majority of real-world addresses while staying readable and dependency-free.
//
// Pattern breakdown:
//   ^[^\s@]+   local part: one or more chars that are not whitespace or "@"
//   @          a single required "@" separator
//   [^\s@]+    domain name: one or more chars that are not whitespace or "@"
//   \.         a literal dot before the TLD (so "user@localhost" is rejected)
//   [^\s@.]+$  TLD: one or more chars that are not whitespace, "@", or "."
//
// The "no whitespace and no @" character classes implicitly reject the common
// failure modes: missing local part, missing domain, double "@", and spaces.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@.]+$/;

// Maximum total length of an email address per RFC 5321 (section 4.5.3.1.3).
// Bounding the length keeps work linear-but-small and rejects absurd inputs
// before they reach the (repeated) string scans below.
const MAX_EMAIL_LENGTH = 254;

/**
 * Returns true if the string is a syntactically valid email address.
 *
 * @param {string} email - the raw email string to test
 * @returns {boolean}
 */
function isValidFormat(email) {
  // Guard against non-strings so the regex test never throws on null/number/etc.
  // Callers (validate()) classify *why* input is bad; here we only answer
  // the yes/no format question, so any non-string is simply "not valid".
  if (typeof email !== 'string') {
    return false;
  }

  // Reject over-length input. Defensive duplicate of validate()'s check so the
  // helper is safe to call standalone (validate() reports a distinct reason).
  if (email.length > MAX_EMAIL_LENGTH) {
    return false;
  }

  // Reject leading/trailing dots in local part or domain that the regex alone
  // would otherwise allow (e.g. ".a@b.com" or "a@b.com." has a dot adjacent
  // to "@" or string boundary). These are invalid per common practice.
  if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
    return false;
  }

  // A dot immediately before or after "@" (".@" or "@.") is also invalid.
  if (email.includes('.@') || email.includes('@.')) {
    return false;
  }

  return EMAIL_PATTERN.test(email);
}

module.exports = { isValidFormat, MAX_EMAIL_LENGTH };
