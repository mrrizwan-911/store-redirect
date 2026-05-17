import { db } from '@/lib/db/client'
import { Prisma } from '@prisma/client'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dateRange(start: Date, end: Date) {
  return { gte: start, lte: end }
}

function changePct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

/**
 * Prisma WHERE clause for the `country` field on Order.
 *
 * Order.country values: "pk" | "uk" | "both"
 *   "both"  = product/order available in both regions
 *
 * Region param behaviour:
 *   "pk"  → country IN ['pk', 'both']
 *   "uk"  → country IN ['uk', 'both']
 *   "all" / null → no filter (all rows)
 */
function countryFilter(region?: string | null): object {
  if (!region || region === 'all') return {}
  if (region === 'pk') return { address: { country: { in: ['pk', 'both'] } } }
  if (region === 'uk') return { address: { country: { in: ['uk', 'both'] } } }
  return {}
}

/**
 * Raw SQL WHERE fragment for the `country` field.
 * Safe: no user input is interpolated — region is always checked
 * against a fixed allow-list before this function is called.
 */
function countrySQL(region?: string | null): string {
  if (!region || region === 'all') return ''
  if (region === 'pk') return `AND a.country IN ('pk','both')`
  if (region === 'uk') return `AND a.country IN ('uk','both')`
  return ''
}

// ─── Existing: Abandoned Cart (kept exactly) ─────────────────────────────────

export async function getAbandonedCartStats() {
  const now = new Date()
  const sixtyMinsAgo = new Date(now.getTime() - 60 * 60 * 1000)

  const count = await db.cart.count({
    where: { lastActiveAt: { lt: sixtyMinsAgo }, items: { some: {} } },
  })

  const potentialRevenueRaw = await db.$queryRaw<{ total: number }[]>`
    SELECT SUM(ci.quantity * COALESCE(p."salePrice", p."basePrice"))::float AS "total"
    FROM "CartItem" ci
    JOIN "Cart"    c ON ci."cartId"    = c.id
    JOIN "Product" p ON ci."productId" = p.id
    WHERE c."lastActiveAt" < ${sixtyMinsAgo}
  `
  const potentialRevenue = potentialRevenueRaw[0]?.total || 0

  const topAbandoned = await db.$queryRaw<{ name: string; count: number }[]>`
    SELECT p.name, COUNT(*)::int AS "count"
    FROM "CartItem" ci
    JOIN "Cart"    c ON ci."cartId"    = c.id
    JOIN "Product" p ON ci."productId" = p.id
    WHERE c."lastActiveAt" < ${sixtyMinsAgo}
    GROUP BY p.name
    ORDER BY "count" DESC
    LIMIT 5
  `

  return { count, potentialRevenue, topAbandoned }
}

// ─── 1. KPI Summary ───────────────────────────────────────────────────────────

