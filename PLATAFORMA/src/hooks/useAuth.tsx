import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { usuariosBase } from '@/data/mockData';
import { safeStorage } from '@/lib/safeStorage';

interface AuthContextType {
  currentUser: User | null;
  userRole: UserRole | null;
  login: (email: string, senha: string) => boolean;
  logout: () => void;
  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: number, updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_KEY = 'av_usuarios';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const stored = safeStorage.getItem(USERS_KEY);
    if (stored) {
      try {
        setUsers(JSON.parse(stored));
      } catch {
        setUsers(usuariosBase);
        safeStorage.setItem(USERS_KEY, JSON.stringify(usuariosBase));
      }
    } else {
      setUsers(usuariosBase);
      safeStorage.setItem(USERS_KEY, JSON.stringify(usuariosBase));
    }
  }, []);

  // Validar e carregar usuário logado após usuários serem carregados
  useEffect(() => {
    if (users.length === 0) return; // Aguardar usuários serem carregados
    
    const storedUser = safeStorage.getItem('av_current_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const userExists = users.find((u: User) => u.id === user.id && u.email === user.email && u.status === 'ativo');
        if (userExists) {
          setCurrentUser(user);
        } else {
          safeStorage.removeItem('av_current_user');
        }
      } catch {
        safeStorage.removeItem('av_current_user');
      }
    }
  }, [users]);

  const saveUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    safeStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
  };

  const login = (email: string, senha: string): boolean => {
    const user = users.find(u => u.email === email && u.senha === senha && u.status === 'ativo');
    if (user) {
      setCurrentUser(user);
      safeStorage.setItem('av_current_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    safeStorage.removeItem('av_current_user');
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newId = Math.max(...users.map(u => u.id), 0) + 1;
    const newUser: User = { ...userData, id: newId };
    saveUsers([...users, newUser]);
  };

  const updateUser = (id: number, updates: Partial<User>) => {
    const updated = users.map(u => u.id === id ? { ...u, ...updates } : u);
    saveUsers(updated);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      userRole: currentUser?.role || null,
      login,
      logout,
      users,
      addUser,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
