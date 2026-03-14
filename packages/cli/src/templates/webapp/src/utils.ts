/**
 * Server-side utility functions for {{projectName}}.
 */

/** Get the current user's email address. */
export function getCurrentUserEmail(): string {
  return Session.getActiveUser().getEmail();
}

/** Log a server-side message. */
export function log(message: string): void {
  Logger.log(`[{{projectName}}] ${message}`);
}
