export function isSafeInternalPath(path?: string | null): path is string {
  if (!path) return false
  if (!path.startsWith('/')) return false
  if (path.startsWith('//')) return false
  return !path.includes('\\')
}