export async function getKpiSummary(options: {
  startDate: Date
  endDate: Date
  compareStart: Date
  compareEnd: Date
  region?: string | null
}) {
  const { startDate, endDate, compareStart, compareEnd, region } = options
  const cf = countryFilter(region)

  const [
    curRevRaw, prevRevRaw,
    curOrders, prevOrders,
    curCustomers, prevCustomers,
    activeOrders,
    totalCarts, abandonedCarts,
  ] = await Promise.all([
    db.payment.aggregate({
      where: { status: 'COMPLETED', paidAt: dateRange(startDate, endDate), order: { ...cf } },
      _sum: { amount: true },
    }),
    db.payment.aggregate({
      where: { status: 'COMPLETED', paidAt: dateRange(compareStart, compareEnd), order: { ...cf } },
      _sum: { amount: true },
    }),
    db.order.count({ where: { createdAt: dateRange(startDate, endDate), ...cf } }),
    db.order.count({ where: { createdAt: dateRange(compareStart, compareEnd), ...cf } }),
    db.user.count({ where: { role: 'CUSTOMER', createdAt: dateRange(startDate, endDate) } }),
    db.user.count({ where: { role: 'CUSTOMER', createdAt: dateRange(compareStart, compareEnd) } }),
    db.order.count({
      where: { status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] }, ...cf },
    }),
    db.cart.count({ where: { items: { some: {} } } }),
    db.cart.count({
      where: { lastActiveAt: { lt: new Date(Date.now() - 60 * 60 * 1000) }, items: { some: {} } },
    }),
  ])

  const curRevenue  = Number(curRevRaw._sum.amount ?? 0)
  const prevRevenue = Number(prevRevRaw._sum.amount ?? 0)
  const curAov      = curOrders  > 0 ? curRevenue  / curOrders  : 0
  const prevAov     = prevOrders > 0 ? prevRevenue / prevOrders : 0
  const cartAbandonRate = totalCarts > 0
    ? Math.round((abandonedCarts / totalCarts) * 1000) / 10
    : 0

  const repeatUsers = await db.order.groupBy({
    by: ['userId'],
    where: { userId: { not: null }, ...cf },
    _count: true,
    having: { userId: { _count: { gt: 1 } } },
  })
  const allOrderUsers = await db.order.groupBy({
    by: ['userId'],
    where: { userId: { not: null }, ...cf },
    _count: true,
  })
  const repeatRate = allOrderUsers.length > 0
    ? Math.round((repeatUsers.length / allOrderUsers.length) * 1000) / 10
    : 0

  return {
    revenue:       { current: curRevenue,  previous: prevRevenue, changePct: changePct(curRevenue, prevRevenue) },
    orders:        { current: curOrders,   previous: prevOrders,  changePct: changePct(curOrders, prevOrders) },
    aov:           { current: curAov,      previous: prevAov,     changePct: changePct(curAov, prevAov) },
    newCustomers:  { current: curCustomers, previous: prevCustomers, changePct: changePct(curCustomers, prevCustomers) },
    repeatRate:    { current: repeatRate, previous: 0, changePct: 0 },
    cartAbandonRate: { current: cartAbandonRate, previous: 0, changePct: 0 },
    activeOrders,
  }
}

// ─── 2. Revenue Time-Series ───────────────────────────────────────────────────

export async function getRevenueSeries(options: {
  startDate: Date
  endDate: Date
  granularity: 'day' | 'week' | 'month'
  region?: string | null
}) {
  const { startDate, endDate, granularity } = options
  const trunc = granularity === 'month' ? 'month' : granularity === 'week' ? 'week' : 'day'
  const truncSql = Prisma.raw(`DATE_TRUNC('${trunc}', p."paidAt")`)

  // Always return all three series so the chart can show pk / uk / global lines.
  // "both" orders count toward BOTH pk and uk revenue.
  const rows = await db.$queryRaw<{
    date: Date; pk: number; uk: number; global_rev: number; total: number
  }[]>`
    SELECT
      ${truncSql}                                                               AS date,
      SUM(CASE WHEN a.country IN ('pk','both') THEN p.amount ELSE 0 END)::float AS pk,
      SUM(CASE WHEN a.country IN ('uk','both') THEN p.amount ELSE 0 END)::float AS uk,
      SUM(CASE WHEN a.country NOT IN ('pk','uk','both') OR a.country IS NULL
               THEN p.amount ELSE 0 END)::float                                  AS global_rev,
      SUM(p.amount)::float                                                        AS total
    FROM "Payment" p
    JOIN "Order" o ON p."orderId" = o.id
    JOIN "Address" a ON o."addressId" = a.id
    WHERE p.status   = 'COMPLETED'
      AND p."paidAt" >= ${startDate}
      AND p."paidAt" <= ${endDate}
    GROUP BY ${truncSql}
    ORDER BY date ASC
  `

  return rows.map(r => ({
    date:   r.date.toISOString().split('T')[0],
    pk:     Number(r.pk     || 0),
    uk:     Number(r.uk     || 0),
    global: Number(r.global_rev || 0),
    total:  Number(r.total  || 0),
  }))
}

