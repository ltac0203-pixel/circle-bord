
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';

const app = express();
const port = 3001;

// CORSミドルウェアを使用して、Reactアプリケーションからのリクエストを許可します
app.use(cors({
  origin: 'http://localhost:3000'
}));

// リクエストボディをJSONとしてパースするためのミドルウェア
app.use(express.json());

// データベース接続設定
// 注意: 実際のアプリケーションでは、これらの情報を環境変数などに保存してください
const dbConfig = {
  host: 'localhost',     
  user: 'YOUR_DATABASE_USER',       // 例: 'root'
  password: 'YOUR_DATABASE_PASSWORD', // あなたのDBパスワード
  database: 'YOUR_DATABASE_NAME'    // 例: 'circle_bord_db'
};

// ログインAPIエンドポイント
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'メールアドレスとパスワードを入力してください。' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // usersテーブルからemailに一致するユーザーを検索
    // 注意: パスワードはハッシュ化して保存し、比較するのがセキュリティ上望ましいです。
    // ここでは簡単のため平文で比較していますが、本番環境では使用しないでください。
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    );

    await connection.end();

    if (Array.isArray(rows) && rows.length > 0) {
      // ログイン成功
      // 本来はJWTなどを発行してセッション管理を行います
      const user = rows[0];
      res.json({ message: 'ログインに成功しました。', user });
    } else {
      // ログイン失敗
      res.status(401).json({ message: 'メールアドレスまたはパスワードが正しくありません。' });
    }
  } catch (error) {
    console.error('データベース接続またはクエリ実行エラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました。' });
  }
});

app.listen(port, () => {
});
