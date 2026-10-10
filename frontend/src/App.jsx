import React, { useState, useEffect } from 'react';
import { api, getToken, setToken } from './api';
import Header from './components/Header';
import DirectorDashboard from './components/DirectorDashboard';
import OperatorWorkspace from './components/OperatorWorkspace';
import ProblemRegisterView from './components/ProblemRegisterView';
import KnowledgeBaseView from './components/KnowledgeBaseView';
import SystemSettingsView from './components/SystemSettingsView';
import LoginModal from './components/LoginModal';

const DEMO_CREDENTIALS = {
  director: { username: 'director', password: 'director123' },
  lead: { username: 'lead', password: 'lead123' },
  agent: { username: 'agent', password: 'agent123' },
  superroot: { username: 'superroot', password: 'admin123' }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await api.auth.me();
        setUser(me);
        if (me.role === 'support_agent') {
          setCurrentTab('workspace');
        } else {
          setCurrentTab('dashboard');
        }
      } catch (err) {
        console.warn('Auth token expired or invalid:', err);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    if (loggedInUser.role === 'support_agent') {
      setCurrentTab('workspace');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
  };

  const handleQuickRoleSwitch = async (targetRole) => {
    const creds = DEMO_CREDENTIALS[targetRole];
    if (!creds) return;
    try {
      const data = await api.auth.login(creds.username, creds.password);
      setToken(data.access_token);
      setUser(data.user);
      if (data.user.role === 'support_agent') {
        setCurrentTab('workspace');
      } else if (currentTab === 'settings' && data.user.role !== 'superroot') {
        setCurrentTab('dashboard');
      }
    } catch (err) {
      console.error('Quick role switch failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-150">
      <Header
        user={user}
        currentTab={currentTab}
        setTab={(tab) => {
          setCurrentTab(tab);
          setMobileChatOpen(false);
        }}
        onQuickRoleSwitch={handleQuickRoleSwitch}
        onLogout={handleLogout}
        hideMobileBottomBar={currentTab === 'workspace' && mobileChatOpen}
      />

      <main className="flex-1 overflow-x-hidden min-h-0 flex flex-col">
        {currentTab === 'dashboard' && <DirectorDashboard />}
        {currentTab === 'workspace' && <OperatorWorkspace user={user} onMobileChatChange={setMobileChatOpen} />}
        {currentTab === 'problems' && <ProblemRegisterView user={user} />}
        {currentTab === 'knowledge' && <KnowledgeBaseView user={user} />}
        {currentTab === 'settings' && <SystemSettingsView user={user} />}
      </main>
    </div>
  );
}
