import React, { createContext, useState, useContext, ReactNode } from 'react';

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // デモ用: ローカルストレージから復元
    const savedUser = localStorage.getItem('demo_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const isAuthenticated = !!user;

  const signIn = async (email: string, password: string) => {
    // デモ用の簡単な認証
    // 実際のアプリではAPIを呼び出す
    
    // デモ: どんなメールアドレスとパスワードでもOK
    if (email && password) {
      const demoUser: User = {
        id: Date.now().toString(),
        email,
        name: email.split('@')[0],
        teamName: '○○大学サークル'
      };
      
      setUser(demoUser);
      localStorage.setItem('demo_user', JSON.stringify(demoUser));
    } else {
      throw new Error('メールアドレスとパスワードを入力してください');
    }
  };

  const signUp = async (email: string, password: string, name: string, teamName?: string) => {
    // デモ用の簡単な登録
    if (email && password && name) {
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name,
        teamName: teamName || '未設定'
      };
      
      setUser(newUser);
      localStorage.setItem('demo_user', JSON.stringify(newUser));
    } else {
      throw new Error('必須項目を入力してください');
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('demo_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};