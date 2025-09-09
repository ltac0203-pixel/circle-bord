'use client'

import { useState } from 'react'

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

interface GameCardProps {
  game: Game
  onApply: (gameId: string) => void
}

export default function GameCard({ game, onApply }: GameCardProps) {
  const [isApplying, setIsApplying] = useState(false)

  const handleApply = async () => {
    if (isApplying || game.hasApplied) return
    
    setIsApplying(true)
    try {
      await onApply(game.id)
    } catch (error) {
      console.error('Application failed:', error)
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-white">
      <h3 className="text-lg font-semibold mb-2 text-gray-800">{game.team_name}</h3>
      <div className="space-y-1 text-sm text-gray-600 mb-3">
        <p className="flex items-center">
          <span className="mr-2">📅</span>
          {new Date(game.date).toLocaleDateString('ja-JP')}
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
        {game.hasApplied ? (
          <div className="text-green-600 text-sm font-medium flex items-center">
            <span className="mr-2">✓</span>
            申請済み
          </div>
        ) : (
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors duration-200 disabled:cursor-not-allowed"
          >
            {isApplying ? '申請中...' : '申請する'}
          </button>
        )}
      </div>
    </div>
  )
}