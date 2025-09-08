# 🚀 Circle-Bord SQL移行計画

## 📋 概要

現在のReact TypeScriptアプリケーション（Circle-Bord）をローカルストレージベースからSQL データベース基盤のフルスタックWebアプリケーションに移行するための包括的な計画書です。

**移行目標:**
- データ永続化の実現
- 本格的なユーザー認証システム
- チーム管理機能の拡張
- シンプルで効率的なマッチングシステム
- スケーラブルなアーキテクチャ

---

## 🗄️ データベース設計

### ERD概要
```
Users (1) ←→ (N) UserTeams (N) ←→ (1) Teams
  ↓                                    ↓
Games (N) ←→ (2) Matches ←← Sports/Locations
```

### テーブル構造

#### 1. Users Table
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
```

#### 2. Teams Table
```sql
CREATE TABLE teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  university VARCHAR(100),
  contact_email VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(36),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

#### 3. User-Teams Relationship (多対多)
```sql
CREATE TABLE user_teams (
  user_id VARCHAR(36),
  team_id INT,
  role VARCHAR(20) DEFAULT 'member', -- 'admin', 'captain', 'member'
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, team_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);
```

#### 4. Sports Master Table
```sql
CREATE TABLE sports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(50), -- 'ball', 'individual', 'team'
  is_active BOOLEAN DEFAULT TRUE
);
```

