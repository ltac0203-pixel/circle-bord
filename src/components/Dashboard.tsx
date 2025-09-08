import React, { useState } from 'react';
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
  ownerId: string;
  description?: string;
}

interface Application {
  id: number;
  gameId: number;
  applicantTeamName: string;
  applicantContact: string;
  applicantId: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: Date;
  message?: string;
}

interface Match {
  id: number;
  game: Game;
  applicant: {
    teamName: string;
    contact: string;
    id: string;
  };
  matchedAt: Date;
}

interface DashboardProps {
  games: Game[];
  setGames: React.Dispatch<React.SetStateAction<Game[]>>;
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  showNotification: (message: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  games,
  setGames,
  applications,
  setApplications,
  matches,
  setMatches,
  showNotification
}) => {
  const { user } = useAuth();
  
  const [teamName, setTeamName] = useState(user?.teamName || '');
  const [sport, setSport] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState(user?.email || '');
  const [description, setDescription] = useState('');
  const [filterSport, setFilterSport] = useState('all');

  const sports = [
    'サッカー', 'バスケットボール', 'バレーボール', 'テニス',
    '野球', 'ソフトボール', 'バドミントン', '卓球',
    'ハンドボール', 'フットサル', 'その他'
  ];

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
      status: 'open',
      ownerId: user?.id || 'anonymous'
    };
    
    setGames([...games, newGame]);
    
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
    setMatches(prev => prev.filter(m => 
      m.game.id !== id
    ));
    
    setApplications(prev => prev.filter(a => a.gameId !== id));
    
    setGames(prev => prev.filter(g => g.id !== id));
  };

  const handleApplyToGame = (game: Game) => {
    if (!user?.id) {
      alert('ログインが必要です。');
      return;
    }

    if (game.ownerId === user.id) {
      alert('自分の募集には申請できません。');
      return;
    }

    const existingApplication = applications.find(
      app => app.gameId === game.id && app.applicantId === user.id
    );

    if (existingApplication) {
      alert('既にこの募集に申請済みです。');
      return;
    }

    const newApplication: Application = {
      id: Date.now(),
      gameId: game.id,
      applicantTeamName: user.teamName || teamName || 'Unknown Team',
      applicantContact: user.email || contact,
      applicantId: user.id,
      status: 'pending',
      appliedAt: new Date(),
      message: ''
    };

    setApplications(prev => [...prev, newApplication]);
    showNotification(`${game.teamName}に申請を送信しました！`);
  };

  const openGames = games.filter(g => g.status === 'open');
  const filteredOpenGames = filterSport === 'all' 
    ? openGames 
    : openGames.filter(g => g.sport === filterSport);

  return (
    <div className="App">
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
                    <div className="game-actions">
                      {game.ownerId === user?.id ? (
                        <button 
                          className="delete-button"
                          onClick={() => handleDeleteGame(game.id)}
                        >
                          削除
                        </button>
                      ) : (
                        <button 
                          className="apply-button"
                          onClick={() => handleApplyToGame(game)}
                          disabled={applications.some(
                            app => app.gameId === game.id && app.applicantId === user?.id
                          )}
                        >
                          {applications.some(
                            app => app.gameId === game.id && app.applicantId === user?.id
                          ) ? '申請済み' : '申請する'}
                        </button>
                      )}
                    </div>
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