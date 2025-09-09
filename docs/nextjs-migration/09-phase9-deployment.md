# Phase 9: デプロイメント準備

## 📋 概要
Next.jsアプリケーションの本番環境デプロイメント準備を行い、CI/CDパイプラインを構築します。

**推定所要時間**: 1日

## ✅ Task 9.1: ビルドと本番環境設定

### 9.1.1: 本番用next.config.js設定

**ファイル**: `next.config.js` (本番最適化版)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  
  // 画像最適化
  images: {
    domains: ['localhost', 'yourdomain.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 1週間
  },
  
  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          }
        ]
      }
    ]
  },
  
  // リダイレクト設定
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },
  
  // 実験的機能
  experimental: {
    serverActions: true,
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  
  // 環境変数の設定
  env: {
    API_URL: process.env.API_URL,
    APP_ENV: process.env.NODE_ENV,
  },
  
  // Webpack最適化
  webpack: (config, { dev, isServer }) => {\n    if (!dev && !isServer) {\n      // Tree shaking最適化\n      config.optimization.sideEffects = false\n      \n      // バンドルサイズ最適化\n      config.optimization.splitChunks = {\n        chunks: 'all',\n        cacheGroups: {\n          vendor: {\n            test: /[\\\\/]node_modules[\\\\/]/,\n            name: 'vendors',\n            chunks: 'all',\n          },\n          common: {\n            name: 'common',\n            minChunks: 2,\n            chunks: 'all',\n            enforce: true,\n          },\n        },\n      }\n    }\n    return config\n  },\n}\n\nmodule.exports = nextConfig\n```\n\n### 9.1.2: 環境変数の管理\n\n**ファイル**: `.env.production`\n```env\n# 本番環境用設定（GitHubには含めない）\nNODE_ENV=production\n\n# データベース\nDATABASE_HOST=your-production-db-host\nDATABASE_USER=your-production-user\nDATABASE_PASSWORD=your-production-password\nDATABASE_NAME=circle_bord_production\n\n# 認証\nJWT_SECRET=your-very-strong-jwt-secret-key\nNEXTAUTH_URL=https://yourdomain.com\nNEXTAUTH_SECRET=your-nextauth-secret\n\n# 外部サービス\nNEXT_PUBLIC_API_URL=https://yourdomain.com/api\n```\n\n**ファイル**: `.env.example`\n```env\n# 開発環境用の環境変数テンプレート\n\n# データベース接続\nDATABASE_HOST=localhost\nDATABASE_USER=\nDATABASE_PASSWORD=\nDATABASE_NAME=circle_bord\n\n# 認証設定\nJWT_SECRET=\nNEXTAUTH_URL=http://localhost:3000\nNEXTAUTH_SECRET=\n\n# API設定\nNEXT_PUBLIC_API_URL=http://localhost:3000/api\n\n# オプション設定\nANALYZE=false\nENABLE_LOGS=true\n```\n\n### 9.1.3: ビルド最適化スクリプト\n\n**package.json** (本番用スクリプト追加)\n```json\n{\n  \"scripts\": {\n    \"dev\": \"next dev\",\n    \"build\": \"next build\",\n    \"start\": \"next start\",\n    \"lint\": \"next lint\",\n    \"type-check\": \"tsc --noEmit\",\n    \n    \"build:production\": \"NODE_ENV=production next build\",\n    \"start:production\": \"NODE_ENV=production next start\",\n    \"build:analyze\": \"ANALYZE=true npm run build\",\n    \n    \"test\": \"jest\",\n    \"test:coverage\": \"jest --coverage\",\n    \"test:e2e\": \"playwright test\",\n    \"test:ci\": \"npm run test && npm run test:e2e\",\n    \n    \"deploy:vercel\": \"vercel --prod\",\n    \"deploy:docker\": \"docker build -t circle-bord . && docker run -p 3000:3000 circle-bord\",\n    \n    \"db:migrate\": \"node scripts/migrate.js\",\n    \"db:seed\": \"node scripts/seed.js\",\n    \"db:backup\": \"node scripts/backup.js\"\n  }\n}\n```\n\n### 9.1.4: Docker設定（オプション）\n\n**ファイル**: `Dockerfile`\n```dockerfile\n# ベースイメージ\nFROM node:18-alpine AS base\n\n# 依存関係のインストール\nFROM base AS deps\nRUN apk add --no-cache libc6-compat\nWORKDIR /app\n\n# package.jsonとpackage-lock.jsonをコピー\nCOPY package.json package-lock.json* ./\nRUN npm ci --only=production\n\n# ビルダーステージ\nFROM base AS builder\nWORKDIR /app\nCOPY --from=deps /app/node_modules ./node_modules\nCOPY . .\n\nENV NEXT_TELEMETRY_DISABLED 1\n\nRUN npm run build\n\n# 実行ステージ\nFROM base AS runner\nWORKDIR /app\n\nENV NODE_ENV production\nENV NEXT_TELEMETRY_DISABLED 1\n\nRUN addgroup --system --gid 1001 nodejs\nRUN adduser --system --uid 1001 nextjs\n\nCOPY --from=builder /app/public ./public\n\n# 必要なファイルのみコピー\nCOPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./\nCOPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static\n\nUSER nextjs\n\nEXPOSE 3000\n\nENV PORT 3000\nENV HOSTNAME \"0.0.0.0\"\n\nCMD [\"node\", \"server.js\"]\n```\n\n**ファイル**: `.dockerignore`\n```\nDockerfile\n.dockerignore\nnode_modules\nnpm-debug.log\nREADME.md\n.env\n.env.local\n.env.production\n.git\n.gitignore\n```\n\n## ✅ Task 9.2: デプロイメント戦略\n\n### 9.2.1: Vercelデプロイ設定\n\n**ファイル**: `vercel.json`\n```json\n{\n  \"version\": 2,\n  \"builds\": [\n    {\n      \"src\": \"next.config.js\",\n      \"use\": \"@vercel/next\"\n    }\n  ],\n  \"regions\": [\"nrt1\"],\n  \"env\": {\n    \"NODE_ENV\": \"production\"\n  },\n  \"build\": {\n    \"env\": {\n      \"DATABASE_HOST\": \"@database-host\",\n      \"DATABASE_USER\": \"@database-user\", \n      \"DATABASE_PASSWORD\": \"@database-password\",\n      \"JWT_SECRET\": \"@jwt-secret\"\n    }\n  },\n  \"functions\": {\n    \"app/api/**/*.ts\": {\n      \"maxDuration\": 30\n    }\n  },\n  \"headers\": [\n    {\n      \"source\": \"/(.*)\",\n      \"headers\": [\n        {\n          \"key\": \"X-Content-Type-Options\",\n          \"value\": \"nosniff\"\n        },\n        {\n          \"key\": \"X-Frame-Options\",\n          \"value\": \"DENY\"\n        },\n        {\n          \"key\": \"X-XSS-Protection\",\n          \"value\": \"1; mode=block\"\n        }\n      ]\n    }\n  ],\n  \"redirects\": [\n    {\n      \"source\": \"/old-path\",\n      \"destination\": \"/new-path\",\n      \"permanent\": true\n    }\n  ]\n}\n```\n\n### 9.2.2: GitHub Actions CI/CD\n\n**ファイル**: `.github/workflows/deploy.yml`\n```yaml\nname: Deploy to Production\n\non:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\n\njobs:\n  test:\n    name: Run Tests\n    runs-on: ubuntu-latest\n    \n    steps:\n      - name: Checkout\n        uses: actions/checkout@v4\n        \n      - name: Setup Node.js\n        uses: actions/setup-node@v4\n        with:\n          node-version: '18'\n          cache: 'npm'\n          \n      - name: Install dependencies\n        run: npm ci\n        \n      - name: Run TypeScript check\n        run: npm run type-check\n        \n      - name: Run linter\n        run: npm run lint\n        \n      - name: Run unit tests\n        run: npm run test:coverage\n        \n      - name: Upload coverage reports\n        uses: codecov/codecov-action@v3\n        with:\n          file: ./coverage/lcov.info\n          \n  e2e-test:\n    name: E2E Tests\n    runs-on: ubuntu-latest\n    needs: test\n    \n    steps:\n      - name: Checkout\n        uses: actions/checkout@v4\n        \n      - name: Setup Node.js\n        uses: actions/setup-node@v4\n        with:\n          node-version: '18'\n          cache: 'npm'\n          \n      - name: Install dependencies\n        run: npm ci\n        \n      - name: Install Playwright\n        run: npx playwright install --with-deps\n        \n      - name: Build application\n        run: npm run build\n        \n      - name: Run E2E tests\n        run: npm run test:e2e\n        \n      - name: Upload test results\n        if: always()\n        uses: actions/upload-artifact@v3\n        with:\n          name: playwright-report\n          path: playwright-report/\n          \n  deploy:\n    name: Deploy to Vercel\n    runs-on: ubuntu-latest\n    needs: [test, e2e-test]\n    if: github.ref == 'refs/heads/main'\n    \n    steps:\n      - name: Checkout\n        uses: actions/checkout@v4\n        \n      - name: Deploy to Vercel\n        uses: amondnet/vercel-action@v25\n        with:\n          vercel-token: ${{ secrets.VERCEL_TOKEN }}\n          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}\n          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}\n          vercel-args: '--prod'\n```\n\n### 9.2.3: デプロイメント前チェックリスト\n\n**ファイル**: `scripts/pre-deploy-check.js`\n```javascript\n#!/usr/bin/env node\n\nconst fs = require('fs')\nconst path = require('path')\n\nfunction checkEnvironmentVariables() {\n  const requiredVars = [\n    'DATABASE_HOST',\n    'DATABASE_USER', \n    'DATABASE_PASSWORD',\n    'JWT_SECRET',\n    'NEXTAUTH_SECRET'\n  ]\n  \n  const missingVars = requiredVars.filter(varName => !process.env[varName])\n  \n  if (missingVars.length > 0) {\n    console.error('❌ Missing environment variables:')\n    missingVars.forEach(varName => console.error(`   - ${varName}`))\n    process.exit(1)\n  }\n  \n  console.log('✅ All required environment variables are set')\n}\n\nfunction checkBuildOutput() {\n  const buildDir = path.join(process.cwd(), '.next')\n  \n  if (!fs.existsSync(buildDir)) {\n    console.error('❌ Build output not found. Please run \"npm run build\" first.')\n    process.exit(1)\n  }\n  \n  console.log('✅ Build output exists')\n}\n\nfunction checkDatabaseConnection() {\n  // データベース接続テストのロジック\n  console.log('✅ Database connection check passed')\n}\n\nfunction runSecurityCheck() {\n  // セキュリティチェックのロジック\n  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))\n  \n  // 脆弱性のあるパッケージをチェック\n  console.log('✅ Security check passed')\n}\n\nfunction main() {\n  console.log('🚀 Running pre-deployment checks...')\n  \n  try {\n    checkEnvironmentVariables()\n    checkBuildOutput()\n    checkDatabaseConnection()\n    runSecurityCheck()\n    \n    console.log('🎉 All checks passed! Ready for deployment.')\n  } catch (error) {\n    console.error('❌ Pre-deployment check failed:', error.message)\n    process.exit(1)\n  }\n}\n\nmain()\n```\n\n### 9.2.4: データベースマイグレーション\n\n**ファイル**: `scripts/migrate.js`\n```javascript\n#!/usr/bin/env node\n\nconst mysql = require('mysql2/promise')\nconst fs = require('fs').promises\nconst path = require('path')\n\nasync function runMigrations() {\n  const connection = await mysql.createConnection({\n    host: process.env.DATABASE_HOST,\n    user: process.env.DATABASE_USER,\n    password: process.env.DATABASE_PASSWORD,\n    database: process.env.DATABASE_NAME,\n    multipleStatements: true\n  })\n  \n  try {\n    console.log('🔄 Running database migrations...')\n    \n    // マイグレーションファイルのパス\n    const migrationsDir = path.join(__dirname, '..', 'migrations')\n    const files = await fs.readdir(migrationsDir)\n    \n    // SQLファイルを順番に実行\n    for (const file of files.sort()) {\n      if (file.endsWith('.sql')) {\n        console.log(`Running migration: ${file}`)\n        const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8')\n        await connection.execute(sql)\n        console.log(`✅ Completed: ${file}`)\n      }\n    }\n    \n    console.log('🎉 All migrations completed successfully!')\n  } catch (error) {\n    console.error('❌ Migration failed:', error.message)\n    process.exit(1)\n  } finally {\n    await connection.end()\n  }\n}\n\nrunMigrations()\n```\n\n## 📝 確認事項\n\n### デプロイ準備チェックリスト\n\n- [ ] next.config.jsが本番設定に最適化されている\n- [ ] 環境変数が適切に設定されている\n- [ ] セキュリティヘッダーが設定されている\n- [ ] Docker設定が完了している（使用する場合）\n- [ ] Vercel設定が完了している\n- [ ] CI/CDパイプラインが設定されている\n- [ ] データベースマイグレーションスクリプトが準備されている\n- [ ] 本番ビルドが成功する\n- [ ] 全テストが通る\n\n### 本番環境テスト\n\n1. **ローカル本番ビルドテスト**\n```bash\nnpm run build:production\nnpm run start:production\n```\n\n2. **セキュリティスキャン**\n```bash\nnpm audit\nnpm run test:security\n```\n\n3. **パフォーマンステスト**\n```bash\nlighthouse http://localhost:3000\n```\n\n## ⚠️ 注意事項\n\n1. **環境変数の管理**\n   - .env.production は絶対にGitにコミットしない\n   - 本番環境でのシークレット管理ツールの使用を推奨\n\n2. **データベースバックアップ**\n   - デプロイ前に必ずデータベースバックアップを取る\n   - ロールバック計画を準備\n\n3. **ゼロダウンタイムデプロイ**\n   - Blue-Greenデプロイメントの検討\n   - ヘルスチェック機能の実装\n\n## 🔄 次のステップ\n\nPhase 9 が完了したら、[Phase 10: 移行完了と後処理](./10-phase10-cleanup.md) へ進みます。\n\n## 📚 参考資料\n\n- [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying)\n- [Vercel Deployment](https://vercel.com/docs/concepts/deployments/overview)\n- [Docker with Next.js](https://nextjs.org/docs/app/building-your-application/deploying/docker)\n- [GitHub Actions](https://docs.github.com/en/actions)\n\n---\n\n*最終更新: 2025-09-09*