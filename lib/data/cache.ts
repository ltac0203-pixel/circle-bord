import { unstable_cache } from 'next/cache'

// タグベースキャッシュヘルパー
export function createCachedFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyPrefix: string,
  tags: string[],
  revalidate?: number
) {
  return unstable_cache(
    fn as any,
    [keyPrefix],
    {
      tags,
      revalidate
    }
  ) as typeof fn
}

// よく使用されるキャッシュタグ
export const CACHE_TAGS = {
  GAMES: 'games',
  APPLICATIONS: 'applications',
  USERS: 'users',
  MATCHES: 'matches'
} as const

// キャッシュ無効化ヘルパー
export function invalidateCache(tags: string[]) {
  // Next.js のrevalidateTag APIを使用（実装時）
  // tags.forEach(tag => revalidateTag(tag))
}