import React, { useState } from 'react';
import './App.css';

// 試合情報の型を定義
interface Game {
  id: number;
  teamName: string;
  date: string;
  time: string;
  location: string;
}

function App() {
  // 試合リストを管理するためのstate
  const [games, setGames] = useState<Game[]>([]);
  // フォームの入力を管理するためのstate
  const [teamName, setTeamName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');

  // フォームの送信処理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || !date || !time || !location) {
      alert('すべての項目を入力してください。');
      return;
    }
    const newGame: Game = {
      id: Date.now(),
      teamName,
      date,
      time,
      location,
    };
    setGames([...games, newGame]);
    // フォームをリセット
    setTeamName('');
    setDate('');
    setTime('');
    setLocation('');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>大学サークル練習試合マッチング</h1>
      </header>
      <main>
        <div className="game-form">
          <h2>練習試合を登録</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="チーム名"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <input
              type="text"
              placeholder="場所"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button type="submit">登録</button>
          </form>
        </div>
        <div className="game-list">
          <h2>登録中の練習試合</h2>
          <ul>
            {games.map((game) => (
              <li key={game.id}>
                <strong>{game.teamName}</strong> - {game.date} {game.time} @ {game.location}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;
