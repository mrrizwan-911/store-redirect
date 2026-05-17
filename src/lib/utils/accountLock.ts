import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()
const MAX_ATTEMPTS = 5
const LOCKOUT_SECONDS = 15 * 60  // 15 minutes

export async function recordFailedLogin(email: string): Promise<number> {
  const key = `lockout:${email}`
  const attempts = await redis.incr(key)
  if (attempts === 1) {
    // Set expiry on first failure
    await redis.expire(key, LOCKOUT_SECONDS)
  }
  return attempts
}

export async function isAccountLocked(email: string): Promise<boolean> {
  const key = `lockout:${email}`
  const attempts = await redis.get<number>(key)
  return (attempts ?? 0) >= MAX_ATTEMPTS
}

export async function clearFailedLogins(email: string): Promise<void> {
  await redis.del(`lockout:${email}`)
}
