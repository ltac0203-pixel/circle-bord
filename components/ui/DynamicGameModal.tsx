'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// モーダルコンポーネントの動的読み込み
const GameModal = dynamic(
  () => import('@/components/modals/GameModal'),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg animate-pulse">
          <div className="w-96 h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    ),
  }
)

// フォールバック用のチャートコンポーネント
const DashboardChart = dynamic(
  () => Promise.resolve({
    default: () => (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-500">チャートコンポーネント</span>
      </div>
    )
  }),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded" />,
    ssr: false, // クライアントサイドでのみ読み込み
  }
)

interface DynamicGameModalProps {
  showModal: boolean
  onClose: () => void
  showChart?: boolean
}

export default function DynamicGameModal({ 
  showModal, 
  onClose, 
  showChart = false 
}: DynamicGameModalProps) {
  return (
    <>
      {/* モーダル表示時のみ読み込み */}
      {showModal && <GameModal onClose={onClose} />}
      
      {/* 必要時のみ読み込まれるチャート */}
      {showChart && (
        <Suspense fallback={<div>Chart loading...</div>}>
          <DashboardChart />
        </Suspense>
      )}
    </>
  )
}