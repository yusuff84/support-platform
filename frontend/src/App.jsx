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
  const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard', 'workspace', 'problems', 'knowledge', 'settings'

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
        // Default tab based on role
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Header
        user={user}
        currentTab={currentTab}
        setTab={setCurrentTab}
        onQuickRoleSwitch={handleQuickRoleSwitch}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-x-hidden bg-zinc-950">
        {currentTab === 'dashboard' && <DirectorDashboard />}
        {currentTab === 'workspace' && <OperatorWorkspace user={user} />}
        {currentTab === 'problems' && <ProblemRegisterView user={user} />}
        {currentTab === 'knowledge' && <KnowledgeBaseView user={user} />}
        {currentTab === 'settings' && <SystemSettingsView user={user} />}
      </main>
    </div>
  );
}
