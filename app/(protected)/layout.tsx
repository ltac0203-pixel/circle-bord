import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Header from '@/components/layouts/Header'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  
  if (!session) {
    redirect('/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session.user} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}