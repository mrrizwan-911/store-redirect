import { db } from '@/lib/db/client'
import { OrderStatus } from '@prisma/client'

export interface GetOrdersParams {
  page?: number
  limit?: number
  status?: string
  search?: string
}

export async function getOrders({ page = 1, limit = 20, status, search }: GetOrdersParams = {}) {
  const skip = (page - 1) * limit
  const whereClause: any = {}

  if (status) {
    whereClause.status = status as OrderStatus
  }

  if (search) {
    whereClause.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, email: true } },
        payment: { select: { method: true, status: true } },
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.order.count({ where: whereClause })
  ])

  return {
    orders: orders.map(o => ({
      ...o,
      itemCount: o._count.items
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
}
