export const ADMIN_EMAILS = [
  'admin@calnza.com',
]

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
