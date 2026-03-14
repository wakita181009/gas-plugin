/**
 * Utility functions for {{projectName}}.
 */

/** Get the current date formatted as a string. */
export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Log a message with a timestamp prefix. */
export function log(message: string): void {
  Logger.log(`[${formatDate()}] ${message}`);
}
