import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  Ticket, 
  BarChart3, 
  TrendingUp, 
  Users, 
  LogOut,
  Headset
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { currentUser, userRole, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'financeiro', 'atendente'] },
    { id: 'tickets', label: 'Tickets', icon: Ticket, roles: ['admin', 'financeiro', 'atendente'] },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3, roles: ['admin'] },
    { id: 'estatisticas', label: 'Estatísticas', icon: TrendingUp, roles: ['admin'] },
    { id: 'usuarios', label: 'Usuários', icon: Users, roles: ['admin'] },
  ];

  const visibleItems = menuItems.filter(item => item.roles.includes(userRole || ''));

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      admin: { label: 'Admin', className: 'bg-status-priority text-primary-foreground' },
      financeiro: { label: 'Financeiro', className: 'bg-status-financial text-foreground' },
      atendente: { label: 'Atendente', className: 'bg-status-progress text-primary-foreground' },
    };
    return badges[role] || { label: role, className: 'bg-muted' };
  };

  const badge = getRoleBadge(userRole || '');

  return (
    <aside className="w-64 bg-sidebar h-screen flex flex-col shadow-strong">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sidebar-primary rounded-xl flex items-center justify-center">
            <Headset className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground text-lg">Atendimento</h1>
            <p className="text-xs text-sidebar-foreground/60">Virtual</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`sidebar-item w-full ${isActive ? 'sidebar-item-active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 bg-sidebar-accent rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-sidebar-foreground">
              {currentUser?.nome.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {currentUser?.nome}
            </p>
            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}>
              {badge.label}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="sidebar-item w-full text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
