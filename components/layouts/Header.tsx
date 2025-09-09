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
          <h1>🏃 大学サークル練習試合マッチング</h1>
          <p className={styles.subtitle}>申請・承諾でマッチング成立！</p>
        </div>
        
        <div className={styles.menu}>
          <Link href="/dashboard" className={styles.menuItem}>
            🏠 ダッシュボード
          </Link>
          <Link href="/games" className={styles.menuItem}>
            📝 試合一覧
          </Link>
          <Link href="/my-games" className={styles.menuItem}>
            📊 マイゲーム
          </Link>
        </div>
        
        <div className={styles.userMenu}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>👤 {user.name}</span>
          </div>
          <button onClick={handleLogout} className={styles.logoutButton}>
            サインアウト
          </button>
        </div>
      </nav>
    </header>
  )
}