// ─── 3. Orders by Country ─────────────────────────────────────────────────────

export async function getOrdersByRegion(options: {
  startDate: Date
  endDate: Date
}) {
  const { startDate, endDate } = options

  const rows = await db.$queryRaw<{
    country: string; count: number; revenue: number; avgOrderValue: number
  }[]>`
    SELECT
      COALESCE(a.country, 'pk')              AS country,
      COUNT(*)::int                          AS count,
      COALESCE(SUM(p.amount), 0)::float      AS revenue,
      COALESCE(AVG(p.amount), 0)::float      AS "avgOrderValue"
    FROM "Order" o
    LEFT JOIN "Address" a ON o."addressId" = a.id
    LEFT JOIN "Payment" p ON p."orderId" = o.id AND p.status = 'COMPLETED'
    WHERE o."createdAt" >= ${startDate}
      AND o."createdAt" <= ${endDate}
    GROUP BY COALESCE(a.country, 'pk')
    ORDER BY count DESC
  `


  return rows.map(r => ({
    region: r.country,          // "pk" | "uk" | "both"
    count:  Number(r.count),
    revenue: Number(r.revenue),
    avgOrderValue: Number(r.avgOrderValue),
  }))
}

// ─── 4. Category Performance ─────────────────────────────────────────────────

export async function getCategoryPerformance(options: {
  startDate: Date
  endDate: Date
  region?: string | null
  parentId?: string | null
}) {
  const { startDate, endDate, region, parentId } = options
  const regionCond = countrySQL(region)
  const parentCond = parentId == null
    ? `AND c."parentId" IS NULL`
    : `AND c."parentId" = '${parentId.replace(/'/g, "''")}'`

  const rows = await db.$queryRaw<{
    categoryId: string; name: string; parentId: string | null
    revenue: number; units: number; aov: number
  }[]>`
    SELECT
      c.id                                             AS "categoryId",
      c.name,
      c."parentId",
      COALESCE(SUM(oi.price * oi.quantity), 0)::float AS revenue,
      COALESCE(SUM(oi.quantity),             0)::int   AS units,
      COALESCE(AVG(oi.price),                0)::float AS aov
    FROM "Category" c
    LEFT JOIN "Product"   p  ON p."categoryId" = c.id
    LEFT JOIN "OrderItem" oi ON oi."productId" = p.id
    LEFT JOIN "Order"     o  ON oi."orderId"   = o.id
      AND o."createdAt" >= ${startDate}
      AND o."createdAt" <= ${endDate}
      AND o.status != 'CANCELLED'
    LEFT JOIN "Address"   a  ON o."addressId"  = a.id
      ${regionCond ? Prisma.raw(regionCond) : Prisma.empty}
    WHERE 1=1
      ${Prisma.raw(parentCond)}
    GROUP BY c.id, c.name, c."parentId"
    ORDER BY revenue DESC
  `

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0)

  return rows.map(r => ({
    categoryId: r.categoryId,
    name: r.name,
    parentId: r.parentId,
    revenue: Number(r.revenue),
    units:   Number(r.units),
    aov:     Number(r.aov),
    sharePct: totalRevenue > 0
      ? Math.round((r.revenue / totalRevenue) * 1000) / 10
      : 0,
  }))
}

// ─── 5. Product Analytics ─────────────────────────────────────────────────────

