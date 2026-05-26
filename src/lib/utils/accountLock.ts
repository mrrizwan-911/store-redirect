import redis from '@/lib/redis'

const MAX_ATTEMPTS = 5
const LOCKOUT_SECONDS = 15 * 60  // 15 minutes

export async function recordFailedLogin(email: string): Promise<number> {
  if (!redis) return 0

  const key = `lockout:${email}`
  const attempts = await redis.incr(key)
  if (attempts === 1) {
    // Set expiry on first failure
    await redis.expire(key, LOCKOUT_SECONDS)
  }
  return attempts
}

export async function isAccountLocked(email: string): Promise<boolean> {
  if (!redis) return false

  const key = `lockout:${email}`
  const attempts = await redis.get<number>(key)
  return (attempts ?? 0) >= MAX_ATTEMPTS
}

export async function clearFailedLogins(email: string): Promise<void> {
  if (!redis) return

  await redis.del(`lockout:${email}`)
}
