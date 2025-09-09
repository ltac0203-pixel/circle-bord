import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

export const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, name, teamName);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>👋 新規登録</h1>
          <p>大学サークル練習試合マッチング</p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label htmlFor="name">お名前 *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="山田 太郎"
              required
              disabled={loading}
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="email">メールアドレス *</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@university.ac.jp"
              required
              disabled={loading}
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="teamName">チーム名・サークル名</label>
            <input
              id="teamName"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="○○大学サッカー部"
              disabled={loading}
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="password">パスワード *</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6文字以上で入力"
              required
              disabled={loading}
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="confirmPassword">パスワード（確認） *</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="パスワードを再入力"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="auth-submit-button"
            disabled={loading}
          >
            {loading ? '登録中...' : '登録する'}
          </button>
        </form>

        <div className="auth-footer">
          <p>既にアカウントをお持ちの方は</p>
          <Link to="/signin" className="auth-link">
            サインインはこちら
          </Link>
        </div>

        <div className="auth-demo-note">
          <p>📌 デモ版: 入力された情報はブラウザに保存されます</p>
        </div>
      </div>
    </div>
  );
};