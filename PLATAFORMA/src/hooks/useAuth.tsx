import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { usuariosBase } from '@/data/mockData';
import { safeStorage } from '@/lib/safeStorage';

const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || 'http://localhost:3001';
const SYNC_SERVER_API_KEY = import.meta.env.VITE_SYNC_SERVER_API_KEY || null;

interface AuthContextType {
  currentUser: User | null;
  userRole: UserRole | null;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  users: User[];
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: number, updates: Partial<User>) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_KEY = 'av_usuarios';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsersFromServer = async (): Promise<User[]> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (SYNC_SERVER_API_KEY) headers['X-API-Key'] = SYNC_SERVER_API_KEY;
    const res = await fetch(`${SYNC_SERVER_URL}/platform/users`, { headers });
    if (res.ok) return res.json();
    return [];
  };

  const refreshUsers = async () => {
    try {
      const serverUsers = await fetchUsersFromServer();
      if (serverUsers.length > 0) {
        setUsers(serverUsers);
        safeStorage.setItem(USERS_KEY, JSON.stringify(serverUsers));
      }
    } catch {
      // Fallback: manter localStorage
    }
  };

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const serverUsers = await fetchUsersFromServer();
        if (serverUsers.length > 0) {
          setUsers(serverUsers);
          safeStorage.setItem(USERS_KEY, JSON.stringify(serverUsers));
          return;
        }
      } catch {
        // Servidor indisponível, usar localStorage
      }
      const stored = safeStorage.getItem(USERS_KEY);
      if (stored) {
        try {
          setUsers(JSON.parse(stored));
        } catch {
          setUsers(usuariosBase);
        }
      } else {
        setUsers(usuariosBase);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    const storedUser = safeStorage.getItem('av_current_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const userExists = users.find((u: User) => u.id === user.id && u.email === user.email);
        if (userExists || users.length === 0) {
          setCurrentUser(user);
        } else {
          safeStorage.removeItem('av_current_user');
          setCurrentUser(null);
        }
      } catch {
        safeStorage.removeItem('av_current_user');
      }
    }
  }, [users]);

  const login = async (email: string, senha: string): Promise<boolean> => {
    const tryLocalFallback = () => {
      const list = users.length > 0 ? users : usuariosBase;
      const user = list.find(u => u.email === email && u.senha === senha && (u.status || 'ativo') === 'ativo');
      if (user) {
        const { senha: _, ...userSemSenha } = user;
        setCurrentUser(userSemSenha);
        safeStorage.setItem('av_current_user', JSON.stringify(userSemSenha));
        return true;
      }
      return false;
    };

    try {
      const res = await fetch(`${SYNC_SERVER_URL}/platform/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        safeStorage.setItem('av_current_user', JSON.stringify(user));
        return true;
      }
      // Servidor retornou erro (401, 404, 500) - tentar fallback local
      return tryLocalFallback();
    } catch {
      // Erro de rede - tentar fallback local
      return tryLocalFallback();
    }
  };

  const logout = () => {
    setCurrentUser(null);
    safeStorage.removeItem('av_current_user');
  };

  const addUser = async (userData: Omit<User, 'id'>) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (SYNC_SERVER_API_KEY) headers['X-API-Key'] = SYNC_SERVER_API_KEY;
      const res = await fetch(`${SYNC_SERVER_URL}/platform/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify(userData),
      });
      if (res.ok) {
        const newUser = await res.json();
        setUsers(prev => {
          const next = [...prev, newUser];
          safeStorage.setItem(USERS_KEY, JSON.stringify(next));
          return next;
        });
        return;
      }
    } catch {
      // Fallback local
    }
    const newId = Math.max(...users.map(u => u.id), 0) + 1;
    const newUser: User = { ...userData, id: newId };
    const newUsers = [...users, newUser];
    setUsers(newUsers);
    safeStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
  };

  const updateUser = async (id: number, updates: Partial<User>) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (SYNC_SERVER_API_KEY) headers['X-API-Key'] = SYNC_SERVER_API_KEY;
      const res = await fetch(`${SYNC_SERVER_URL}/platform/users/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers(prev => {
          const next = prev.map(u => u.id === id ? updated : u);
          safeStorage.setItem(USERS_KEY, JSON.stringify(next));
          return next;
        });
        return;
      }
    } catch {
      // Fallback local
    }
    const updated = users.map(u => u.id === id ? { ...u, ...updates } : u);
    setUsers(updated);
    safeStorage.setItem(USERS_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      userRole: currentUser?.role || null,
      login,
      logout,
      users,
      addUser,
      updateUser,
      refreshUsers
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
