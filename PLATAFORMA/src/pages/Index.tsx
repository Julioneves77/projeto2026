import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Login } from '@/components/Login';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { Tickets } from '@/components/Tickets';
import { Users } from '@/components/Users';
import { Statistics } from '@/components/Statistics';
import { Reports } from '@/components/Reports';
import { EmailSupport } from '@/components/EmailSupport';
import { SystemStability } from '@/components/SystemStability';
import { CopiesAds } from '@/components/CopiesAds';

const Index = () => {
  const { currentUser } = useAuth();
  // Carregar aba ativa do localStorage
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('av_active_tab');
    const validTabs = ['dashboard', 'tickets', 'usuarios', 'estatisticas', 'relatorios', 'suporte-email', 'ads', 'estabilidade'];
    return (saved && validTabs.includes(saved)) ? saved : 'dashboard';
  });

  // Salvar aba ativa quando mudar
  useEffect(() => {
    localStorage.setItem('av_active_tab', activeTab);
  }, [activeTab]);

  if (!currentUser) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'tickets':
        return <Tickets />;
      case 'usuarios':
        return <Users />;
      case 'estatisticas':
        return <Statistics />;
      case 'relatorios':
        return <Reports />;
      case 'suporte-email':
        return <EmailSupport />;
      case 'ads':
        return <CopiesAds />;
      case 'estabilidade':
        return <SystemStability />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 p-6 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
