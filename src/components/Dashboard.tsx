import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { useAuth } from '../contexts/AuthContext';

interface Game {
  id: number;
  teamName: string;
  sport: string;
  date: string;
  time: string;
  location: string;
  contact: string;
  status: 'open' | 'matched';
  matchedWith?: number;
  description?: string;
}

interface Match {
  id: number;
  game1: Game;
  game2: Game;
  matchedAt: Date;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teamName, setTeamName] = useState(user?.teamName || '');
  const [sport, setSport] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState(user?.email || '');
  const [description, setDescription] = useState('');
  const [filterSport, setFilterSport] = useState('all');
  const [notification, setNotification] = useState<string | null>(null);

  const sports = [
    'サッカー', 'バスケットボール', 'バレーボール', 'テニス',
    '野球', 'ソフトボール', 'バドミントン', '卓球',
    'ハンドボール', 'フットサル', 'その他'
  ];

  // 自動マッチング機能
  useEffect(() => {
    checkForMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games]);

  const checkForMatches = () => {
    const openGames = games.filter(g => g.status === 'open');
    
    for (let i = 0; i < openGames.length; i++) {
      for (let j = i + 1; j < openGames.length; j++) {
        const game1 = openGames[i];
        const game2 = openGames[j];
        
        // 同じ日時・スポーツでマッチング
        if (
          game1.date === game2.date &&
          game1.time === game2.time &&
          game1.sport === game2.sport &&
          game1.teamName !== game2.teamName
        ) {
          createMatch(game1, game2);
        }
      }
    }
  };

  const createMatch = (game1: Game, game2: Game) => {
    const newMatch: Match = {
      id: Date.now(),
      game1,
      game2,
      matchedAt: new Date()
    };
    
    setMatches(prev => [...prev, newMatch]);
    
    // ゲームのステータスを更新
    setGames(prev => prev.map(g => {
      if (g.id === game1.id || g.id === game2.id) {
        return {
          ...g,
          status: 'matched' as const,
          matchedWith: g.id === game1.id ? game2.id : game1.id
        };
      }
      return g;
    }));
    
    // 通知を表示
    showNotification(`マッチング成立！ ${game1.teamName} × ${game2.teamName}`);
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || !sport || !date || !time || !location || !contact) {
      alert('必須項目をすべて入力してください。');
      return;
    }
    
    const newGame: Game = {
      id: Date.now(),
      teamName,
      sport,
      date,
      time,
      location,
      contact,
      description,
      status: 'open'
    };
    
    setGames([...games, newGame]);
    
    // フォームをリセット
    setTeamName(user?.teamName || '');
    setSport('');
    setDate('');
    setTime('');
    setLocation('');
    setContact(user?.email || '');
    setDescription('');
    
    showNotification('練習試合の募集を登録しました！');
  };

  const handleDeleteGame = (id: number) => {
    // マッチングも削除
    setMatches(prev => prev.filter(m => 
      m.game1.id !== id && m.game2.id !== id
    ));
    
    // 関連するゲームのステータスを戻す
    const game = games.find(g => g.id === id);
    if (game && game.matchedWith) {
      setGames(prev => prev.map(g => {
        if (g.id === game.matchedWith) {
          return { ...g, status: 'open' as const, matchedWith: undefined };
        }
        return g;
      }));
    }
    
    setGames(prev => prev.filter(g => g.id !== id));
  };

  const openGames = games.filter(g => g.status === 'open');
  const filteredOpenGames = filterSport === 'all' 
    ? openGames 
    : openGames.filter(g => g.sport === filterSport);

  return (
    <div className="App">
      {notification && (
        <div className="notification">
          {notification}
        </div>
      )}
      
      <Header />
      
      <main>
        <div className="container">
          <section className="game-form">
            <h2>📝 練習試合を募集する</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>チーム名 *</label>
                <input
                  type="text"
                  placeholder="例: ○○大学サッカー部"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>スポーツ種目 *</label>
                <select 
                  value={sport} 
                  onChange={(e) => setSport(e.target.value)}
                  required
                >
                  <option value="">選択してください</option>
                  {sports.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>希望日 *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>希望時間 *</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>場所 *</label>
                <input
                  type="text"
                  placeholder="例: ○○大学グラウンド"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>連絡先 *</label>
                <input
                  type="text"
                  placeholder="メールまたは電話番号"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>詳細・備考</label>
                <textarea
                  placeholder="レベル、参加人数、その他の希望など"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <button type="submit" className="submit-button">
                募集を登録
              </button>
            </form>
          </section>
          
          <section className="matches-section">
            <h2>🤝 マッチング成立</h2>
            {matches.length === 0 ? (
              <p className="no-data">まだマッチングはありません</p>
            ) : (
              <div className="match-list">
                {matches.map(match => (
                  <div key={match.id} className="match-card">
                    <div className="match-header">
                      <span className="match-badge">マッチング成立！</span>
                      <span className="match-date">
                        {match.game1.date} {match.game1.time}
                      </span>
                    </div>
                    <div className="match-teams">
                      <div className="team">
                        <h4>{match.game1.teamName}</h4>
                        <p>📍 {match.game1.location}</p>
                        <p>📧 {match.game1.contact}</p>
                      </div>
                      <div className="vs">VS</div>
                      <div className="team">
                        <h4>{match.game2.teamName}</h4>
                        <p>📍 {match.game2.location}</p>
                        <p>📧 {match.game2.contact}</p>
                      </div>
                    </div>
                    <div className="match-sport">{match.game1.sport}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
          
          <section className="game-list-section">
            <div className="section-header">
              <h2>📋 募集中の練習試合</h2>
              <div className="filter-controls">
                <label>種目でフィルター: </label>
                <select 
                  value={filterSport} 
                  onChange={(e) => setFilterSport(e.target.value)}
                >
                  <option value="all">すべて</option>
                  {sports.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {filteredOpenGames.length === 0 ? (
              <p className="no-data">募集中の練習試合はありません</p>
            ) : (
              <div className="game-grid">
                {filteredOpenGames.map(game => (
                  <div key={game.id} className="game-card">
                    <div className="game-header">
                      <h3>{game.teamName}</h3>
                      <span className="sport-badge">{game.sport}</span>
                    </div>
                    <div className="game-details">
                      <p>📅 {game.date} {game.time}</p>
                      <p>📍 {game.location}</p>
                      <p>📧 {game.contact}</p>
                      {game.description && (
                        <p className="game-description">💬 {game.description}</p>
                      )}
                    </div>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteGame(game.id)}
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};