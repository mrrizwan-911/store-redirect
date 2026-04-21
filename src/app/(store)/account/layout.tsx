import { AccountLayout } from '@/components/store/account/AccountLayout'

export default function RootAccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AccountLayout>{children}</AccountLayout>
}
