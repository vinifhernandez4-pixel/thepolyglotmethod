import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@/types';
import Database from '@/lib/database';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    wechat?: string;
    selectedLanguageId?: string;
    selectedBookId?: string;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Initialize database
      await Database.init();
      await Database.seedDemoData();
      
      // Check for existing session
      const currentUser = await Database.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const users = await Database.getUsers();
    const foundUser = users.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      setUser(foundUser);
      await Database.setCurrentUser(foundUser);
      return { success: true, message: '登录成功' };
    }
    
    return { success: false, message: '邮箱或密码错误' };
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    wechat?: string;
    selectedLanguageId?: string;
    selectedBookId?: string;
  }) => {
    // Check if email already exists
    const existingUser = await Database.getUserByEmail(userData.email);
    if (existingUser) {
      return { success: false, message: '该邮箱已被注册' };
    }

    // Create new user
    const newUser = await Database.createUser({
      ...userData,
      role: 'student',
    });

    setUser(newUser);
    await Database.setCurrentUser(newUser);
    return { success: true, message: '注册成功' };
  };

  const logout = () => {
    setUser(null);
    Database.setCurrentUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      const updated = await Database.updateUser(user.id, updates);
      if (updated) {
        setUser(updated);
        await Database.setCurrentUser(updated);
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
