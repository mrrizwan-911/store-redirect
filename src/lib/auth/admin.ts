export const ADMIN_EMAILS = [
  'admin@store.com',
  'admin@antigravity.com',
]

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
