import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Database from '@/lib/database';
import type { Unit, Book, Language, UserProgress } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Lock, Play, RotateCcw, ChevronRight, BookOpen } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface LessonsProps {
  onNavigate: (page: string, params?: unknown) => void;
}

export default function Lessons({ onNavigate }: LessonsProps) {
  const { user } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [unlockedUnitIds, setUnlockedUnitIds] = useState<Set<string>>(new Set());
  const [completedUnitIds, setCompletedUnitIds] = useState<Set<string>>(new Set());
  const [book, setBook] = useState<Book | null>(null);
  const [language, setLanguage] = useState<Language | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setIsLoading(true);

      try {
        const userBook = user.selectedBookId ? await Database.getBookById(user.selectedBookId) : null;
        setBook(userBook ?? null);

        if (userBook) {
          const userLanguage = await Database.getLanguageById(userBook.languageId);
          setLanguage(userLanguage ?? null);

          // Get all units for the book
          const allUnits = (await Database.getUnitsByBook(userBook.id)).sort((a, b) => a.order - b.order);
          setUnits(allUnits);

          // Get unlocked units
          const userGroup = user.groupId ? await Database.getGroupById(user.groupId) : null;
          let unlocked = new Set<string>();
          
          if (userGroup) {
            userGroup.unlockedUnitIds.forEach(id => unlocked.add(id));
          }
          
          // First unit is always free
          if (allUnits.length > 0) {
            unlocked.add(allUnits[0].id);
          }
          
          setUnlockedUnitIds(unlocked);

          // Get user progress
          const progress = await Database.getUserProgress(user.id);
          setUserProgress(progress);
          
          const completed = new Set<string>();
          
          allUnits.forEach(unit => {
            const unitSessions = unit.sessions.length;
            const completedSessions = progress.filter(p => 
              p.unitId === unit.id && p.completed
            ).length;
            if (completedSessions >= unitSessions && unitSessions > 0) {
              completed.add(unit.id);
            }
          });
          setCompletedUnitIds(completed);
        }
      } catch (error) {
        console.error('Error loading lessons data:', error);
      }
      
      setIsLoading(false);
    };

    loadData();
  }, [user]);

  const getUnitProgress = (unit: Unit) => {
    if (!user) return 0;
    const totalSessions = unit.sessions.length;
    if (totalSessions === 0) return 0;
    const completedSessions = userProgress.filter(p => 
      p.unitId === unit.id && p.completed
    ).length;
    return (completedSessions / totalSessions) * 100;
  };

  const isUnitUnlocked = (unit: Unit) => unlockedUnitIds.has(unit.id);
  const isUnitCompleted = (unit: Unit) => completedUnitIds.has(unit.id);

  const handleStartSession = (unitId: string, sessionId: string) => {
    onNavigate('session', { unitId, sessionId });
  };

  const handleRetryUnit = (unit: Unit) => {
    // Start from first session
    if (unit.sessions.length > 0) {
      handleStartSession(unit.id, unit.sessions[0].id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a3673] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white/70">加载中...</p>
        </div>
      </div>
    );
  }

  if (selectedUnit) {
    return (
      <div className="min-h-screen bg-[#1a3673] pb-20">
        {/* Header */}
        <header className="bg-[#1a3673] border-b border-white/10 px-4 h-14 flex items-center">
          <button 
            onClick={() => setSelectedUnit(null)}
            className="flex items-center gap-1 text-white/80 hover:text-white"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
            <span className="text-sm font-medium">返回</span>
          </button>
          <h1 className="ml-4 text-white font-semibold">{selectedUnit.name}</h1>
        </header>

        {/* Sessions List */}
        <div className="p-4">
          <Card className="border-0 shadow-lg bg-white mb-4">
            <CardHeader>
              <CardTitle className="text-lg text-[#1a3673]">选择环节</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedUnit.sessions.sort((a, b) => a.order - b.order).map((session) => {
                  const isCompleted = userProgress.some(p => p.sessionId === session.id && p.completed);
                  
                  return (
                    <div 
                      key={session.id}
                      onClick={() => handleStartSession(selectedUnit.id, session.id)}
                      className={`
                        flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all
                        ${isCompleted 
                          ? 'bg-emerald-50 border-2 border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-gray-50 border-2 border-gray-200 hover:border-[#1a3673] hover:bg-[#1a3673]/5'
                        }
                      `}
                    >
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center text-xl
                        ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-[#1a3673] text-white'}
                      `}>
                        {session.emoji}
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${isCompleted ? 'text-emerald-700' : 'text-[#1a3673]'}`}>
                          {session.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {isCompleted ? '已完成' : '点击开始学习'}
                        </p>
                      </div>
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <Play className="w-6 h-6 text-[#1a3673]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Retry Button */}
          {isUnitCompleted(selectedUnit) && (
            <Button 
              onClick={() => handleRetryUnit(selectedUnit)}
              className="w-full h-12 bg-[#c5a059] hover:bg-[#b08d4b] text-white font-semibold"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              重新学习本单元
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a3673] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1a3673] to-[#0f1f42] text-white p-4 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold mb-1">课程</h1>
            <p className="text-white/60 text-sm">
              {language?.name} · {book?.name}
            </p>
          </div>
          <div className="w-10 h-10">
            <img 
              src="/logofinal.png" 
              alt="Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=PM&backgroundColor=1a3673';
              }}
            />
          </div>
        </div>
      </div>

      {/* Units List */}
      <div className="px-4 -mt-2">
        <div className="space-y-3">
          {units.map((unit, idx) => {
            const isUnlocked = isUnitUnlocked(unit);
            const isCompleted = isUnitCompleted(unit);
            const progress = getUnitProgress(unit);
            
            return (
              <Card 
                key={unit.id} 
                className={`
                  border-0 shadow-lg overflow-hidden
                  ${!isUnlocked ? 'opacity-70' : ''}
                `}
              >
                <div 
                  className={`
                    p-4 cursor-pointer transition-colors
                    ${isCompleted ? 'bg-emerald-50' : 'bg-white'}
                  `}
                  onClick={() => isUnlocked && setSelectedUnit(unit)}
                >
                  <div className="flex items-center gap-4">
                    {/* Unit Number */}
                    <div className={`
                      w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold
                      ${isCompleted ? 'bg-emerald-500 text-white' : 
                        isUnlocked ? 'bg-[#1a3673] text-white' : 'bg-gray-200 text-gray-400'}
                    `}>
                      {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : 
                       isUnlocked ? idx + 1 : <Lock className="w-5 h-5" />}
                    </div>
                    
                    {/* Unit Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold ${isCompleted ? 'text-emerald-700' : 'text-[#1a3673]'}`}>
                          {unit.name}
                        </h3>
                        {isCompleted && (
                          <Badge className="bg-emerald-500 text-white border-0 text-xs">已完成</Badge>
                        )}
                        {!isUnlocked && (
                          <Badge className="bg-gray-400 text-white border-0 text-xs">锁定</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        {unit.sessions.length} 个环节 · {unit.description || '无描述'}
                      </p>
                      
                      {/* Progress Bar */}
                      {isUnlocked && (
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="flex-1 h-2 bg-gray-100" />
                          <span className="text-xs text-gray-500 w-10 text-right">
                            {Math.round(progress)}%
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Arrow */}
                    {isUnlocked && (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {units.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">暂无课程</p>
            <p className="text-white/40 text-sm">请联系管理员添加课程</p>
          </div>
        )}
      </div>
    </div>
  );
}
