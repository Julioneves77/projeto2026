import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { usuariosBase } from '@/data/mockData';

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
    // Carregar usuários
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) {
      setUsers(JSON.parse(stored));
    } else {
      setUsers(usuariosBase);
      localStorage.setItem(USERS_KEY, JSON.stringify(usuariosBase));
    }
  }, []);

  // Validar e carregar usuário logado após usuários serem carregados
  useEffect(() => {
    if (users.length === 0) return; // Aguardar usuários serem carregados
    
    const storedUser = localStorage.getItem('av_current_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        // Validar que o usuário ainda existe na lista e está ativo
        const userExists = users.find((u: User) => u.id === user.id && u.email === user.email && u.status === 'ativo');
        if (userExists) {
          setCurrentUser(user);
        } else {
          // Usuário não existe mais ou está inativo, limpar localStorage
          localStorage.removeItem('av_current_user');
        }
      } catch (error) {
        console.warn('Erro ao carregar usuário do localStorage:', error);
        localStorage.removeItem('av_current_user');
      }
    }
  }, [users]);

  const saveUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
  };

  const login = (email: string, senha: string): boolean => {
    const user = users.find(u => u.email === email && u.senha === senha && u.status === 'ativo');
    if (user) {
      setCurrentUser(user);
      // Salvar usuário logado no localStorage
      localStorage.setItem('av_current_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    // Remover usuário logado do localStorage
    localStorage.removeItem('av_current_user');
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