export async function getProductAnalytics(options: {
  startDate: Date
  endDate: Date
  region?: string | null
}) {
  const { startDate, endDate, region } = options
  const regionCond = countrySQL(region)

  const [topProductsRaw, allVariants, lowStockRaw] = await Promise.all([
    db.$queryRaw<{
      productId: string; name: string; category: string
      pkUnits: number; ukUnits: number; totalUnits: number; revenue: number
    }[]>`
      SELECT
        oi."productId",
        p.name,
        c.name                                                                    AS category,
        SUM(CASE WHEN a.country IN ('pk','both') THEN oi.quantity ELSE 0 END)::int AS "pkUnits",
        SUM(CASE WHEN a.country IN ('uk','both') THEN oi.quantity ELSE 0 END)::int AS "ukUnits",
        SUM(oi.quantity)::int                                                      AS "totalUnits",
        SUM(oi.price * oi.quantity)::float                                         AS revenue
      FROM "OrderItem" oi
      JOIN "Order"    o  ON oi."orderId"    = o.id
      JOIN "Address"  a  ON o."addressId"   = a.id
      JOIN "Product"  p  ON oi."productId"  = p.id
      JOIN "Category" c  ON p."categoryId"  = c.id
      WHERE o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
        AND o.status != 'CANCELLED'
        ${regionCond ? Prisma.raw(regionCond) : Prisma.empty}
      GROUP BY oi."productId", p.name, c.name
      ORDER BY "totalUnits" DESC
      LIMIT 20
    `,

    db.productVariant.findMany({ select: { productId: true, stock: true } }),

    db.$queryRaw<{ productId: string; name: string; stock: number }[]>`
      SELECT
        p.id   AS "productId",
        p.name,
        COALESCE(SUM(pv.stock), 0)::int AS stock
      FROM "Product" p
      LEFT JOIN "ProductVariant" pv ON pv."productId" = p.id
      WHERE p."isActive" = true
      GROUP BY p.id, p.name
      HAVING COALESCE(SUM(pv.stock), 0) < 10
      ORDER BY stock ASC
      LIMIT 20
    `,
  ])

  const stockMap = new Map<string, number>()
  for (const v of allVariants) {
    stockMap.set(v.productId, (stockMap.get(v.productId) ?? 0) + v.stock)
  }

  return {
    topProducts: topProductsRaw.map(r => ({
      productId:  r.productId,
      name:       r.name,
      category:   r.category,
      pkUnits:    Number(r.pkUnits),
      ukUnits:    Number(r.ukUnits),
      totalUnits: Number(r.totalUnits),
      revenue:    Number(r.revenue),
      stock:      stockMap.get(r.productId) ?? 0,
    })),
    lowStock: lowStockRaw.map(r => ({
      productId: r.productId,
      name:      r.name,
      stock:     Number(r.stock),
    })),
  }
}

// ─── 6. Customer Analytics ────────────────────────────────────────────────────

