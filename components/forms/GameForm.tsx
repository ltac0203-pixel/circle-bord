'use client'

import { useState } from 'react'
import { createGame } from '@/app/actions/games'

interface Game {
  id: string
  teamName: string
  date: string
  time: string
  location: string
  participants: number
  description?: string
}

interface GameFormProps {
  onSuccess?: () => void
}

export default function GameForm({ onSuccess }: GameFormProps) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (formData: FormData) => {
    setPending(true)
    setError('')

    try {
      const result = await createGame(formData)
      
      if (result.success) {
        onSuccess?.()
        // フォームをリセット
        const form = document.getElementById('game-form') as HTMLFormElement
        if (form) {
          form.reset()
        }
      } else {
        setError(result.error || 'エラーが発生しました')
      }
    } catch (err) {
      setError('エラーが発生しました')
    } finally {
      setPending(false)
    }
  }

  return (
    <form id="game-form" action={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          チーム名
        </label>
        <input
          name="teamName"
          type="text"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={pending}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            日付
          </label>
          <input
            name="date"
            type="date"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={pending}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            時間
          </label>
          <input
            name="time"
            type="time"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={pending}
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          場所
        </label>
        <input
          name="location"
          type="text"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={pending}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          参加人数
        </label>
        <input
          name="participants"
          type="number"
          min="1"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={pending}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          説明（任意）
        </label>
        <textarea
          name="description"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={pending}
        />
      </div>
      
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? '作成中...' : '試合を作成'}
      </button>
    </form>
  )
}