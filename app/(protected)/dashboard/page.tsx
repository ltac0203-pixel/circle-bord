import { Suspense } from 'react'
import { getSession } from '@/lib/auth'
import { getGames, getGameStats } from '@/lib/data/games'
import { getPendingApplicationsCount } from '@/lib/data/applications'
import DashboardStats from '@/components/dashboard/DashboardStats'
import GameList from '@/components/GameList'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton'

export default async function DashboardPage() {
  const session = await getSession()
  
  if (!session) {
    return null // middleware がリダイレクトするため
  }

  // データを事前に取得して、コンポーネントに渡す
  const [gameStats, pendingCount, games] = await Promise.all([
    getGameStats(session.user.id),
    getPendingApplicationsCount(session.user.id),
    getGames(10, 0)
  ])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">ダッシュボード</h1>
      
      <DashboardStats
        totalGames={gameStats.total_games}
        pendingApplications={pendingCount}
        upcomingMatches={gameStats.upcoming_games}
      />
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">最新の練習試合</h2>
        <GameList games={games} />
      </section>
    </div>
  )
}