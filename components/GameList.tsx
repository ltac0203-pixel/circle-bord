'use client'

import { useState, useOptimistic } from 'react'
import { Game } from '@/lib/data/games'
import { applyForGame } from '@/app/actions/games'
import GameCard from './GameCard'

interface ExtendedGame extends Game {
  hasApplied?: boolean
}

interface GameListProps {
  games: Game[]
  initialApplications?: string[] // 既に申請済みのゲームID配列
}

export default function GameList({ games, initialApplications = [] }: GameListProps) {
  // 初期状態で申請済み情報を設定
  const initialGames: ExtendedGame[] = games.map(game => ({
    ...game,
    hasApplied: initialApplications.includes(game.id)
  }))

  const [optimisticGames, addOptimisticApplication] = useOptimistic(
    initialGames,
    (state, gameId: string) => {
      return state.map(game => 
        game.id === gameId 
          ? { ...game, hasApplied: true }
          : game
      )
    }
  )

  const [error, setError] = useState('')

  const handleApply = async (gameId: string) => {
    // Optimistic Update - 即座にUIを更新
    addOptimisticApplication(gameId)
    setError('')
    
    try {
      const result = await applyForGame(gameId)
      if (!result.success) {
        // エラー時の処理
        setError(result.error || '申請に失敗しました')
        // 実際のUIでは元に戻す処理が必要だが、useOptimisticでは自動的に元の状態に戻る
      }
    } catch (error) {
      console.error('Application failed:', error)
      setError('申請に失敗しました')
    }
  }

  if (optimisticGames.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        現在、登録されている試合はありません
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {optimisticGames.map((game) => (
          <GameCard 
            key={game.id} 
            game={game} 
            onApply={handleApply}
          />
        ))}
      </div>
    </div>
  )
}