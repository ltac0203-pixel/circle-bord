# Phase 1: 環境構築とプロジェクト初期化

## 📋 概要
Next.js移行の第一段階として、プロジェクトの基盤となる環境構築と初期設定を行います。

**推定所要時間**: 1日

## ✅ Task 1.1: バックアップとブランチ作成

### 実行手順

1. **現在の状態を保存**
```bash
git add .
git commit -m "feat: Next.js移行前の状態を保存"
```

2. **移行用ブランチの作成**
```bash
git checkout -b nextjs-migration
```

3. **バックアップの作成**
```bash
# プロジェクト全体のバックアップ
cp -r . ../circle-bord-backup-$(date +%Y%m%d)
```

### チェックリスト
- [ ] 現在の変更をコミット
- [ ] nextjs-migration ブランチを作成
- [ ] バックアップディレクトリの作成
- [ ] .gitignore の確認と更新

## ✅ Task 1.2: Next.js プロジェクトセットアップ

### 1.2.1: package.json の更新

**現在のスクリプト（CRA）を Next.js 用に更新**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "dev:server": "nodemon server.ts"
  }
}
```

**削除対象の依存関係**
```bash
npm uninstall react-scripts @testing-library/react @testing-library/user-event
```

**追加/更新が必要な依存関係**
```bash
npm install next@latest
npm install --save-dev @types/node
```

### 1.2.2: next.config.js の作成

**ファイル**: `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 画像の最適化設定
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // 環境変数の設定
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3001',
  },
  
  // 実験的機能（必要に応じて）
  experimental: {
    serverActions: true,
  },
  
  // リダイレクト設定
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
```

### 1.2.3: TypeScript 設定の調整

**ファイル**: `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/styles/*": ["./styles/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 1.2.4: ESLint 設定

**ファイル**: `.eslintrc.json`
```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "react/no-unescaped-entities": "off",
    "@next/next/no-img-element": "off"
  }
}
```

## ✅ Task 1.3: ディレクトリ構造の再編成

### 新しいディレクトリ構造

```
circle-bord/
├── app/                      # App Router (Next.js 13+)
│   ├── layout.tsx           # ルートレイアウト
│   ├── page.tsx             # ホームページ
│   ├── globals.css          # グローバルスタイル
│   ├── (auth)/              # 認証ルートグループ
│   │   ├── layout.tsx       # 認証レイアウト
│   │   ├── signin/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (protected)/         # 保護ルートグループ
│   │   ├── layout.tsx       # 保護レイアウト
│   │   └── dashboard/
│   │       ├── page.tsx
│   │       └── loading.tsx
│   └── api/                 # API Routes
│       └── auth/
│           └── login/
│               └── route.ts
├── components/              # 共有コンポーネント
│   ├── ui/                 # UIコンポーネント
│   ├── forms/              # フォームコンポーネント
│   └── layouts/            # レイアウトコンポーネント
├── lib/                     # ユーティリティ・ライブラリ
│   ├── auth.ts             # 認証関連
│   ├── db.ts               # データベース接続
│   └── utils.ts            # ユーティリティ関数
├── public/                  # 静的ファイル
├── styles/                  # グローバルスタイル
└── types/                   # TypeScript型定義
```

### ディレクトリ作成コマンド

```bash
# App Router用のディレクトリ作成
mkdir -p app/{api/auth/login,"(auth)"/{signin,signup},"(protected)"/dashboard}

# その他のディレクトリ作成
mkdir -p components/{ui,forms,layouts}
mkdir -p lib
mkdir -p styles
mkdir -p types
```

### 環境変数ファイルの設定

**ファイル**: `.env.local`
```env
# データベース設定
DATABASE_HOST=localhost
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=circle_bord

# 認証設定
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# API設定
API_URL=http://localhost:3001
```

**ファイル**: `.env.example`
```env
# データベース設定
DATABASE_HOST=
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_NAME=

# 認証設定
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# API設定
API_URL=
```

## 📝 確認事項

### セットアップ完了チェックリスト

- [ ] Git ブランチが作成されている
- [ ] バックアップが作成されている
- [ ] package.json が更新されている
- [ ] next.config.js が作成されている
- [ ] tsconfig.json が更新されている
- [ ] ディレクトリ構造が作成されている
- [ ] 環境変数ファイルが設定されている
- [ ] ESLint 設定が完了している

### 動作確認

1. **開発サーバーの起動テスト**
```bash
npm run dev
```

2. **TypeScript のチェック**
```bash
npm run type-check
```

3. **Lint のチェック**
```bash
npm run lint
```

## ⚠️ 注意事項

1. **依存関係の競合**
   - react-scripts と next を同時にインストールしないよう注意
   - 段階的に依存関係を更新する

2. **既存ファイルの保持**
   - src ディレクトリ内のファイルはまだ削除しない
   - 移行が完了するまで元のファイルを保持

3. **環境変数の管理**
   - .env.local はコミットしない
   - .env.example で環境変数の構造を共有

## 🔄 次のステップ

Phase 1 が完了したら、[Phase 2: ルーティングとページ移行](./02-phase2-routing.md) へ進みます。

## 📚 参考資料

- [Next.js 公式ドキュメント](https://nextjs.org/docs)
- [App Router 移行ガイド](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
- [TypeScript with Next.js](https://nextjs.org/docs/app/building-your-application/configuring/typescript)

---

*最終更新: 2025-09-09*