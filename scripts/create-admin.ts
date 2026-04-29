import { loadEnvConfig } from '@next/env'
// Load environment variables from .env and .env.local automatically, just like Next.js does
loadEnvConfig(process.cwd())

import { db } from '../src/lib/db/client'
import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

async function main() {
  const args = process.argv.slice(2)
  if (args.length !== 3) {
    console.error('Usage: npm run create-admin <name> <email> <password>')
    process.exit(1)
  }

  const [name, email, password] = args

  if (password.length < 8) {
    console.error('Password must be at least 8 characters long.')
    process.exit(1)
  }

  try {
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.error(`User with email ${email} already exists.`)
      process.exit(1)
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const admin = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: Role.ADMIN,
        isVerified: true,
      },
    })

    console.log(`✅ Admin user created successfully!`)
    console.log(`Name: ${admin.name}`)
    console.log(`Email: ${admin.email}`)
    console.log(`Role: ${admin.role}`)

  } catch (error) {
    console.error('Failed to create admin user:', error)
    process.exit(1)
  }
}

main()