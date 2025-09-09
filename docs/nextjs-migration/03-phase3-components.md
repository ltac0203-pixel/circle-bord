# Phase 3: コンポーネント移行

## 📋 概要
既存のReactコンポーネントをNext.js App Router対応に移行し、Server ComponentsとClient Componentsを適切に分離します。

**推定所要時間**: 2-3日

## ✅ Task 3.1: 共通コンポーネントの移行

### 3.1.1: Header コンポーネントの移行

**ファイル**: `components/layouts/Header.tsx`
```tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import styles from './Header.module.css'

interface HeaderProps {
  user: {
    id: string
    name: string
    email: string
  }
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push('/signin')
    router.refresh()
  }

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <Link href="/dashboard">
            サークルボード
          </Link>
        </div>
        
        <div className={styles.menu}>
          <Link href="/dashboard" className={styles.menuItem}>
            ダッシュボード
          </Link>
          <Link href="/games" className={styles.menuItem}>
            試合一覧
          </Link>
          <Link href="/my-games" className={styles.menuItem}>
            マイゲーム
          </Link>
        </div>
        
        <div className={styles.userMenu}>
          <span className={styles.userName}>{user.name}</span>
          <button onClick={handleLogout} className={styles.logoutButton}>
            ログアウト
          </button>
        </div>
      </nav>
    </header>
  )
}
```

**ファイル**: `components/layouts/Header.module.css`
```css
.header {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #4f46e5;
}

.logo a {
  text-decoration: none;
  color: inherit;
}

.menu {
  display: flex;
  gap: 2rem;
}

.menuItem {
  color: #374151;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.menuItem:hover {
  color: #4f46e5;
}

.userMenu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.userName {
  color: #374151;
  font-weight: 500;
}

.logoutButton {
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.logoutButton:hover {
  background-color: #dc2626;
}
```

### 3.1.2: Client/Server Components の分離戦略

**Server Components (デフォルト)**
- データフェッチを行うコンポーネント
- 静的なコンテンツ表示
- SEOが重要なコンポーネント

**Client Components ('use client' 必須)**
- イベントハンドラを持つコンポーネント
- ブラウザAPIを使用するコンポーネント
- 状態管理を行うコンポーネント
- フォーム要素

### 3.1.3: コンポーネント分離の実例

**Server Component例**: `components/GameList.tsx`
```tsx
import { Game } from '@/types/game'
import GameCard from './GameCard'

interface GameListProps {
  games: Game[]
}

export default function GameList({ games }: GameListProps) {
  if (games.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        現在、登録されている試合はありません
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  )
}
```

**Client Component例**: `components/GameCard.tsx`
```tsx
'use client'

import { useState } from 'react'
import { Game } from '@/types/game'
import { applyForGame } from '@/app/actions/games'

interface GameCardProps {
  game: Game
}

export default function GameCard({ game }: GameCardProps) {
  const [isApplying, setIsApplying] = useState(false)
  const [applied, setApplied] = useState(false)

  const handleApply = async () => {
    setIsApplying(true)
    try {
      const result = await applyForGame(game.id)
      if (result.success) {
        setApplied(true)
      }
    } catch (error) {
      console.error('申請エラー:', error)
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold mb-2">{game.teamName}</h3>
      <div className="space-y-1 text-sm text-gray-600">
        <p>📅 {new Date(game.date).toLocaleDateString('ja-JP')}</p>
        <p>⏰ {game.time}</p>
        <p>📍 {game.location}</p>
        <p>👥 {game.participants}人</p>
      </div>
      
      <div className="mt-4">
        {applied ? (
          <button disabled className="w-full bg-gray-300 text-gray-500 py-2 rounded cursor-not-allowed">
            申請済み
          </button>
        ) : (
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isApplying ? '申請中...' : '申請する'}
          </button>
        )}
      </div>
    </div>
  )
}
```

## ✅ Task 3.2: 主要機能コンポーネントの移行

### 3.2.1: MainApp コンポーネントの分割

元の `MainApp.tsx` を機能ごとに分割:

**ファイル**: `components/games/GameManager.tsx`
```tsx
'use client'

import { useState } from 'react'
import { Game } from '@/types/game'
import GameForm from './GameForm'
import GameList from './GameList'

export default function GameManager({ initialGames }: { initialGames: Game[] }) {
  const [games, setGames] = useState(initialGames)
  const [showForm, setShowForm] = useState(false)

  const handleAddGame = (newGame: Game) => {
    setGames([...games, newGame])
    setShowForm(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">試合管理</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? 'キャンセル' : '新規登録'}
        </button>
      </div>

      {showForm && <GameForm onSubmit={handleAddGame} />}
      
      <GameList games={games} />
    </div>
  )
}
```

**ファイル**: `components/applications/ApplicationManager.tsx`
```tsx
'use client'

import { useState, useEffect } from 'react'
import { Application } from '@/types/application'
import ApplicationList from './ApplicationList'

export default function ApplicationManager() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications')
      const data = await response.json()
      setApplications(data)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    const response = await fetch(`/api/applications/${id}/approve`, {
      method: 'POST'
    })
    if (response.ok) {
      fetchApplications()
    }
  }

  const handleReject = async (id: string) => {
    const response = await fetch(`/api/applications/${id}/reject`, {
      method: 'POST'
    })
    if (response.ok) {
      fetchApplications()
    }
  }

  if (loading) {
    return <div>読み込み中...</div>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">申請管理</h2>
      <ApplicationList
        applications={applications}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  )
}
```

