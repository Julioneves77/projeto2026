import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTickets } from '@/hooks/useTickets';
import { useSystemStatus } from '@/components/SystemStability';
import { useUnreadEmailsCount } from '@/components/EmailSupport';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  LayoutDashboard, 
  Ticket, 
  BarChart3, 
  TrendingUp, 
  Users, 
  LogOut,
  Headset,
  Mail,
  Activity
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const { currentUser, userRole, logout } = useAuth();
  const { tickets } = useTickets();
  const systemStatus = useSystemStatus();
  const unreadEmails = useUnreadEmailsCount();

  // Contar tickets em GERAL (sem operador atribuído)
  const ticketsSemAtendimento = tickets.filter(t => t.status === 'GERAL' && !t.operador).length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'financeiro', 'atendente'] },
    { id: 'tickets', label: 'Tickets', icon: Ticket, roles: ['admin', 'financeiro', 'atendente'], badge: ticketsSemAtendimento },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3, roles: ['admin'] },
    { id: 'estatisticas', label: 'Estatísticas', icon: TrendingUp, roles: ['admin'] },
    { id: 'usuarios', label: 'Usuários', icon: Users, roles: ['admin'] },
    { id: 'suporte-email', label: 'Suporte Email', icon: Mail, roles: ['admin', 'financeiro'], badge: unreadEmails },
    { id: 'estabilidade', label: 'Estabilidade', icon: Activity, roles: ['admin', 'financeiro'], showStatus: true },
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

  const getStatusInfo = () => {
    switch (systemStatus) {
      case 'online':
        return { color: 'bg-green-500', textColor: 'text-green-500', label: 'OK' };
      case 'warning':
        return { color: 'bg-yellow-500', textColor: 'text-yellow-500', label: 'Atenção' };
      case 'offline':
        return { color: 'bg-destructive', textColor: 'text-destructive', label: 'Falha' };
      default:
        return { color: 'bg-muted', textColor: 'text-muted-foreground', label: '...' };
    }
  };

  const statusInfo = getStatusInfo();
  const badge = getRoleBadge(userRole || '');

  return (
    <header className="bg-card border-b border-border shadow-soft">
      <div className="flex items-center justify-between px-6 h-16">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <Headset className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-base leading-tight">Atendimento Virtual</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className={item.showStatus ? statusInfo.textColor : ''}>
                  {item.showStatus ? (
                    <span className={isActive ? 'text-primary-foreground' : statusInfo.textColor}>
                      {item.label}
                    </span>
                  ) : (
                    item.label
                  )}
                </span>
                
                {/* Badge de quantidade */}
                {item.badge && item.badge > 0 && (
                  <span className={`min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-xs font-bold ${
                    isActive 
                      ? 'bg-primary-foreground text-primary' 
                      : 'bg-destructive text-destructive-foreground'
                  }`}>
                    {item.badge}
                  </span>
                )}
                
                {/* Indicador de status com cor */}
                {item.showStatus && (
                  <span className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-foreground">
                {currentUser?.nome.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground leading-tight">
                {currentUser?.nome}
              </p>
              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}>
                {badge.label}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}