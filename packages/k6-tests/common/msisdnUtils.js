// msisdnUtils.js
// Utility functions for generating and managing MSISDNs and party IDs for DFSPs

/**
 * Generate a random MSISDN given a prefix and a desired length.
 * @param {string} prefix - The MSISDN prefix (e.g., '2547').
 * @param {number} length - The total length of the MSISDN (including prefix).
 * @returns {string} - Randomly generated MSISDN.
 */
export function generateRandomMsisdn(prefix, length) {
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
  while (msisdns.size < count) {
    msisdns.add(generateRandomMsisdn(prefix, length));
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
