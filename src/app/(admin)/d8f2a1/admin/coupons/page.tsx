import { redirect } from 'next/navigation';
import { db } from '@/lib/db/client';
import { getUserSession } from '@/lib/auth/session';
import CouponsClient from '@/components/admin/promotions/CouponsClient';
import { CountryFilterToggle } from '@/components/admin/orders/CountryFilterToggle';

export const dynamic = 'force-dynamic';

interface SearchParams {
  country?: string
}

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const session = await getUserSession();

  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  const params = (await searchParams) || {}
  const country = params.country || ''

  const whereClause: any = {}
  if (country === 'PK') {
    whereClause.country = { in: ['PK', 'ALL'] }
  } else if (country === 'UK') {
    whereClause.country = { in: ['UK', 'ALL'] }
  }

  // Fetch initial coupons
  let couponsData: any[] = []

  try {
    couponsData = await db.coupon.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    })
  } catch (err) {
    console.warn('[AdminCouponsPage] DB unavailable:', err)
  }

  // Convert Decimal objects to numbers/strings for Client Component serialization
  const coupons = couponsData.map(coupon => ({
    ...coupon,
    discountFlat: coupon.discountFlat ? Number(coupon.discountFlat) : null,
    minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
        <h1 data-testid="page-heading" className="text-2xl font-bold tracking-tight text-neutral-900">
          Coupons Management
        </h1>
      </div>
      <CountryFilterToggle currentCountry={country} resourceName="Coupons" />
      <CouponsClient initialCoupons={coupons as any} />
    </div>
  );
}
