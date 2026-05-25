import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/admin/loyalty
 *
 * Retrieves loyalty program statistics and customer list.
 *
 * Query Parameters:
 *   - page: number (default: 1)
 *   - limit: number (default: 20, max: 100)
 *   - search: search by user email or name
 *   - tier: filter by loyalty tier (BRONZE, SILVER, GOLD, PLATINUM)
 *   - country: filter by country code
 *   - sortBy: 'points' | 'tier' | 'createdAt' (default: 'points')
 *   - order: 'asc' | 'desc' (default: 'desc')
 *
 * Response:
 *   {
 *     success: true,
 *     data: {
 *       stats: {
 *         totalMembers: 0,
 *         totalPointsIssued: 0,
 *         totalPointsRedeemed: 0,
 *         byTier: { BRONZE: 0, SILVER: 0, GOLD: 0, PLATINUM: 0 }
 *       },
 *       members: [ { id, email, name, tier, points, ... }, ... ],
 *       total: 0,
 *       page: 1,
 *       pages: 1
 *     }
 *   }
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const search = searchParams.get('search') || ''
    const tier = searchParams.get('tier')
    const country = searchParams.get('country')
    const sortBy = searchParams.get('sortBy') || 'points'
    const order = searchParams.get('order') || 'desc'

    const skip = (page - 1) * limit

    logger.request('GET /api/admin/loyalty', { page, limit, search, tier, country, sortBy, order })

    // Build where clause for filtering
    const whereClause: any = {
      user: {
        AND: [
          ...(search ? [{ OR: [{ email: { contains: search, mode: 'insensitive' } }, { name: { contains: search, mode: 'insensitive' } }] }] : []),
          ...(country ? [{ country: country }] : []),
        ],
      },
    }

    if (tier) {
      whereClause.tier = tier
    }

    // Fetch loyalty members with pagination
    const members = await db.loyaltyAccount.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, email: true, name: true, country: true } },
      },
      skip,
      take: limit,
      orderBy: {
        [sortBy === 'tier' ? 'tier' : sortBy === 'createdAt' ? 'createdAt' : 'points']: order === 'desc' ? 'desc' : 'asc',
      },
    })

    // Get total count for pagination
    const total = await db.loyaltyAccount.count({ where: whereClause })

    // Get loyalty stats
    const stats = await db.loyaltyAccount.aggregate({
      _sum: { points: true },
      _count: { id: true },
    })

    // Get tier distribution
    const tierDistribution = await db.loyaltyAccount.groupBy({
      by: ['tier'],
      _count: { id: true },
    })

    const byTier = {
      BRONZE: tierDistribution.find((t) => t.tier === 'BRONZE')?._count.id || 0,
      SILVER: tierDistribution.find((t) => t.tier === 'SILVER')?._count.id || 0,
      GOLD: tierDistribution.find((t) => t.tier === 'GOLD')?._count.id || 0,
      PLATINUM: tierDistribution.find((t) => t.tier === 'PLATINUM')?._count.id || 0,
    }

    // Get redeemed points (loyalty events with 'REDEEM' in reason)
    // Simple approach: just sum all event points; finer filtering can be added later
    const redeemedEvents = await db.loyaltyEvent.aggregate({
      _sum: { points: true },
    })

    const formattedMembers = members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      email: m.user.email,
      name: m.user.name,
      country: m.user.country,
      tier: m.tier,
      points: m.points,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalMembers: stats._count.id,
          totalPointsIssued: stats._sum.points || 0,
          totalPointsRedeemed: redeemedEvents._sum.points || 0,
          byTier,
        },
        members: formattedMembers,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error('Failed to fetch loyalty data:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/loyalty
 *
 * Create a new loyalty campaign or adjust program-wide settings.
 * (Currently not implemented — campaigns are managed per-customer)
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  try {
    logger.warn('POST /api/admin/loyalty — not yet implemented')
    return NextResponse.json(
      { success: false, error: 'Loyalty campaign creation not yet implemented' },
      { status: 501 }
    )
  } catch (error) {
    logger.error('Failed to create loyalty resource:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
