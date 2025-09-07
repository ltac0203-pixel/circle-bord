import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/signin');
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-left">
          <h1>🏃 大学サークル練習試合マッチング</h1>
          <p className="header-subtitle">日時が一致する相手と自動マッチング！</p>
        </div>
        
        <div className="header-right">
          {user && (
            <>
              <div className="user-info">
                <span className="user-name">👤 {user.name}</span>
                {user.teamName && (
                  <span className="user-team">{user.teamName}</span>
                )}
              </div>
              <button 
                className="signout-button"
                onClick={handleSignOut}
              >
                サインアウト
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};