import { AccountLayout } from '@/components/store/account/AccountLayout'

export const dynamic = 'force-dynamic'

export default function RootAccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AccountLayout>{children}</AccountLayout>
}
