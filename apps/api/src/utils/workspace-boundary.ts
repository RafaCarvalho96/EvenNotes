import path from 'node:path'

/**
 * Thrown when a resolved path escapes the configured workspace root.
 * Maps to HTTP 403 Forbidden.
 */
export class WorkspaceBoundaryError extends Error {
  readonly statusCode = 403

  constructor(message = 'Path traversal detected: path must be inside workspace root') {
    super(message)
    this.name = 'WorkspaceBoundaryError'
  }
}

/**
 * Resolves `userPath` relative to `base` and ensures the result stays within `base`.
 *
 * @param base     Absolute workspace root directory.
 * @param userPath Path supplied by the user (relative or absolute).
 * @returns        The resolved absolute path, guaranteed to be inside `base`.
 * @throws {WorkspaceBoundaryError} When the resolved path escapes the workspace root.
 */
export function resolveWorkspacePath(base: string, userPath: string): string {
  const resolvedBase = path.resolve(base)
  const resolvedFull = path.resolve(base, userPath)

  const isInside =
    resolvedFull === resolvedBase ||
    resolvedFull.startsWith(resolvedBase + path.sep)

  if (!isInside) {
    throw new WorkspaceBoundaryError()
  }

  return resolvedFull
}
