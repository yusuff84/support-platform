import React, { useState, useEffect } from 'react';
import { api, getToken, setToken } from './api';
import Header from './components/Header';
import DirectorDashboard from './components/DirectorDashboard';
import OperatorWorkspace from './components/OperatorWorkspace';
import ProblemRegisterView from './components/ProblemRegisterView';
import KnowledgeBaseView from './components/KnowledgeBaseView';
import SystemSettingsView from './components/SystemSettingsView';
import LoginModal from './components/LoginModal';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-zinc-50 dark:bg-zinc-950">
          <div className="p-3 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono">
            Произошла ошибка при загрузке вкладки
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md font-mono bg-zinc-100 dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
            {this.state.error?.message || "Неизвестная ошибка интерфейса"}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold shadow-xs hover:opacity-90"
          >
            Перезагрузить страницу
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-150">
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

      <main className="flex-1 min-h-0 overflow-hidden flex flex-col relative">
        <ErrorBoundary>
          {currentTab === 'dashboard' && <div className="h-full overflow-y-auto"><DirectorDashboard /></div>}
          {currentTab === 'workspace' && <OperatorWorkspace user={user} onMobileChatChange={setMobileChatOpen} />}
          {currentTab === 'problems' && <div className="h-full overflow-y-auto"><ProblemRegisterView user={user} /></div>}
          {currentTab === 'knowledge' && <div className="h-full overflow-y-auto"><KnowledgeBaseView user={user} /></div>}
          {currentTab === 'settings' && <div className="h-full overflow-y-auto"><SystemSettingsView user={user} /></div>}
        </ErrorBoundary>
      </main>
    </div>
  );
}