#### 5. Locations Table
```sql
CREATE TABLE locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  prefecture VARCHAR(20),
  city VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. Games Table (メインエンティティ)
```sql
CREATE TABLE games (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT,
  sport_id INT,
  location_id INT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  contact VARCHAR(255),
  description TEXT,
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'matched', 'completed', 'cancelled'
  max_participants INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(36),
  
  -- 外部キー制約
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (sport_id) REFERENCES sports(id),
  FOREIGN KEY (location_id) REFERENCES locations(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  
  -- インデックス
  INDEX idx_games_date_sport (date, sport_id),
  INDEX idx_games_status (status),
  INDEX idx_games_team (team_id)
);
```

#### 7. Matches Table
```sql
CREATE TABLE matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game1_id INT,
  game2_id INT,
  matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
  result JSON, -- 試合結果 {"team1_score": 2, "team2_score": 1}
  notes TEXT,
  
  -- 外部キー制約
  FOREIGN KEY (game1_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (game2_id) REFERENCES games(id) ON DELETE CASCADE,
  
  -- 制約
  CONSTRAINT no_self_match CHECK (game1_id != game2_id),
  UNIQUE(game1_id, game2_id)
);
```

#### 8. Match Communications Table
```sql
CREATE TABLE match_communications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  match_id INT,
  sender_id VARCHAR(36),
  message TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  
  -- 外部キー制約
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id)
);
```

---

## 🏗️ 技術スタック

### バックエンド
```json
{
  "runtime": "Node.js 20+",
  "framework": "Express.js",
  "database": "MariaDB 10.6+",
  "orm": "TypeORM",
  "authentication": "JWT + bcrypt",
  "validation": "class-validator",
  "documentation": "Swagger/OpenAPI",
  "testing": "Jest + Supertest"
}
```

### フロントエンド追加ライブラリ
```json
{
  "http_client": "axios ^1.6.0",
  "state_management": "react-query ^3.39.0",
  "forms": "react-hook-form ^7.48.0",
  "validation": "yup ^1.4.0"
}
```

### 開発・本番環境
```json
{
  "development": "ローカル開発環境 (MariaDB + Node.js)",
  "production": "AWS RDS (MariaDB) + EC2/ECS",
  "monitoring": "CloudWatch + Sentry",
  "ci_cd": "GitHub Actions"
}
```

---

## 🚀 API エンドポイント設計

### 認証関連
```
POST   /api/auth/register     // ユーザー登録
POST   /api/auth/login        // ログイン  
POST   /api/auth/logout       // ログアウト
GET    /api/auth/me           // 現在のユーザー情報
POST   /api/auth/refresh      // トークンリフレッシュ
```

### ユーザー管理
```
GET    /api/users/:id         // ユーザー詳細
PUT    /api/users/:id         // ユーザー情報更新
DELETE /api/users/:id         // ユーザー削除
```

### チーム管理
```
GET    /api/teams             // チーム一覧
POST   /api/teams             // チーム作成
GET    /api/teams/:id         // チーム詳細
PUT    /api/teams/:id         // チーム更新
DELETE /api/teams/:id         // チーム削除
POST   /api/teams/:id/members // メンバー追加
DELETE /api/teams/:id/members/:userId // メンバー削除
```

### 試合管理
```
GET    /api/games             // 試合一覧 (基本フィルタリング対応)
POST   /api/games             // 試合作成
GET    /api/games/:id         // 試合詳細
PUT    /api/games/:id         // 試合更新
DELETE /api/games/:id         // 試合削除
```

### マッチング
```
GET    /api/matches           // マッチ一覧
POST   /api/matches           // 基本マッチング実行
GET    /api/matches/:id       // マッチ詳細
PUT    /api/matches/:id       // マッチ状態更新
DELETE /api/matches/:id       // マッチ削除
POST   /api/matches/:id/confirm // マッチ確定
```

### マスタデータ
```
GET    /api/sports            // スポーツ一覧
GET    /api/locations         // 場所一覧
POST   /api/locations         // 場所追加
PUT    /api/locations/:id     // 場所更新
```

---

## 📅 段階的実装計画 (6フェーズ)

### Phase 1: データベース・バックエンド基盤 (2週間) ⭐⭐⭐

**目標:** MariaDBデータベースとTypeORM基盤の構築

**タスク:**
- [ ] MariaDB環境セットアップ (ローカルインストール)
- [ ] TypeORMプロジェクト初期化
- [ ] Entity定義 (User, Team, Game, Match等)
- [ ] データベースマイグレーション作成
- [ ] 基本的なCRUD API実装
- [ ] Swagger文書化
- [ ] 単体テスト作成

**成果物:**
- 完全なデータベーススキーマ
- 基本API (CRUD)
- API文書
- テストスイート

**リスク:**
- データベース設計変更による工数増加
- TypeORM学習コスト

---

### Phase 2: 認証システム完全移行 (1.5週間) ⭐⭐⭐⭐

**目標:** JWT認証システムでデモ認証を完全置換

**タスク:**
- [ ] JWT認証ミドルウェア実装
- [ ] パスワードハッシュ化 (bcrypt)
- [ ] トークンリフレッシュ機能
- [ ] AuthContext完全リファクタ
- [ ] 認証API統合
- [ ] エラーハンドリング強化

**フロントエンド変更:**
```typescript
// src/contexts/AuthContext.tsx - 完全リファクタ
interface User {
  id: string;           // UUID形式
  email: string;
  name: string;
  teams: Team[];        // 複数チーム対応
  currentTeam?: Team;
}

const useAuth = () => {
  // JWT token管理
  // API認証
  // 自動ログアウト
};
```

**成果物:**
- JWT認証システム
- 安全なパスワード管理
- AuthContext v2.0

**リスク:**
- 既存ユーザーデータ移行
- セキュリティ脆弱性

---

### Phase 3: チーム管理機能 (1週間) ⭐⭐

**目標:** 複数チーム所属とチーム管理機能

**新機能:**
- [ ] チーム作成・編集・削除
- [ ] メンバー招待システム
- [ ] 権限管理 (admin, captain, member)
- [ ] チーム切り替え機能
- [ ] チーム統計表示

**新規コンポーネント:**
```
src/components/team/
├── TeamManagement.tsx
├── TeamCreationModal.tsx
├── MemberInviteForm.tsx
├── TeamSelector.tsx
└── TeamStatistics.tsx
```

**成果物:**
- チーム管理UI
- 権限ベースアクセス制御

---

### Phase 4: 試合管理API連携 (2週間) ⭐⭐⭐

**目標:** Dashboard.tsxのAPI完全連携とローカルstate削除

**タスク:**
- [ ] Dashboard.tsx大幅リファクタ
- [ ] カスタムフック作成 (useGames, useMatches)
- [ ] React Query統合
- [ ] エラーハンドリング
- [ ] ローディング状態管理
- [ ] オフライン対応

**リファクタ例:**
```typescript
// src/components/Dashboard.tsx - BEFORE/AFTER
// BEFORE: ローカルstate
const [games, setGames] = useState<Game[]>([]);

