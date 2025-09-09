'use client'

import { useState, memo, useMemo, useCallback } from 'react'

interface Game {
  id: string
  team_name: string
  date: string
  time: string
  location: string
  participants: number
  description?: string
  created_by: string
  hasApplied?: boolean
}

interface OptimizedGameCardProps {
  game: Game
  onApply: (gameId: string) => void
  currentUserId?: string
}

// 重い計算をシミュレート
function calculateGameScore(game: Game): number {
  // 実際のアプリでは、これは複雑なスコア計算やランキング計算など
  let score = 0
  score += game.participants * 10
  score += game.team_name.length
  score += game.description ? game.description.length * 0.1 : 0
  return Math.round(score)
}

// 日付フォーマット関数をメモ化の外に移動
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const OptimizedGameCard = memo(function OptimizedGameCard({ 
  game, 
  onApply,
  currentUserId 
}: OptimizedGameCardProps) {
  const [isApplying, setIsApplying] = useState(false)
  
  // 重い計算の最適化 - gameオブジェクトが変更された時のみ再計算
  const gameScore = useMemo(() => {
    return calculateGameScore(game)
  }, [game])
  
  // 日付フォーマットの最適化
  const formattedDate = useMemo(() => {
    return formatDate(game.date)
  }, [game.date])
  
  // ゲームが過去かどうかの判定をメモ化
  const isPastGame = useMemo(() => {
    const gameDate = new Date(game.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return gameDate < today
  }, [game.date])
  
  // 自分のゲームかどうかの判定をメモ化
  const isMyGame = useMemo(() => {
    return currentUserId === game.created_by
  }, [currentUserId, game.created_by])
  
  // 申請可能かどうかの判定をメモ化
  const canApply = useMemo(() => {
    return !game.hasApplied && !isMyGame && !isPastGame && !isApplying
  }, [game.hasApplied, isMyGame, isPastGame, isApplying])
  
  // イベントハンドラーの最適化 - 依存配列が変更された時のみ再作成
  const handleApply = useCallback(async () => {
    if (!canApply) return
    
    setIsApplying(true)
    try {
      await onApply(game.id)
    } catch (error) {
      console.error('Application failed:', error)
    } finally {
      setIsApplying(false)
    }
  }, [canApply, onApply, game.id])
  
  // スタイルクラスの計算をメモ化
  const cardClassName = useMemo(() => {
    const baseClasses = "border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-white"
    const statusClasses = isPastGame ? "opacity-60" : ""
    return `${baseClasses} ${statusClasses}`.trim()
  }, [isPastGame])
  
  const buttonClassName = useMemo(() => {
    if (game.hasApplied) {
      return "w-full bg-green-100 text-green-800 py-2 px-4 rounded-md cursor-default"
    }
    if (!canApply) {
      return "w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-md cursor-not-allowed"
    }
    return "w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors duration-200"
  }, [game.hasApplied, canApply])

  return (
    <div className={cardClassName}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-800">{game.team_name}</h3>
        <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          スコア: {gameScore}
        </div>
      </div>
      
      <div className="space-y-1 text-sm text-gray-600 mb-3">
        <p className="flex items-center">
          <span className="mr-2">📅</span>
          {formattedDate}
        </p>
        <p className="flex items-center">
          <span className="mr-2">⏰</span>
          {game.time}
        </p>
        <p className="flex items-center">
          <span className="mr-2">📍</span>
          {game.location}
        </p>
        <p className="flex items-center">
          <span className="mr-2">👥</span>
          {game.participants}人
        </p>
      </div>
      
      {game.description && (
        <p className="text-sm text-gray-700 mb-3 p-2 bg-gray-50 rounded">
          {game.description}
        </p>
      )}
      
      <div className="mt-4 pt-3 border-t border-gray-100">
        {isMyGame ? (
          <div className="text-gray-600 text-sm font-medium flex items-center">
            <span className="mr-2">👤</span>
            あなたの募集
          </div>
        ) : isPastGame ? (
          <div className="text-gray-500 text-sm font-medium flex items-center">
            <span className="mr-2">📅</span>
            終了済み
          </div>
        ) : game.hasApplied ? (
          <div className="text-green-600 text-sm font-medium flex items-center">
            <span className="mr-2">✓</span>
            申請済み
          </div>
        ) : (
          <button
            onClick={handleApply}
            disabled={!canApply}
            className={buttonClassName}
          >
            {isApplying ? '申請中...' : '申請する'}
          </button>
        )}
      </div>
    </div>
  )
})

export default OptimizedGameCard