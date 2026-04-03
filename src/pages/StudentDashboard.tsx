import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Database from '@/lib/database';
import type { Unit, Group, UserAnkiCard, UserStats, Book, Language, UserProgress } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Flame, Clock, BookOpen, Target, 
  AlertCircle, TrendingUp, Lock, CheckCircle2
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (page: string, params?: unknown) => void;
}

export default function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [group, setGroup] = useState<Group | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [_language, setLanguage] = useState<Language | null>(null);
  const [unlockedUnits, setUnlockedUnits] = useState<Unit[]>([]);
  const [dueCards, setDueCards] = useState<UserAnkiCard[]>([]);
  const [newCards, setNewCards] = useState<UserAnkiCard[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [currentUnit, setCurrentUnit] = useState<Unit | null>(null);
  const [completedUnitIds, setCompletedUnitIds] = useState<Set<string>>(new Set());
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setIsLoading(true);

      try {
        // Get user's group
        const userGroup = user.groupId ? await Database.getGroupById(user.groupId) : null;
        setGroup(userGroup ?? null);

        // Get book and language
        const userBook = user.selectedBookId ? await Database.getBookById(user.selectedBookId) : null;
        setBook(userBook ?? null);
        
        if (userBook) {
          const userLanguage = await Database.getLanguageById(userBook.languageId);
          setLanguage(userLanguage ?? null);
        }

        // Get all units for the book
        if (userBook) {
          const allUnits = (await Database.getUnitsByBook(userBook.id)).sort((a, b) => a.order - b.order);

          // Get unlocked units
          let unlocked: Unit[] = [];
          if (userGroup) {
            unlocked = allUnits.filter(u => userGroup.unlockedUnitIds.includes(u.id));
          }
          
          // First unit is always free
          if (allUnits.length > 0 && !unlocked.find(u => u.id === allUnits[0].id)) {
            unlocked = [allUnits[0], ...unlocked];
          }
          
          // Sort by order
          unlocked = unlocked.sort((a, b) => a.order - b.order);
          setUnlockedUnits(unlocked);

          // Get user progress
          const progress = await Database.getUserProgress(user.id);
          setUserProgress(progress);
          
          const completedIds = new Set<string>();
          
          unlocked.forEach(unit => {
            const unitSessions = unit.sessions.length;
            const completedSessions = progress.filter(p => 
              p.unitId === unit.id && p.completed
            ).length;
            if (completedSessions >= unitSessions && unitSessions > 0) {
              completedIds.add(unit.id);
            }
          });
          setCompletedUnitIds(completedIds);

          // Find current unit (first incomplete in order)
          const firstIncomplete = unlocked.find(u => !completedIds.has(u.id));
          setCurrentUnit(firstIncomplete || unlocked[unlocked.length - 1] || null);
        }

        // Get Anki cards
        const due = await Database.getDueCards(user.id);
        setDueCards(due);
        
        const newC = await Database.getNewCards(user.id);
        setNewCards(newC);

        // Get stats
        const userStats = await Database.getUserStats(user.id);
        setStats(userStats ?? null);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
      
      setIsLoading(false);
    };

    loadData();
  }, [user]);

  const handleStartSession = (sessionId: string) => {
    if (currentUnit) {
      onNavigate('session', { unitId: currentUnit.id, sessionId });
    }
  };

  const handleReviewAnki = () => {
    onNavigate('anki');
  };

  const getSessionProgress = () => {
    if (!currentUnit || !user) return 0;
    const totalSessions = currentUnit.sessions.length;
    if (totalSessions === 0) return 0;
    const completedSessions = userProgress.filter(p => 
      p.unitId === currentUnit.id && p.completed
    ).length;
    return (completedSessions / totalSessions) * 100;
  };

  const isUnitCompleted = (unit: Unit) => completedUnitIds.has(unit.id);

  const getNextUnlockableUnit = async () => {
    if (!group || !book) return null;
    const allUnits = (await Database.getUnitsByBook(book.id)).sort((a, b) => a.order - b.order);
    return allUnits.find(u => !group.unlockedUnitIds.includes(u.id));
  };

  const [nextUnlockable, setNextUnlockable] = useState<Unit | null>(null);
  
  useEffect(() => {
    const loadNextUnlockable = async () => {
      const unit = await getNextUnlockableUnit();
      setNextUnlockable(unit ?? null);
    };
    loadNextUnlockable();
  }, [group, book]);

  const progressPercent = unlockedUnits.length > 0 
    ? (completedUnitIds.size / unlockedUnits.length) * 100 
    : 0;

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a3673] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white/70">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a3673] pb-20">
      {/* Header with Logo */}
      <div className="bg-gradient-to-br from-[#1a3673] to-[#0f1f42] text-white p-4 pb-6">
        {/* Logo and Welcome */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 flex-shrink-0">
            <img 
              src="/logofinal.png" 
              alt="Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=PM&backgroundColor=1a3673';
              }}
            />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{t('welcome')}, {user.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#c5a059]/30 px-3 py-1.5 rounded-full">
              <Flame className="w-4 h-4 text-[#c5a059]" />
              <span className="text-sm font-semibold">{stats?.streakDays || 0}</span>
            </div>
          </div>
        </div>

        {/* Anki Banner */}
        {(dueCards.length > 0 || newCards.length > 0) && (
          <div 
            className="bg-gradient-to-r from-[#c5a059] to-[#d4b068] rounded-xl p-4 cursor-pointer transform transition hover:scale-[1.02] shadow-lg"
            onClick={handleReviewAnki}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold">{t('cardsToReview')}</p>
                  <p className="text-white/80 text-sm">
                    {dueCards.length > 0 && `${dueCards.length} 待复习`}
                    {dueCards.length > 0 && newCards.length > 0 && ' · '}
                    {newCards.length > 0 && `${newCards.length} 新卡片`}
                  </p>
                </div>
              </div>
              <Button size="sm" className="bg-white text-[#c5a059] hover:bg-white/90 font-semibold">
                {t('reviewNow')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="px-4 -mt-2">
        {/* Current Unit Card */}
        {currentUnit && (
          <Card className="border-0 shadow-xl mb-6 bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t('continueLearning')}</p>
                  <CardTitle className="text-lg text-[#1a3673]">{currentUnit.name}</CardTitle>
                </div>
                <Badge className="bg-[#c5a059]/20 text-[#c5a059] border-0">
                  {Math.round(getSessionProgress())}%
                </Badge>
              </div>
              <Progress value={getSessionProgress()} className="h-2 mt-2 bg-gray-100" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {currentUnit.sessions.sort((a, b) => a.order - b.order).map((session) => {
                  const isCompleted = userProgress.some(p => p.sessionId === session.id && p.completed);
                  const isClickable = true; // All sessions are available in current unit
                  
                  return (
                    <button
                      key={session.id}
                      onClick={() => isClickable && handleStartSession(session.id)}
                      disabled={!isClickable}
                      className={`
                        p-3 rounded-xl text-left transition-all
                        ${isCompleted 
                          ? 'bg-emerald-50 border-2 border-emerald-200' 
                          : 'bg-white border-2 border-[#1a3673] hover:bg-[#1a3673]/5'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{session.emoji}</span>
                        {isCompleted && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                      <p className={`text-sm font-medium ${
                        isCompleted ? 'text-emerald-700' : 'text-gray-700'
                      }`}>
                        {session.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Unit Progress Path */}
        {unlockedUnits.length > 0 && (
          <Card className="border-0 shadow-lg mb-6 bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-[#1a3673]">学习进度</CardTitle>
                <TrendingUp className="w-4 h-4 text-[#c5a059]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <Progress value={progressPercent} className="h-3 bg-gray-100" />
                </div>
                <span className="text-sm font-semibold text-[#1a3673]">
                  {completedUnitIds.size} / {unlockedUnits.length}
                </span>
              </div>
              
              {/* Unit Path */}
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {unlockedUnits.map((unit, idx) => {
                  const isCompleted = isUnitCompleted(unit);
                  const isCurrent = currentUnit?.id === unit.id;
                  
                  return (
                    <div 
                      key={unit.id}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg transition-colors
                        ${isCompleted ? 'bg-emerald-50' : isCurrent ? 'bg-[#1a3673]/10' : 'bg-gray-50'}
                      `}
                    >
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                        ${isCompleted ? 'bg-emerald-500 text-white' : 
                          isCurrent ? 'bg-[#1a3673] text-white' : 'bg-gray-200 text-gray-500'}
                      `}>
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium text-sm ${
                          isCompleted ? 'text-emerald-700' : isCurrent ? 'text-[#1a3673]' : 'text-gray-600'
                        }`}>
                          {unit.name}
                        </p>
                      </div>
                      {isCurrent && (
                        <Badge className="bg-[#c5a059] text-white border-0 text-xs">当前</Badge>
                      )}
                      {isCompleted && (
                        <Badge className="bg-emerald-500 text-white border-0 text-xs">已完成</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-3 text-center">
              <Clock className="w-5 h-5 mx-auto mb-1 text-[#1a3673]" />
              <p className="text-lg font-bold text-[#1a3673]">{Math.floor((stats?.totalStudyTime || 0) / 60)}</p>
              <p className="text-xs text-gray-500">{t('hours')}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-3 text-center">
              <BookOpen className="w-5 h-5 mx-auto mb-1 text-[#c5a059]" />
              <p className="text-lg font-bold text-[#1a3673]">{stats?.totalWordsLearned || 0}</p>
              <p className="text-xs text-gray-500">{t('words')}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-3 text-center">
              <Target className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
              <p className="text-lg font-bold text-[#1a3673]">{completedUnitIds.size}</p>
              <p className="text-xs text-gray-500">已完成</p>
            </CardContent>
          </Card>
        </div>

        {/* Next Unit Preview */}
        {nextUnlockable && group && (
          <Card className="border-0 shadow-sm bg-white/10 border border-white/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-[#c5a059] mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-white">下一个单元</p>
                  <p className="text-sm text-white/70">{nextUnlockable.name}</p>
                  <p className="text-xs text-white/50 mt-1">
                    完成当前单元后即可解锁
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Group Message */}
        {!group && (
          <Card className="border-0 shadow-sm bg-amber-50 border border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">尚未分配课程</p>
                  <p className="text-sm text-amber-700">请将您的用户名告知学校以便继续学习。</p>
                  <p className="text-xs text-amber-600 mt-1">
                    如果您还不是学生，请联系我们了解多语者方法论的语言课程。
                  </p>
                  <a 
                    href="https://xhslink.com/m/7uum8WeBuhR"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-3 text-red-500 hover:text-red-600 text-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                    关注我们的小红书
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
