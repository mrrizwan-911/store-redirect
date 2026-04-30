import { db } from '@/lib/db/client'

export interface GetCustomersParams {
  page?: number
  limit?: number
  search?: string
}

export async function getCustomers({ page = 1, limit = 20, search }: GetCustomersParams = {}) {
  const skip = (page - 1) * limit
  const whereClause: any = { role: 'CUSTOMER' }

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where: whereClause,
      include: {
        orders: {
          select: { total: true },
          where: { status: { not: 'CANCELLED' } }
        },
        loyalty: { select: { tier: true, points: true } }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    db.user.count({ where: whereClause })
  ])

  const customers = users.map(user => {
    const ltv = user.orders.reduce((sum, order) => sum + Number(order.total), 0)
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
      orderCount: user.orders.length,
      ltv,
      tier: user.loyalty?.tier || 'BRONZE',
      points: user.loyalty?.points || 0
    }
  })

  return {
    customers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
}

export async function getCustomerById(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    include: {
      addresses: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        include: {
          payment: { select: { method: true, status: true } },
          _count: { select: { items: true } }
        }
      },
      loyalty: true
    }
  })

  if (!user) return null

  const ltv = user.orders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + Number(o.total), 0)

  return {
    ...user,
    ltv
  }
}
