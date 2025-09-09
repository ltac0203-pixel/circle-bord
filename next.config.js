const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 画像の最適化設定
  images: {
    domains: ['localhost', 'example.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // 環境変数の設定
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3001',
  },
  
  // 実験的機能とパフォーマンス最適化
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  
  // Webpack設定によるバンドル最適化
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Tree shaking最適化
      config.optimization.sideEffects = false
    }
    return config
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
  
  // パフォーマンス最適化
  poweredByHeader: false,
  compress: true,
  
  // TypeScript設定
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint設定
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = withBundleAnalyzer(nextConfig)