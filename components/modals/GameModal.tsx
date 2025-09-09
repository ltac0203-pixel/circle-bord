'use client'

import { useState, useCallback } from 'react'
import GameForm from '@/components/forms/GameForm'

interface GameModalProps {
  onClose: () => void
}

export default function GameModal({ onClose }: GameModalProps) {
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 150)
  }, [onClose])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }, [handleClose])

  const handleSuccess = useCallback(() => {
    handleClose()
  }, [handleClose])

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-150 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleBackdropClick}
    >
      <div 
        className={`bg-white rounded-lg p-6 w-full max-w-md mx-4 transform transition-transform duration-150 ${
          isClosing ? 'scale-95' : 'scale-100'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">新しい試合を作成</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <GameForm onSuccess={handleSuccess} />
      </div>
    </div>
  )
}