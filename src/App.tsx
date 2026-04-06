import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import Login from '@/pages/Login';
import StudentDashboard from '@/pages/StudentDashboard';
import Lessons from '@/pages/Lessons';
import Progress from '@/pages/Progress';
import SessionView from '@/pages/SessionView';
import AnkiReview from '@/pages/AnkiReview';
import AdminPanel from '@/pages/AdminPanel';
import { Toaster } from '@/components/ui/sonner';
import { Home, BookOpen, BarChart3, User } from 'lucide-react';

// Navigation item type
interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

// Bottom Navigation Component
function BottomNav({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const { t } = useLanguage();
  
  const navItems: NavItem[] = [
    { id: 'dashboard', label: t('dashboard'), icon: Home },
    { id: 'lessons', label: t('lessons'), icon: BookOpen },
    { id: 'progress', label: t('progress'), icon: BarChart3 },
    { id: 'profile', label: t('profile'), icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50">
      {/* Ajustado max-w para acompanhar o novo layout desktop */}
      <div className="max-w-full md:max-w-6xl mx-auto flex justify-around items-center h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-[#1a3673]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'stroke-[2.5px]' : ''}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Main App Content
function AppContent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<'main' | 'session' | 'anki'>('main');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sessionParams, setSessionParams] = useState<{ unitId: string; sessionId: string } | null>(null);

  const handleNavigate = (page: string, params?: unknown) => {
    switch (page) {
      case 'session':
        if (params && typeof params === 'object' && 'unitId' in params && 'sessionId' in params) {
          setSessionParams(params as { unitId: string; sessionId: string });
          setCurrentPage('session');
        }
        break;
      case 'anki':
        setCurrentPage('anki');
        break;
      case 'dashboard':
        setCurrentPage('main');
        setActiveTab('dashboard');
        break;
      default:
        setCurrentPage('main');
    }
  };

  const handleBack = () => {
    setCurrentPage('main');
    setSessionParams(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a3673]">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-3 border-white border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setCurrentPage('main')} />;
  }

  if (user?.role === 'admin') {
    return <AdminPanel onLogout={logout} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'session':
        if (sessionParams) {
          return (
            <SessionView
              unitId={sessionParams.unitId}
              sessionId={sessionParams.sessionId}
              onBack={handleBack}
              onComplete={handleBack}
            />
          );
        }
        return null;

      case 'anki':
        return <AnkiReview onBack={handleBack} />;

      case 'main':
      default:
        switch (activeTab) {
          case 'dashboard':
            return <StudentDashboard onNavigate={handleNavigate} />;
          case 'lessons':
            return <Lessons onNavigate={handleNavigate} />;
          case 'progress':
            return <Progress />;
          case 'profile':
            return (
              <div className="min-h-screen bg-[#1a3673] p-4 pb-20">
                <div className="max-w-6xl mx-auto">
                  <h1 className="text-2xl font-bold text-white mb-4">个人资料</h1>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-[#1a3673] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {user?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-lg text-[#1a3673]">{user?.name}</p>
                        <p className="text-gray-500 text-sm">{user?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={logout}
                      className="w-full py-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
                    >
                      退出登录
                    </button>
                  </div>
                </div>
              </div>
            );
          default:
            return <StudentDashboard onNavigate={handleNavigate} />;
        }
    }
  };

  return (
    <div className="min-h-screen bg-[#1a3673]">
      {/* ALTERAÇÃO: Removido max-w-md e adicionado max-w-full md:max-w-6xl para expansão */}
      <div className="w-full md:max-w-6xl mx-auto bg-[#1a3673] min-h-screen shadow-xl relative">
        {renderPage()}
        {currentPage === 'main' && <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />}
      </div>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
