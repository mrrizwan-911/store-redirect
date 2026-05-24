import { redirect } from 'next/navigation';
import { db } from '@/lib/db/client';
import { getUserSession } from '@/lib/auth/session';
import LoyaltyStats from '@/components/admin/loyalty/LoyaltyStats';
import LoyaltyFilters from '@/components/admin/loyalty/LoyaltyFilters';
import { LoyaltyTable } from '@/components/admin/loyalty/LoyaltyTable';
import { CountryFilterToggle } from '@/components/admin/orders/CountryFilterToggle';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    tier?: string;
    country?: string;
  }>;
}

export default async function AdminLoyaltyPage({ searchParams }: PageProps) {
  const params = await searchParams;
  // 1. Auth check
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  const { search, tier, country } = params;
  const currentTier = tier || 'all';
  const currentCountry = country || '';

  const countryFilter = currentCountry
    ? { user: { country: currentCountry } }
    : {};

  // 2. Fetch Aggregates filtered by region
  const totalMembers = await db.loyaltyAccount.count({
    where: countryFilter,
  });

  const issuedAgg = await db.loyaltyEvent.aggregate({
    _sum: { points: true },
    where: {
      points: { gt: 0 },
      account: countryFilter,
    },
  });

  const redeemedAgg = await db.loyaltyEvent.aggregate({
    _sum: { points: true },
    where: {
      points: { lt: 0 },
      account: countryFilter,
    },
  });

  const totalIssued = issuedAgg._sum.points || 0;
  // Use Math.abs because redeemed points are negative in the database
  const totalRedeemed = Math.abs(redeemedAgg._sum.points || 0);

  // 3. Fetch Members List
  const accounts = await db.loyaltyAccount.findMany({
    where: {
      AND: [
        countryFilter,
        currentTier !== 'all' ? { tier: currentTier as any } : {},
        search ? {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        } : {}
      ]
    },
    include: {
      user: true,
      history: {
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="container mx-auto py-6 px-4 md:px-8 max-w-7xl">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-1 border-b border-neutral-100 pb-4">
          <h1 data-testid="page-heading" className="text-2xl font-bold tracking-tight text-neutral-900">
            Loyalty Management
          </h1>
          <p className="text-neutral-500 text-xs tracking-wide">
            Manage customer rewards, tiers, and point adjustments.
          </p>
        </div>

        {/* Region Filter */}
        <CountryFilterToggle currentCountry={currentCountry} resourceName="Loyalty Accounts" />

        {/* Stats Section */}
        <LoyaltyStats
          totalMembers={totalMembers}
          totalIssued={totalIssued}
          totalRedeemed={totalRedeemed}
        />

        {/* Filters and Table Section */}
        <div className="mt-4">
          <LoyaltyFilters />
          <LoyaltyTable accounts={accounts as any} />
        </div>
      </div>
    </div>
  );
}
