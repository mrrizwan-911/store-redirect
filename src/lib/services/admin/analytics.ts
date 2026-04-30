import { db } from '@/lib/db/client'
import { unstable_cache } from 'next/cache'

export const getRevenueStats = unstable_cache(
  async () => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    const [todayStats, monthStats, ytdStats, byPaymentMethod, activeOrders] = await Promise.all([
      db.payment.aggregate({
        where: { status: 'COMPLETED', paidAt: { gte: startOfToday } },
        _sum: { amount: true },
        _count: true,
      }),
      db.payment.aggregate({
        where: { status: 'COMPLETED', paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      db.payment.aggregate({
        where: { status: 'COMPLETED', paidAt: { gte: startOfYear } },
        _sum: { amount: true },
        _count: true,
      }),
      db.payment.groupBy({
        by: ['method'],
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
      db.order.count({
        where: { status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] } },
      }),
    ])

    return {
      today: { revenue: Number(todayStats._sum.amount ?? 0), orders: todayStats._count },
      thisMonth: { revenue: Number(monthStats._sum.amount ?? 0), orders: monthStats._count },
      ytd: { revenue: Number(ytdStats._sum.amount ?? 0), orders: ytdStats._count },
      activeOrders,
      byPaymentMethod: byPaymentMethod.map(m => ({
        method: m.method,
        revenue: Number(m._sum.amount ?? 0),
        count: m._count,
      })),
    }
  },
  ['admin-revenue-stats'],
  { revalidate: 600, tags: ['analytics'] }
)

export const getOrdersByStatus = unstable_cache(
  async () => {
    const statusCounts = await db.order.groupBy({
      by: ['status'],
      _count: true,
    })

    return statusCounts.map(item => ({
      status: item.status,
      count: item._count,
    }))
  },
  ['admin-orders-by-status'],
  { revalidate: 600, tags: ['analytics'] }
)

export const getTopProducts = unstable_cache(
  async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Use raw query for correct SUM(price * quantity) and better performance
    // We join with Order to filter by date/status, and Product/Category for display info
    const topProductsRaw = await db.$queryRaw<any[]>`
      SELECT
        oi."productId",
        p.name,
        c.name as "category",
        SUM(oi.quantity)::int as "unitsSold",
        SUM(oi.price * oi.quantity)::float as "revenue"
      FROM "OrderItem" oi
      JOIN "Order" o ON oi."orderId" = o.id
      JOIN "Product" p ON oi."productId" = p.id
      JOIN "Category" c ON p."categoryId" = c.id
      WHERE o."createdAt" >= ${thirtyDaysAgo} AND o.status != 'CANCELLED'
      GROUP BY oi."productId", p.name, c.name
      ORDER BY "unitsSold" DESC
      LIMIT 10
    `

    if (topProductsRaw.length === 0) return []

    // Still need aggregate stock from variants
    const productIds = topProductsRaw.map(p => p.productId)
    const variants = await db.productVariant.findMany({
      where: { productId: { in: productIds } },
      select: { productId: true, stock: true }
    })

    const stockMap = new Map<string, number>()
    variants.forEach(v => {
      stockMap.set(v.productId, (stockMap.get(v.productId) || 0) + v.stock)
    })

    return topProductsRaw.map(raw => ({
      productId: raw.productId,
      name: raw.name,
      category: raw.category,
      stock: stockMap.get(raw.productId) || 0,
      unitsSold: raw.unitsSold,
      revenue: raw.revenue,
    }))
  },
  ['admin-top-products'],
  { revalidate: 600, tags: ['analytics'] }
)

export const getAbandonedCartStats = unstable_cache(
  async () => {
    const now = new Date()
    const sixtyMinsAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // 1. Total abandoned carts count
    const count = await db.cart.count({
      where: {
        lastActiveAt: { lt: sixtyMinsAgo },
        items: { some: {} },
      },
    })

    // 2. Potential revenue calculation via raw SQL for performance
    const potentialRevenueRaw = await db.$queryRaw<any[]>`
      SELECT SUM(ci.quantity * COALESCE(p."salePrice", p."basePrice"))::float as "total"
      FROM "CartItem" ci
      JOIN "Cart" c ON ci."cartId" = c.id
      JOIN "Product" p ON ci."productId" = p.id
      WHERE c."lastActiveAt" < ${sixtyMinsAgo}
    `
    const potentialRevenue = potentialRevenueRaw[0]?.total || 0

    // 3. Top abandoned items (by frequency)
    const topAbandoned = await db.$queryRaw<any[]>`
      SELECT p.name, COUNT(*)::int as "count"
      FROM "CartItem" ci
      JOIN "Cart" c ON ci."cartId" = c.id
      JOIN "Product" p ON ci."productId" = p.id
      WHERE c."lastActiveAt" < ${sixtyMinsAgo}
      GROUP BY p.name
      ORDER BY "count" DESC
      LIMIT 5
    `

    return {
      count,
      potentialRevenue,
      topAbandoned,
    }
  },
  ['admin-abandoned-cart-stats'],
  { revalidate: 600, tags: ['analytics'] }
)