export async function getCustomerAnalytics(options: {
  startDate: Date
  endDate: Date
}) {
  const { startDate, endDate } = options

  const [totalUsers, newUsers, tierCounts, geographyRaw, loyaltyMonthlyRaw] =
    await Promise.all([
      db.user.count({ where: { role: 'CUSTOMER' } }),
      db.user.count({ where: { role: 'CUSTOMER', createdAt: dateRange(startDate, endDate) } }),
      db.loyaltyAccount.groupBy({ by: ['tier'], _count: true }),
      // Geography = delivery address country (separate from Order.country = pk/uk/both)
      db.$queryRaw<{ country: string; count: number; revenue: number }[]>`
        SELECT
          COALESCE(a.country, 'Unknown')      AS country,
          COUNT(DISTINCT o.id)::int           AS count,
          COALESCE(SUM(p.amount), 0)::float   AS revenue
        FROM "Order"   o
        LEFT JOIN "Address" a ON o."addressId" = a.id
        LEFT JOIN "Payment" p ON p."orderId"   = o.id AND p.status = 'COMPLETED'
        WHERE o."createdAt" >= ${startDate}
          AND o."createdAt" <= ${endDate}
        GROUP BY COALESCE(a.country, 'Unknown')
        ORDER BY count DESC
        LIMIT 15
      `,
      db.$queryRaw<{ month: string; issued: number; redeemed: number }[]>`
        SELECT
          TO_CHAR(DATE_TRUNC('month', le."createdAt"), 'Mon YY') AS month,
          SUM(CASE WHEN le.points > 0 THEN  le.points ELSE 0 END)::int     AS issued,
          ABS(SUM(CASE WHEN le.points < 0 THEN le.points ELSE 0 END))::int AS redeemed
        FROM "LoyaltyEvent" le
        WHERE le."createdAt" >= ${startDate}
          AND le."createdAt" <= ${endDate}
        GROUP BY DATE_TRUNC('month', le."createdAt")
        ORDER BY DATE_TRUNC('month', le."createdAt") ASC
      `,
    ])

  const churnRisk = await db.user.count({
    where: {
      role: 'CUSTOMER',
      orders: {
        none: { createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
      },
    },
  })

  return {
    total:          totalUsers,
    newCount:       newUsers,
    returningCount: totalUsers - newUsers,
    churnRisk,
    byTier:    tierCounts.map(t => ({ tier: t.tier, count: t._count })),
    geography: geographyRaw.map(g => ({
      country: g.country,
      count:   Number(g.count),
      revenue: Number(g.revenue),
    })),
    loyaltyPointsMonthly: loyaltyMonthlyRaw.map(r => ({
      month:    r.month,
      issued:   Number(r.issued),
      redeemed: Number(r.redeemed),
    })),
  }
}

// ─── 7. Marketing Analytics ───────────────────────────────────────────────────

export async function getMarketingAnalytics(options: {
  startDate: Date
  endDate: Date
}) {
  const { startDate, endDate } = options

  const [totalSubs, newSubs, unsubscribed, bySource, emailLogs, couponPerf, growthRaw] =
    await Promise.all([
      db.subscriber.count({ where: { status: 'ACTIVE' } }),
      db.subscriber.count({ where: { status: 'ACTIVE', createdAt: dateRange(startDate, endDate) } }),
      db.subscriber.count({ where: { status: 'UNSUBSCRIBED' } }),
      db.subscriber.groupBy({ by: ['source'], where: { status: 'ACTIVE' }, _count: true }),
      db.$queryRaw<{ type: string; sent: number; opened: number; clicked: number }[]>`
        SELECT
          type,
          COUNT(*)::int          AS sent,
          COUNT("openedAt")::int AS opened,
          COUNT("clickedAt")::int AS clicked
        FROM "EmailLog"
        WHERE "sentAt" >= ${startDate} AND "sentAt" <= ${endDate}
        GROUP BY type
        ORDER BY sent DESC
      `,
      db.$queryRaw<{
        code: string; discountPct: number | null; discountFlat: number | null
        uses: number; revenueImpact: number; discountGiven: number
      }[]>`
        SELECT
          c.code,
          c."discountPct",
          c."discountFlat"::float,
          COUNT(cu.id)::int                   AS uses,
          COALESCE(SUM(p.amount),    0)::float AS "revenueImpact",
          COALESCE(SUM(o.discount),  0)::float AS "discountGiven"
        FROM "Coupon" c
        LEFT JOIN "CouponUsage" cu ON cu."couponId" = c.id
        LEFT JOIN "Order"       o  ON cu."orderId"  = o.id
          AND o."createdAt" >= ${startDate}
          AND o."createdAt" <= ${endDate}
        LEFT JOIN "Payment"     p  ON p."orderId" = o.id AND p.status = 'COMPLETED'
        GROUP BY c.id, c.code, c."discountPct", c."discountFlat"
        ORDER BY uses DESC
        LIMIT 20
      `,
      db.$queryRaw<{ date: Date; cumulative: number }[]>`
        SELECT
          DATE_TRUNC('week', "createdAt") AS date,
          COUNT(*) OVER (ORDER BY DATE_TRUNC('week', "createdAt"))::int AS cumulative
        FROM "Subscriber"
        WHERE "createdAt" <= ${endDate}
        GROUP BY DATE_TRUNC('week', "createdAt"), "createdAt"
        ORDER BY date ASC
      `,
    ])

  return {
    subscribers: totalSubs,
    newCount:    newSubs,
    unsubscribed,
    bySource: bySource.map(s => ({ source: s.source || 'Unknown', count: s._count })),
    growth:   growthRaw.map(r => ({
      date:       r.date.toISOString().split('T')[0],
      cumulative: Number(r.cumulative),
    })),
    emailLogs: emailLogs.map(e => ({
      type:    e.type,
      sent:    Number(e.sent),
      opened:  Number(e.opened),
      clicked: Number(e.clicked),
    })),
    couponPerformance: couponPerf.map(c => ({
      code:          c.code,
      discountPct:   c.discountPct,
      discountFlat:  c.discountFlat,
      uses:          Number(c.uses),
      revenueImpact: Number(c.revenueImpact),
      discountGiven: Number(c.discountGiven),
    })),
  }
}

// ─── 8. Financial Summary ─────────────────────────────────────────────────────

export async function getFinancialSummary(options: {
  startDate: Date
  endDate: Date
  region?: string | null
}) {
  const { startDate, endDate, region } = options
  const cf          = countryFilter(region)
  const regionCond  = countrySQL(region)

  const [grossRaw, discountRaw, refundRaw, byMethodRaw, monthlyRaw] =
    await Promise.all([
      db.payment.aggregate({
        where: { status: 'COMPLETED', paidAt: dateRange(startDate, endDate), order: { ...cf } },
        _sum: { amount: true },
      }),
      db.order.aggregate({
        where: { createdAt: dateRange(startDate, endDate), ...cf },
        _sum: { discount: true },
      }),
      db.payment.aggregate({
        where: { status: 'REFUNDED', paidAt: dateRange(startDate, endDate), order: { ...cf } },
        _sum: { amount: true },
      }),
      db.payment.groupBy({
        by: ['method'],
        where: { status: 'COMPLETED', paidAt: dateRange(startDate, endDate), order: { ...cf } },
        _sum: { amount: true },
        _count: true,
      }),
      db.$queryRaw<{ month: string; gross: number; discounts: number; refunds: number }[]>`
        SELECT
          TO_CHAR(DATE_TRUNC('month', p."paidAt"), 'Mon YY') AS month,
          COALESCE(SUM(CASE WHEN p.status='COMPLETED' THEN p.amount ELSE 0 END),0)::float AS gross,
          COALESCE(SUM(o.discount),0)::float                                               AS discounts,
          COALESCE(SUM(CASE WHEN p.status='REFUNDED'  THEN p.amount ELSE 0 END),0)::float AS refunds
        FROM "Payment" p
        JOIN "Order" o ON p."orderId" = o.id
        JOIN "Address" a ON o."addressId" = a.id
        WHERE p."paidAt" >= ${startDate}
          AND p."paidAt" <= ${endDate}
          ${regionCond ? Prisma.raw(regionCond) : Prisma.empty}
        GROUP BY DATE_TRUNC('month', p."paidAt")
        ORDER BY DATE_TRUNC('month', p."paidAt") DESC
      `,
    ])

  const gross     = Number(grossRaw._sum.amount    ?? 0)
  const discounts = Number(discountRaw._sum.discount ?? 0)
  const refunds   = Number(refundRaw._sum.amount    ?? 0)

  return {
    grossRevenue:     gross,
    totalDiscounts:   discounts,
    totalRefunds:     refunds,
    netRevenue:       gross - discounts - refunds,
    byPaymentMethod:  byMethodRaw
      .filter(m => m.method !== 'JAZZCASH')
      .map(m => ({
        method:   m.method,
        revenue:  Number(m._sum.amount ?? 0),
        count:    m._count,
        avgValue: m._count > 0 ? Number(m._sum.amount ?? 0) / m._count : 0,
      })),
    monthlyPL: monthlyRaw.map(r => ({
      month:     r.month,
      gross:     Number(r.gross),
      discounts: Number(r.discounts),
      refunds:   Number(r.refunds),
      net:       Number(r.gross) - Number(r.discounts) - Number(r.refunds),
    })),
  }
}

// ─── 9. Orders Analytics ─────────────────────────────────────────────────────

export async function getOrdersAnalytics(options: {
  startDate: Date
  endDate: Date
  region?: string | null
}) {
  const { startDate, endDate, region } = options
  const cf         = countryFilter(region)
  const regionCond = countrySQL(region)

  const [statusCounts, cancelledCount, refundedCount, ordersOverTimeRaw] =
    await Promise.all([
      db.order.groupBy({
        by: ['status'],
        where: { createdAt: dateRange(startDate, endDate), ...cf },
        _count: true,
      }),
      db.order.count({ where: { status: 'CANCELLED', createdAt: dateRange(startDate, endDate), ...cf } }),
      db.order.count({ where: { status: 'REFUNDED',  createdAt: dateRange(startDate, endDate), ...cf } }),
      db.$queryRaw<{ date: Date; count: number }[]>`
        SELECT
          DATE_TRUNC('day', o."createdAt") AS date,
          COUNT(*)::int                  AS count
        FROM "Order" o
        JOIN "Address" a ON o."addressId" = a.id
        WHERE o."createdAt" >= ${startDate}
          AND o."createdAt" <= ${endDate}
          ${regionCond ? Prisma.raw(regionCond) : Prisma.empty}
        GROUP BY DATE_TRUNC('day', o."createdAt")
        ORDER BY date ASC
      `,
    ])

  const totalOrders = statusCounts.reduce((s, r) => s + r._count, 0)

  return {
    byStatus: statusCounts.map(s => ({ status: s.status, count: s._count })),
    cancelRate: totalOrders > 0 ? Math.round((cancelledCount / totalOrders) * 1000) / 10 : 0,
    refundRate: totalOrders > 0 ? Math.round((refundedCount  / totalOrders) * 1000) / 10 : 0,
    ordersOverTime: ordersOverTimeRaw.map(r => ({
      date:  r.date.toISOString().split('T')[0],
      count: Number(r.count),
    })),
  }
}

// ─── 10. Export CSV ───────────────────────────────────────────────────────────

export async function exportAnalyticsCSV(
  tab: string,
  options: { startDate: Date; endDate: Date; region?: string | null }
): Promise<string> {
  const { startDate, endDate, region } = options

  if (tab === 'products') {
    const data = await getProductAnalytics({ startDate, endDate, region })
    const header = 'Rank,Product,Category,PK Units,UK Units,Total Units,Revenue,Stock\n'
    const rows   = data.topProducts
      .map((p, i) => `${i + 1},"${p.name}","${p.category}",${p.pkUnits},${p.ukUnits},${p.totalUnits},${p.revenue},${p.stock}`)
      .join('\n')
    return header + rows
  }

  if (tab === 'orders') {
    const data   = await getOrdersByRegion({ startDate, endDate })
    const header = 'Region,Orders,Revenue,Avg Order Value\n'
    const rows   = data.map(r => `${r.region},${r.count},${r.revenue},${r.avgOrderValue}`).join('\n')
    return header + rows
  }

  if (tab === 'marketing') {
    const data   = await getMarketingAnalytics({ startDate, endDate })
    const header = 'Coupon Code,Discount%,Uses,Revenue Impact,Discount Given\n'
    const rows   = data.couponPerformance
      .map(c => `${c.code},${c.discountPct ?? c.discountFlat},${c.uses},${c.revenueImpact},${c.discountGiven}`)
      .join('\n')
    return header + rows
  }

  const data   = await getFinancialSummary({ startDate, endDate, region })
  const header = 'Month,Gross Revenue,Discounts,Refunds,Net Revenue\n'
  const rows   = data.monthlyPL
    .map(m => `${m.month},${m.gross},${m.discounts},${m.refunds},${m.net}`)
    .join('\n')
  return header + rows
}
