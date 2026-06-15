'use strict';

const { isValidFormat, MAX_EMAIL_LENGTH } = require('./formatValidator');
const { isDisposable } = require('./disposableChecker');

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid        - true if the address is syntactically valid
 * @property {string}  reason       - "valid" | "not_a_string" | "empty" | "too_long" | "invalid_format"
 * @property {boolean} isDisposable - true if the domain is a disposable provider
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
    return { valid: false, reason: 'not_a_string', isDisposable: false };
  }

  // We trim surrounding whitespace and validate the trimmed value, so input
  // like "  user@gmail.com  " is accepted (convenient for form-sourced data).
  // The returned object is a result, not the normalized address, so we don't
  // hand the trimmed string back to the caller.
  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return { valid: false, reason: 'empty', isDisposable: false };
  }

  // Reject over-length addresses with a distinct reason (isValidFormat() also
  // guards length, but would collapse this into the generic invalid_format).
  if (trimmed.length > MAX_EMAIL_LENGTH) {
    return { valid: false, reason: 'too_long', isDisposable: false };
  }

  if (!isValidFormat(trimmed)) {
    return { valid: false, reason: 'invalid_format', isDisposable: false };
  }

  // Per the agreed precedence rule: a disposable address is still VALID.
  // isDisposable is an independent flag, not a failure condition. We only
  // evaluate it once we know the address is well-formed.
  return {
    valid: true,
    reason: 'valid',
    isDisposable: isDisposable(trimmed),
  };
}

module.exports = { validate };
