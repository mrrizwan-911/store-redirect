import { db } from '@/lib/db/client'
import { subDays } from 'date-fns'

export interface InventoryForecast {
  productId: string
  name: string
  sku: string
  currentStock: number
  avgDailySales: number
  daysRemaining: number
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'
}

export async function getInventoryForecast(): Promise<InventoryForecast[]> {
  const thirtyDaysAgo = subDays(new Date(), 30)

  // 1. Fetch all order items from the last 30 days for delivered orders
  const recentSales = await db.orderItem.findMany({
    where: {
      order: {
        createdAt: { gte: thirtyDaysAgo },
        status: 'DELIVERED',
      }
    },
    select: {
      productId: true,
      quantity: true,
    }
  })

  // 2. Aggregate sales per product
  const salesMap: Record<string, number> = {}
  recentSales.forEach(item => {
    salesMap[item.productId] = (salesMap[item.productId] || 0) + item.quantity
  })

  // 3. Fetch all active products and their current stock
  const products = await db.product.findMany({
    where: { isActive: true },
    include: {
      variants: {
        select: { stock: true }
      }
    }
  })

  const forecasts: InventoryForecast[] = products.map(product => {
    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0)
    const totalSales = salesMap[product.id] || 0
    const avgDailySales = totalSales / 30

    let daysRemaining = 999 // Default if no sales
    if (avgDailySales > 0) {
      daysRemaining = Math.floor(totalStock / avgDailySales)
    }

    let riskLevel: InventoryForecast['riskLevel'] = 'LOW'
    if (daysRemaining <= 3) riskLevel = 'CRITICAL'
    else if (daysRemaining <= 7) riskLevel = 'HIGH'
    else if (daysRemaining <= 14) riskLevel = 'MODERATE'

    return {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      currentStock: totalStock,
      avgDailySales: parseFloat(avgDailySales.toFixed(2)),
      daysRemaining,
      riskLevel
    }
  })

  // Only return products with sales or low stock
  return forecasts
    .filter(f => f.avgDailySales > 0 || f.currentStock <= 5)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
}
