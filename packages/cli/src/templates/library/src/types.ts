/**
 * Type definitions for {{projectName}} library.
 */

/** Configuration options for the library. */
export interface LibraryConfig {
  /** Enable debug logging. */
  debug: boolean;
  /** Default locale for formatting. */
  locale: string;
}

/** Result type for library operations. */
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
