'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { DashboardView } from '@/components/dashboard-view';
import ReportsView from '@/components/reports-view';
import { AnalysisView } from '@/components/analysis-view';
import { SettingsView } from '@/components/settings-view';
import { Chatbot } from '@/components/chatbot';
export default function DashboardLayout() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'reports':
        return <ReportsView />;
      case 'analysis':
        return <AnalysisView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          {renderActiveView()}
        </main>
      </div>
      <Chatbot/>
    </div>
  );
}