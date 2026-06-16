'use strict';

const {
  isValidFormat,
  MAX_EMAIL_LENGTH,
  CONTROL_CHARS,
} = require('./formatValidator');
const { isDisposable } = require('./disposableChecker');

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid        - true if the address is syntactically valid
 * @property {string}  reason       - "valid" | "not_a_string" | "empty" | "too_long" | "control_char" | "malformed_unicode" | "invalid_format"
 * @property {boolean} isDisposable - true if the domain is a disposable provider
 * @property {string|null} normalized - the trimmed value that was validated (the
 *   address callers should persist when valid), or null for non-string input
 */

/**
 * Validates an email address: checks syntactic format and disposable-provider
 * status, returning a structured result. Never throws — invalid input is
 * reported via the returned object.
 *
 * @param {string} email - the email address to validate
 * @returns {ValidationResult}
 */
function validate(email) {
  // Distinguish "wrong type" from "empty string" so callers get a precise
  // reason. isValidFormat() would return false for both, but we want the
  // reason codes to differ.
  if (typeof email !== 'string') {
    return {
      valid: false,
      reason: 'not_a_string',
      isDisposable: false,
      normalized: null,
    };
  }

  // We trim surrounding whitespace and validate the trimmed value, so input
  // like "  user@gmail.com  " is accepted (convenient for form-sourced data).
  // We return this trimmed value as `normalized` so callers persist exactly the
  // string we validated, not the padded original.
  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return { valid: false, reason: 'empty', isDisposable: false, normalized: trimmed };
  }

  // Reject over-length addresses with a distinct reason (isValidFormat() also
  // guards length, but would collapse this into the generic invalid_format).
  if (trimmed.length > MAX_EMAIL_LENGTH) {
    return { valid: false, reason: 'too_long', isDisposable: false, normalized: trimmed };
  }

  // Reject control characters and malformed UTF-16 before the format check.
  // Both pass the format regex but are a real downstream hazard (injection / NUL
  // truncation, or strings that cannot be encoded to UTF-8). We give them
  // distinct reasons so callers can tell a hostile input from a mistyped one.
  if (CONTROL_CHARS.test(trimmed)) {
    return { valid: false, reason: 'control_char', isDisposable: false, normalized: trimmed };
  }
  if (typeof trimmed.isWellFormed === 'function' && !trimmed.isWellFormed()) {
    return { valid: false, reason: 'malformed_unicode', isDisposable: false, normalized: trimmed };
  }

  if (!isValidFormat(trimmed)) {
    return { valid: false, reason: 'invalid_format', isDisposable: false, normalized: trimmed };
  }

  // Per the agreed precedence rule: a disposable address is still VALID.
  // isDisposable is an independent flag, not a failure condition. We only
  // evaluate it once we know the address is well-formed.
  return {
    valid: true,
    reason: 'valid',
    isDisposable: isDisposable(trimmed),
    normalized: trimmed,
  };
}

module.exports = { validate };
