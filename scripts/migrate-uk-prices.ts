import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set')

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const db = new PrismaClient({ adapter })

async function main() {
  console.log('Migrating product prices to 10 pounds...')
  
  await db.product.updateMany({
    data: {
      basePrice: 10,
      priceUK: 10,
    }
  })

  await db.productVariant.updateMany({
    data: {
      price: 10,
      priceUK: 10,
    }
  })

  console.log('Migration completed successfully.')
}

main().catch(console.error).finally(() => db.$disconnect())
