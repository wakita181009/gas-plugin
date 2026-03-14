/**
 * {{projectName}} - GAS Library
 *
 * This module exports functions that can be used as a Google Apps Script library.
 * Other GAS projects can add this as a library dependency and call these functions.
 */

/** Add two numbers together. */
function add(a: number, b: number): number {
  return a + b;
}

/** Multiply two numbers together. */
function multiply(a: number, b: number): number {
  return a * b;
}

/** Format a value as a currency string. */
function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}
