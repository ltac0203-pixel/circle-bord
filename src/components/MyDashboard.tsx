import React from 'react';
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

interface MyDashboardProps {
  games: Game[];
  applications: Application[];
  matches: Match[];
  onApproveApplication: (application: Application) => void;
  onRejectApplication: (application: Application) => void;
}

export const MyDashboard: React.FC<MyDashboardProps> = ({
  games,
  applications,
  matches,
  onApproveApplication,
  onRejectApplication
}) => {
  const { user } = useAuth();

  if (!user?.id) {
    return (
      <div className="App">
        <Header />
        <main>
          <div className="container">
            <h2>ログインが必要です</h2>
          </div>
        </main>
      </div>
    );
  }

  const myGames = games.filter(game => game.ownerId === user.id);
  const myApplications = applications.filter(app => app.applicantId === user.id);
  const receivedApplications = applications.filter(app => 
    games.some(game => game.id === app.gameId && game.ownerId === user.id)
  );
  const myMatches = matches.filter(match => 
    match.game.ownerId === user.id || match.applicant.id === user.id
  );

  return (
    <div className="App">
      <Header />
      <main>
        <div className="container">
          <h1>📊 Myダッシュボード</h1>
          
          {/* My Posted Games */}
          <section className="my-games-section">
            <h2>🎯 投稿した募集</h2>
            {myGames.length === 0 ? (
              <p className="no-data">まだ募集を投稿していません</p>
            ) : (
              <div className="game-grid">
                {myGames.map(game => (
                  <div key={game.id} className={`game-card ${game.status === 'matched' ? 'matched' : ''}`}>
                    <div className="game-header">
                      <h3>{game.teamName}</h3>
                      <span className="sport-badge">{game.sport}</span>
                      <span className={`status-badge ${game.status}`}>
                        {game.status === 'open' ? '募集中' : 'マッチング済み'}
                      </span>
                    </div>
                    <div className="game-details">
                      <p>📅 {game.date} {game.time}</p>
                      <p>📍 {game.location}</p>
                      <p>📧 {game.contact}</p>
                      {game.description && (
                        <p className="game-description">💬 {game.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Received Applications */}
          <section className="received-applications-section">
            <h2>📥 受信した申請</h2>
            {receivedApplications.length === 0 ? (
              <p className="no-data">申請はありません</p>
            ) : (
              <div className="application-list">
                {receivedApplications.map(app => {
                  const game = games.find(g => g.id === app.gameId);
                  return (
                    <div key={app.id} className="application-card">
                      <div className="application-header">
                        <h4>{app.applicantTeamName}</h4>
                        <span className={`status-badge ${app.status}`}>
                          {app.status === 'pending' ? '審査中' : 
                           app.status === 'approved' ? '承諾済み' : '拒否済み'}
                        </span>
                      </div>
                      <div className="application-details">
                        <p><strong>対象募集:</strong> {game?.teamName} ({game?.sport})</p>
                        <p><strong>日時:</strong> {game?.date} {game?.time}</p>
                        <p><strong>申請者連絡先:</strong> {app.applicantContact}</p>
                        <p><strong>申請日:</strong> {app.appliedAt.toLocaleDateString()}</p>
                      </div>
                      {app.status === 'pending' && (
                        <div className="application-actions">
                          <button 
                            className="approve-button"
                            onClick={() => onApproveApplication(app)}
                          >
                            承諾
                          </button>
                          <button 
                            className="reject-button"
                            onClick={() => onRejectApplication(app)}
                          >
                            拒否
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* My Applications */}
          <section className="my-applications-section">
            <h2>📤 送信した申請</h2>
            {myApplications.length === 0 ? (
              <p className="no-data">申請した募集はありません</p>
            ) : (
              <div className="application-list">
                {myApplications.map(app => {
                  const game = games.find(g => g.id === app.gameId);
                  return (
                    <div key={app.id} className="application-card">
                      <div className="application-header">
                        <h4>{game?.teamName}</h4>
                        <span className={`status-badge ${app.status}`}>
                          {app.status === 'pending' ? '審査中' : 
                           app.status === 'approved' ? '承諾済み' : '拒否済み'}
                        </span>
                      </div>
                      <div className="application-details">
                        <p><strong>スポーツ:</strong> {game?.sport}</p>
                        <p><strong>日時:</strong> {game?.date} {game?.time}</p>
                        <p><strong>場所:</strong> {game?.location}</p>
                        <p><strong>申請日:</strong> {app.appliedAt.toLocaleDateString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* My Matches */}
          <section className="my-matches-section">
            <h2>🤝 成立した試合</h2>
            {myMatches.length === 0 ? (
              <p className="no-data">成立した試合はありません</p>
            ) : (
              <div className="match-list">
                {myMatches.map(match => (
                  <div key={match.id} className="match-card">
                    <div className="match-header">
                      <span className="match-badge">試合成立！</span>
                      <span className="match-date">
                        {match.game.date} {match.game.time}
                      </span>
                    </div>
                    <div className="match-teams">
                      <div className="team">
                        <h4>{match.game.teamName}</h4>
                        <p>📍 {match.game.location}</p>
                        <p>📧 {match.game.contact}</p>
                      </div>
                      <div className="vs">VS</div>
                      <div className="team">
                        <h4>{match.applicant.teamName}</h4>
                        <p>📧 {match.applicant.contact}</p>
                      </div>
                    </div>
                    <div className="match-sport">{match.game.sport}</div>
                    <div className="match-info">
                      <p>成立日: {match.matchedAt.toLocaleDateString()}</p>
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