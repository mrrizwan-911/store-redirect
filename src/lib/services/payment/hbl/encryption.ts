import crypto from 'crypto'

/**
 * AES-256-CBC encryption for HBL v2 gateway parameters.
 * HBL provides the encryption key and IV during onboarding if v2 is required.
 */

/**
 * Encrypts a string using AES-256-CBC.
 */
export function encryptHBLParam(
  plaintext: string,
  keyHex: string,
  ivHex: string
): string {
  const key = Buffer.from(keyHex, 'hex')
  const iv = Buffer.from(ivHex, 'hex')

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  return encrypted
}

/**
 * Decrypts a string using AES-256-CBC.
 */
export function decryptHBLParam(
  ciphertext: string,
  keyHex: string,
  ivHex: string
): string {
  const key = Buffer.from(keyHex, 'hex')
  const iv = Buffer.from(ivHex, 'hex')

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  let decrypted = decipher.update(ciphertext, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
