function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function bytesToBase64Url(bytes: ArrayBuffer) {
  const binary = String.fromCharCode(...new Uint8Array(bytes))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function verifyJwtAtEdge(token: string) {
  const secret = process.env.JWT_ACCESS_SECRET
  if (!secret) return null

  const [header, payload, signature] = token.split('.')
  if (!header || !payload || !signature) return null

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signed = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${header}.${payload}`)
  )

  if (bytesToBase64Url(signed) !== signature) return null

  const decoded = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload)))
  if (decoded.exp && decoded.exp * 1000 < Date.now()) return null
  return decoded
}