### 3.2.2: Dashboard コンポーネントの移行

**ファイル**: `components/dashboard/DashboardStats.tsx`
```tsx
interface StatsProps {
  totalGames: number
  pendingApplications: number
  upcomingMatches: number
}

export default function DashboardStats({ 
  totalGames, 
  pendingApplications, 
  upcomingMatches 
}: StatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <StatCard
        title="登録試合数"
        value={totalGames}
        icon="🏐"
        color="bg-blue-100"
      />
      <StatCard
        title="承認待ち"
        value={pendingApplications}
        icon="📝"
        color="bg-yellow-100"
      />
      <StatCard
        title="今後の試合"
        value={upcomingMatches}
        icon="📅"
        color="bg-green-100"
      />
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number
  icon: string
  color: string
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className={`${color} rounded-lg p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  )
}
```

**ファイル**: `components/dashboard/RecentActivity.tsx`
```tsx
import { Activity } from '@/types/activity'

interface RecentActivityProps {
  activities: Activity[]
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">最近のアクティビティ</h3>
      <div className="space-y-3">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  )
}

function ActivityItem({ activity }: { activity: Activity }) {
  return (
    <div className="flex items-start space-x-3 py-2 border-b last:border-0">
      <div className="flex-shrink-0">
        <span className="text-2xl">{activity.icon}</span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
        <p className="text-sm text-gray-500">{activity.description}</p>
        <p className="text-xs text-gray-400 mt-1">
          {new Date(activity.createdAt).toLocaleString('ja-JP')}
        </p>
      </div>
    </div>
  )
}
```

## ✅ Task 3.3: スタイリングの移行

### 3.3.1: CSS Modules への変換

**変換プロセス**:
1. `.css` ファイルを `.module.css` に変更
2. クラス名を camelCase に変換
3. styles オブジェクト経由でクラスを適用

**Before**: `Auth.css`
```css
.auth-container {
  max-width: 400px;
  margin: 0 auto;
}

.auth-form {
  background: white;
  padding: 2rem;
}
```

**After**: `Auth.module.css`
```css
.authContainer {
  max-width: 400px;
  margin: 0 auto;
}

.authForm {
  background: white;
  padding: 2rem;
}
```

**使用例**:
```tsx
import styles from './Auth.module.css'

<div className={styles.authContainer}>
  <form className={styles.authForm}>
    {/* ... */}
  </form>
</div>
```

### 3.3.2: グローバルスタイル設定

**ファイル**: `app/globals.css`
```css
/* Base styles */
@layer base {
  :root {
    --primary-color: #4f46e5;
    --secondary-color: #06b6d4;
    --error-color: #ef4444;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    
    --text-primary: #111827;
    --text-secondary: #6b7280;
    --text-tertiary: #9ca3af;
    
    --bg-primary: #ffffff;
    --bg-secondary: #f9fafb;
    --bg-tertiary: #f3f4f6;
    
    --border-color: #e5e7eb;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: var(--text-primary);
    background-color: var(--bg-secondary);
    line-height: 1.6;
  }

  a {
    color: var(--primary-color);
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
}

/* Components */
@layer components {
  .btn {
    @apply px-4 py-2 rounded-md font-medium transition-colors duration-200;
  }

  .btn-primary {
    @apply bg-blue-500 text-white hover:bg-blue-600;
  }

  .btn-secondary {
    @apply bg-gray-200 text-gray-800 hover:bg-gray-300;
  }

  .btn-danger {
    @apply bg-red-500 text-white hover:bg-red-600;
  }

  .card {
    @apply bg-white rounded-lg shadow-sm p-6;
  }

  .input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
  }

  .label {
    @apply block text-sm font-medium text-gray-700 mb-1;
  }
}

/* Utilities */
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  .animate-slide-in {
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateY(-10px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
}
```

### 3.3.3: Tailwind CSS の導入（オプション）

**インストール**:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**ファイル**: `tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5',
        secondary: '#06b6d4',
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

## 📝 確認事項

### 移行完了チェックリスト

- [ ] Header コンポーネントが移行されている
- [ ] Client/Server Components が適切に分離されている
- [ ] MainApp が機能別に分割されている
- [ ] Dashboard コンポーネントが移行されている
- [ ] CSS Modules への変換が完了している
- [ ] グローバルスタイルが設定されている
- [ ] すべてのコンポーネントが正常に動作する

### 動作確認

1. **コンポーネントのレンダリング**
```bash
npm run dev
# 各ページでコンポーネントが正しく表示されることを確認
```

2. **インタラクティブ要素**
- ボタンクリック
- フォーム送信
- 状態変更

3. **スタイルの適用**
- CSS Modules が正しく適用されている
- レスポンシブデザインが機能している

## ⚠️ 注意事項

1. **use client の使用**
   - 必要最小限に留める
   - 子コンポーネントも Client Component になることに注意

2. **ハイドレーションエラー**
   - Server/Client で異なる内容をレンダリングしない
   - Date オブジェクトの扱いに注意

3. **パフォーマンス**
   - 大きなコンポーネントは動的インポートを検討
   - 不要な再レンダリングを避ける

## 🔄 次のステップ

Phase 3 が完了したら、[Phase 4: 認証システムの再実装](./04-phase4-auth.md) へ進みます。

## 📚 参考資料

- [Server and Client Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [CSS Modules](https://nextjs.org/docs/app/building-your-application/styling/css-modules)
- [Tailwind CSS with Next.js](https://tailwindcss.com/docs/guides/nextjs)

---

*最終更新: 2025-09-09*