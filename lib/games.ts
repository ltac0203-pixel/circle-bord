import { Game } from '@/types/game'

// Demo data for development - will be replaced with real database queries in Phase 5
const demoGames: Game[] = [
  {
    id: '1',
    teamName: 'サンプルチーム A',
    date: '2025-09-15',
    time: '14:00',
    location: 'サンプル体育館',
    participants: 10,
    description: 'サンプルの練習試合です。',
  },
  {
    id: '2',
    teamName: 'サンプルチーム B',
    date: '2025-09-20',
    time: '16:00',
    location: 'サンプル運動場',
    participants: 12,
    description: 'フレンドリーマッチです。',
  },
]

export async function getGames(limit: number = 20, offset: number = 0): Promise<Game[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Return demo data for now - will be replaced with real database queries
  return demoGames.slice(offset, offset + limit)
}

export async function getGame(id: string): Promise<Game | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const game = demoGames.find(g => g.id === id)
  return game || null
}