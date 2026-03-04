// msisdnUtils.js
// Utility functions for generating and managing MSISDNs and party IDs for DFSPs

/**
 * Generate a random MSISDN given a prefix and a desired length.
 * @param {string} prefix - The MSISDN prefix (e.g., '2547').
 * @param {number} length - The total length of the MSISDN (including prefix).
 * @returns {string} - Randomly generated MSISDN.
 */
export function generateRandomMsisdn(prefix, length) {
  if (length <= prefix.length) {
    throw new Error(`Length (${length}) must be greater than prefix length (${prefix.length})`);
  }
  const digits = length - prefix.length;
  let msisdn = prefix;
  for (let i = 0; i < digits; i++) {
    msisdn += Math.floor(Math.random() * 10);
  }
  return msisdn;
}

/**
 * Generate a set of unique MSISDNs for a DFSP.
 * @param {string} prefix - The MSISDN prefix.
 * @param {number} count - Number of MSISDNs to generate.
 * @param {number} length - Total length of each MSISDN.
 * @returns {string[]} - Array of unique MSISDNs.
 */
export function generateMsisdnSet(prefix, count, length) {
  const msisdns = new Set();
  const digits = length - prefix.length;

  if (digits < 0) {
    throw new Error(
      `Cannot generate MSISDNs: total length ${length} is shorter than prefix "${prefix}" (length ${prefix.length}).`
    );
  }

  const maxUniqueMsisdns = digits === 0 ? 1 : Math.pow(10, digits);

  if (count > maxUniqueMsisdns) {
    throw new Error(
      `Cannot generate ${count} unique MSISDN(s) with prefix "${prefix}" and length ${length}. ` +
      `Maximum possible unique MSISDNs is ${maxUniqueMsisdns}.`
    );
  }

  const maxAttempts = maxUniqueMsisdns * 5;
  let attempts = 0;

  while (msisdns.size < count && attempts < maxAttempts) {
    msisdns.add(generateRandomMsisdn(prefix, length));
    attempts++;
  }

  if (msisdns.size < count) {
    throw new Error(
      `Failed to generate ${count} unique MSISDN(s) with prefix "${prefix}" and length ${length} ` +
      `after ${attempts} attempts. Consider using a shorter prefix or requesting fewer MSISDNs.`
    );
  }
  return Array.from(msisdns);
}

/**
 * Get a random item from an array, optionally excluding a set of items.
 * @param {Array} arr - The array to pick from.
 * @param {Set} [exclude] - Set of items to exclude.
 * @returns {*} - Random item from array not in exclude.
 */
export function getRandomItemExcluding(arr, exclude = new Set()) {
  const filtered = arr.filter(x => !exclude.has(x));
  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}
