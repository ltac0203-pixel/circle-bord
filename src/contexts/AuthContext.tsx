import React, { createContext, useState, useContext, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
  teamName?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, teamName?: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const isAuthenticated = !!user;

  const signIn = async (email: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:3001/api/login', { email, password });
      const userData = response.data.user;
      
      const appUser: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        teamName: userData.teamName
      };

      setUser(appUser);
      localStorage.setItem('user', JSON.stringify(appUser));
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'サインインに失敗しました。');
      }
      throw new Error('サインイン中に不明なエラーが発生しました。');
    }
  };

  const signUp = async (email: string, password: string, name: string, teamName?: string) => {
    // TODO: サインアップ機能もバックエンドに接続する必要があります
    if (email && password && name) {
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name,
        teamName: teamName || '未設定'
      };
      
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      throw new Error('必須項目を入力してください');
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};