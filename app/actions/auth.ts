'use server'

import { redirect } from 'next/navigation'
import { createSession, destroySession } from '@/lib/auth'
import { createUser, validateUser } from '@/lib/db/users'
import { z } from 'zod'

// バリデーションスキーマ
const signInSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上である必要があります')
})

const signUpSchema = z.object({
  name: z.string().min(1, '名前を入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上である必要があります')
})

// サインイン
export async function signIn(formData: FormData) {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string
  }

  // バリデーション
  const validation = signInSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0].message
    }
  }

  try {
    // ユーザー認証
    const user = await validateUser(rawData.email, rawData.password)
    
    if (!user) {
      return {
        success: false,
        error: 'メールアドレスまたはパスワードが正しくありません'
      }
    }

    // セッション作成
    await createSession({
      id: user.id,
      name: user.name,
      email: user.email
    })

    return {
      success: true
    }
  } catch (error) {
    console.error('Sign in error:', error)
    return {
      success: false,
      error: 'ログイン中にエラーが発生しました'
    }
  }
}

// サインアップ
export async function signUp(formData: FormData) {
  const rawData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string
  }

  // バリデーション
  const validation = signUpSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0].message
    }
  }

  try {
    // ユーザー作成
    const user = await createUser(
      rawData.name,
      rawData.email,
      rawData.password
    )
    
    if (!user) {
      return {
        success: false,
        error: 'ユーザーの作成に失敗しました。メールアドレスが既に使用されている可能性があります。'
      }
    }

    return {
      success: true
    }
  } catch (error) {
    console.error('Sign up error:', error)
    return {
      success: false,
      error: '登録中にエラーが発生しました'
    }
  }
}

// サインアウト
export async function signOut() {
  await destroySession()
  redirect('/signin')
}