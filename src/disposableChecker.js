'use strict';

// The list is loaded once at module load. Node caches require() results, so
// repeated imports of this module reuse the same array (no repeated disk reads).
const disposableDomains = require('./data/disposable-domains.json');

// Build a Set for O(1) membership checks instead of scanning the array on every
// call. Entries are already lowercase in the JSON, but we normalize defensively
// so a stray uppercase entry in the data file can't cause a missed match.
const DISPOSABLE_SET = new Set(
  disposableDomains.map((domain) => domain.toLowerCase())
);

/**
 * Extracts the (lowercased) domain portion of an email address.
 *
 * @param {string} email - the raw email string
 * @returns {string|null} the domain after the last "@", or null if absent
 */
function extractDomain(email) {
  if (typeof email !== 'string') {
    return null;
  }

  // Use lastIndexOf so that, in the rare malformed case of multiple "@", we
  // take everything after the final one as the domain. Format validation
  // happens elsewhere; this function's only job is to pull out the domain.
  const atIndex = email.lastIndexOf('@');

  // No "@", or "@" is the last character (empty domain) -> no usable domain.
  if (atIndex === -1 || atIndex === email.length - 1) {
    return null;
  }

  return email.slice(atIndex + 1).toLowerCase();
}

/**
 * Returns true if the email's domain is a known disposable provider.
 * Matches both the exact domain and any subdomain of it
 * (e.g. "x.mailinator.com" matches the listed "mailinator.com").
 *
 * @param {string} email - the raw email string
 * @returns {boolean}
 */
function isDisposable(email) {
  const domain = extractDomain(email);
  if (domain === null) {
    return false;
  }

  // Exact match first (the common case).
  if (DISPOSABLE_SET.has(domain)) {
    return true;
  }

  // Subdomain match: walk up the domain labels and check each parent suffix.
  // For "foo.bar.mailinator.com" we test "bar.mailinator.com", then
  // "mailinator.com" -> hit. Anchoring on the leading "." ensures we only
  // match true subdomains, never a domain that merely *ends* with the text
  // (e.g. "notmailinator.com" must NOT match "mailinator.com").
  for (let i = domain.indexOf('.'); i !== -1; i = domain.indexOf('.', i + 1)) {
    const suffix = domain.slice(i + 1);
    if (DISPOSABLE_SET.has(suffix)) {
      return true;
    }
  }

  return false;
}

module.exports = { isDisposable, extractDomain };
