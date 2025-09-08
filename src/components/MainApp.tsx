import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { MyDashboard } from './MyDashboard';
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

export const MainApp: React.FC = () => {
  const { user } = useAuth();

  // デモ用の練習試合データ
  const demoGames: Game[] = [
    {
      id: 1,
      teamName: '早稲田大学サッカー部',
      sport: 'サッカー',
      date: '2025-09-15',
      time: '14:00',
      location: '早稲田大学東伏見キャンパスグラウンド',
      contact: 'waseda.soccer@example.com',
      status: 'open',
      ownerId: 'user1',
      description: '11人制サッカーの練習試合を募集しています。レベルは大学生レベルです。'
    },
    {
      id: 2,
      teamName: '慶應義塾大学バスケットボール部',
      sport: 'バスケットボール',
      date: '2025-09-20',
      time: '16:00',
      location: '慶應義塾大学日吉キャンパス体育館',
      contact: '080-1234-5678',
      status: 'open',
      ownerId: 'user2',
      description: '5on5の練習試合です。審判は各チームから1名ずつ出していただければと思います。'
    },
    {
      id: 3,
      teamName: '東京大学テニス部',
      sport: 'テニス',
      date: '2025-09-18',
      time: '10:00',
      location: '東京大学駒場キャンパステニスコート',
      contact: 'tennis.todai@example.com',
      status: 'open',
      ownerId: 'user3'
    },
    {
      id: 4,
      teamName: '明治大学野球部',
      sport: '野球',
      date: '2025-09-22',
      time: '13:00',
      location: '明治大学府中グラウンド',
      contact: '090-9876-5432',
      status: 'open',
      ownerId: 'user4',
      description: '9回制の練習試合を行います。ボールは硬式球を使用予定です。'
    },
    {
      id: 5,
      teamName: '青山学院大学バレーボール部',
      sport: 'バレーボール',
      date: '2025-09-15',
      time: '14:00',
      location: '青山学院大学青山キャンパス第1体育館',
      contact: 'aoyama.volley@example.com',
      status: 'open',
      ownerId: 'user5',
      description: '6人制バレーボールの練習試合です。3セットマッチで行う予定です。'
    },
    {
      id: 6,
      teamName: '立教大学サッカー部',
      sport: 'サッカー',
      date: '2025-09-15',
      time: '14:00',
      location: '立教大学新座キャンパスグラウンド',
      contact: 'rikkyo.fc@example.com',
      status: 'open',
      ownerId: 'user6',
      description: '11人制サッカーです。同じレベルのチームとの対戦を希望しています。'
    },
    {
      id: 7,
      teamName: '中央大学ハンドボール部',
      sport: 'ハンドボール',
      date: '2025-09-25',
      time: '18:00',
      location: '中央大学多摩キャンパス体育館',
      contact: '080-2468-1357',
      status: 'open',
      ownerId: 'user7',
      description: '7人制ハンドボールの練習試合を希期します。平日の夜でも対応可能です。'
    },
    {
      id: 8,
      teamName: '法政大学卓球部',
      sport: '卓球',
      date: '2025-09-19',
      time: '15:30',
      location: '法政大学市ヶ谷キャンパス卓球場',
      contact: 'hosei.tt@example.com',
      status: 'open',
      ownerId: 'user8'
    },
    {
      id: 9,
      teamName: '上智大学フットサル部',
      sport: 'フットサル',
      date: '2025-09-21',
      time: '19:00',
      location: '上智大学四谷キャンパス体育館',
      contact: '070-1357-2468',
      status: 'open',
      ownerId: 'user9',
      description: '5人制フットサルです。夜の時間帯での練習試合を希望しています。'
    },
    {
      id: 10,
      teamName: '学習院大学ソフトボール部',
      sport: 'ソフトボール',
      date: '2025-09-23',
      time: '11:00',
      location: '学習院大学目白キャンパスグラウンド',
      contact: 'gakushuin.soft@example.com',
      status: 'open',
      ownerId: 'user10',
      description: '7回制のソフトボール練習試合です。ゴムボールを使用します。'
    }
  ];

  const [games, setGames] = useState<Game[]>(demoGames);
  const [applications, setApplications] = useState<Application[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleApproveApplication = (application: Application) => {
    const game = games.find(g => g.id === application.gameId);
    if (!game) return;

    // Update application status to approved
    setApplications(prev => prev.map(app => 
      app.id === application.id 
        ? { ...app, status: 'approved' as const }
        : app
    ));

    // Create a match
    const newMatch: Match = {
      id: Date.now(),
      game,
      applicant: {
        teamName: application.applicantTeamName,
        contact: application.applicantContact,
        id: application.applicantId
      },
      matchedAt: new Date()
    };

    setMatches(prev => [...prev, newMatch]);

    // Update game status to matched
    setGames(prev => prev.map(g => 
      g.id === game.id 
        ? { ...g, status: 'matched' as const }
        : g
    ));

    // Reject all other pending applications for this game
    setApplications(prev => prev.map(app => 
      app.gameId === application.gameId && app.id !== application.id && app.status === 'pending'
        ? { ...app, status: 'rejected' as const }
        : app
    ));

    showNotification(`${application.applicantTeamName}との試合が成立しました！`);
  };

  const handleRejectApplication = (application: Application) => {
    setApplications(prev => prev.map(app => 
      app.id === application.id 
        ? { ...app, status: 'rejected' as const }
        : app
    ));

    showNotification(`${application.applicantTeamName}からの申請を拒否しました。`);
  };

  return (
    <>
      {notification && (
        <div className="notification">
          {notification}
        </div>
      )}
      
      <Routes>
        <Route 
          path="/" 
          element={
            <Dashboard 
              games={games}
              setGames={setGames}
              applications={applications}
              setApplications={setApplications}
              matches={matches}
              setMatches={setMatches}
              showNotification={showNotification}
            />
          } 
        />
        <Route 
          path="/my-dashboard" 
          element={
            <MyDashboard 
              games={games}
              applications={applications}
              matches={matches}
              onApproveApplication={handleApproveApplication}
              onRejectApplication={handleRejectApplication}
            />
          } 
        />
      </Routes>
    </>
  );
};