// AFTER: API連携
const { data: games, isLoading, error } = useGames(filters);
```

**新規サービス層:**
```
src/services/
├── api.ts           // Axios基本設定
├── gameService.ts   // 試合API
├── matchService.ts  // マッチングAPI
└── errorHandler.ts  // エラー処理
```

**成果物:**
- 完全API連携Dashboard
- サービス層アーキテクチャ
- エラーハンドリング改善

---


## 📊 プロジェクト管理

### 開発期間とリソース
| フェーズ | 期間 | 工数(時間) | 優先度 | 依存関係 |
|---------|------|-----------|--------|----------|
| Phase 1 | 2週間 | 60-80 | 最高 | - |
| Phase 2 | 1.5週間 | 40-50 | 最高 | Phase 1 |
| Phase 3 | 1週間 | 25-30 | 高 | Phase 2 |
| Phase 4 | 2週間 | 50-60 | 最高 | Phase 3 |

**総開発期間:** 6.5週間 (約1.5ヶ月)  
**総推定工数:** 175-220時間

### リスク管理
| リスク | 影響度 | 対策 |
|--------|--------|------|
| データベース設計変更 | 高 | プロトタイプでの事前検証 |
| API仕様変更 | 中 | OpenAPI仕様書での厳密定義 |
| 認証セキュリティ | 高 | セキュリティ監査の実施 |
| パフォーマンス問題 | 中 | 早期ロードテスト |
| 第三者API制限 | 低 | 代替手段の事前調査 |

---

## 🎯 成功指標 (KPI)

### 技術指標
- [ ] API レスポンス時間 < 200ms (95%tile)
- [ ] データベースクエリ最適化 (N+1問題解消)
- [ ] テストカバレッジ > 80%
- [ ] セキュリティ脆弱性ゼロ

### ビジネス指標
- [ ] ユーザー登録→試合投稿 完了率 > 70%
- [ ] マッチング成功率 > 60%
- [ ] ユーザーリテンション (7日) > 40%
- [ ] 平均セッション時間 > 5分

---

## 🔧 開発環境セットアップ

### 必要なソフトウェア
```bash
# Node.js & npm
node --version  # v20+
npm --version   # v10+

# MariaDB
mysql --version  # v10.6+

# MariaDBローカルインストール (推奨)
# Windows: https://mariadb.org/download/
# macOS: brew install mariadb
# Linux: sudo apt install mariadb-server
```

### 初期セットアップコマンド
```bash
# 1. バックエンドプロジェクト作成
mkdir circle-bord-backend
cd circle-bord-backend
npm init -y

# 2. 必要なパッケージインストール
npm install express typeorm mysql2 reflect-metadata
npm install -D @types/node @types/express typescript ts-node

# 3. MariaDB (ローカルインストール)
# データベースとユーザーの作成
mysql -u root -p
CREATE DATABASE circle_bord CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'circle_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON circle_bord.* TO 'circle_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 4. フロントエンド依存関係追加
cd ../circle-bord
npm install axios react-query react-hook-form yup
```

### 設定ファイルテンプレート
```typescript
// backend/src/config/database.ts
export const databaseConfig = {
  type: "mariadb",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "circle_bord",
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development",
};
```

---

## 📞 サポート・お問い合わせ

この移行計画について質問や clarification が必要な場合は、各フェーズの詳細設計書や実装ガイドを別途提供可能です。

**計画最終更新日:** 2025-09-08  
**バージョン:** 1.0