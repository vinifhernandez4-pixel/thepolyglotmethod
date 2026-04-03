import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Database from '@/lib/database';
import type { Unit, Book, Language, UserStats, UserProgress } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, Clock, BookOpen, Target, Flame, 
  Award, Calendar, CheckCircle2
} from 'lucide-react';
import { Progress as ProgressBar } from '@/components/ui/progress';

export default function ProgressPage() {
  const { user } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [completedUnitIds, setCompletedUnitIds] = useState<Set<string>>(new Set());
  const [book, setBook] = useState<Book | null>(null);
  const [language, setLanguage] = useState<Language | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
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

        // Get stats
        const userStats = await Database.getUserStats(user.id);
        setStats(userStats ?? null);

        // Generate mock weekly data (in real app, this would come from actual study history)
        setWeeklyData([
          Math.floor(Math.random() * 60) + 10,
          Math.floor(Math.random() * 60) + 10,
          Math.floor(Math.random() * 60) + 10,
          Math.floor(Math.random() * 60) + 10,
          Math.floor(Math.random() * 60) + 10,
          Math.floor(Math.random() * 60) + 10,
          Math.floor(Math.random() * 60) + 10,
        ]);
      } catch (error) {
        console.error('Error loading progress data:', error);
      }
      
      setIsLoading(false);
    };

    loadData();
  }, [user]);

  const progressPercent = units.length > 0 
    ? (completedUnitIds.size / units.length) * 100 
    : 0;

  const daysOfWeek = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

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

  return (
    <div className="min-h-screen bg-[#1a3673] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1a3673] to-[#0f1f42] text-white p-4 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold mb-1">学习进度</h1>
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

      {/* Main Content */}
      <div className="px-4 -mt-2 space-y-4">
        {/* Overall Progress */}
        <Card className="border-0 shadow-xl bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-[#1a3673]">总体进度</CardTitle>
              <TrendingUp className="w-5 h-5 text-[#c5a059]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <ProgressBar value={progressPercent} className="h-4 bg-gray-100" />
              </div>
              <span className="text-2xl font-bold text-[#1a3673]">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-[#1a3673]/5 rounded-xl">
                <p className="text-2xl font-bold text-[#1a3673]">{completedUnitIds.size}</p>
                <p className="text-xs text-gray-500">已完成单元</p>
              </div>
              <div className="p-3 bg-[#c5a059]/10 rounded-xl">
                <p className="text-2xl font-bold text-[#c5a059]">{units.length - completedUnitIds.size}</p>
                <p className="text-xs text-gray-500">待完成单元</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <p className="text-2xl font-bold text-emerald-600">{units.length}</p>
                <p className="text-xs text-gray-500">总单元数</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1a3673]/10 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#1a3673]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1a3673]">{Math.floor((stats?.totalStudyTime || 0) / 60)}</p>
                  <p className="text-xs text-gray-500">学习小时</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#c5a059]/10 rounded-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-[#c5a059]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1a3673]">{stats?.totalWordsLearned || 0}</p>
                  <p className="text-xs text-gray-500">掌握词汇</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1a3673]">{stats?.streakDays || 0}</p>
                  <p className="text-xs text-gray-500">连续天数</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1a3673]">{stats?.totalUnitsCompleted || completedUnitIds.size}</p>
                  <p className="text-xs text-gray-500">完成单元</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Activity */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-[#1a3673]">本周学习</CardTitle>
              <Calendar className="w-4 h-4 text-[#c5a059]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-32 gap-2">
              {weeklyData.map((value, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-[#c5a059] rounded-t-lg transition-all"
                    style={{ height: `${value}%` }}
                  />
                  <span className="text-xs text-gray-500">{daysOfWeek[idx]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-[#1a3673]">成就</CardTitle>
              <Award className="w-4 h-4 text-[#c5a059]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className={`
                p-3 rounded-xl text-center border-2
                ${completedUnitIds.size >= 1 
                  ? 'bg-[#c5a059]/10 border-[#c5a059]' 
                  : 'bg-gray-50 border-gray-200 opacity-50'}
              `}>
                <div className="w-10 h-10 mx-auto mb-2 bg-[#c5a059] rounded-full flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-medium text-[#1a3673]">初学者</p>
                <p className="text-[10px] text-gray-500">完成1个单元</p>
              </div>
              <div className={`
                p-3 rounded-xl text-center border-2
                ${completedUnitIds.size >= 5 
                  ? 'bg-[#c5a059]/10 border-[#c5a059]' 
                  : 'bg-gray-50 border-gray-200 opacity-50'}
              `}>
                <div className="w-10 h-10 mx-auto mb-2 bg-[#c5a059] rounded-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-medium text-[#1a3673]">勤奋者</p>
                <p className="text-[10px] text-gray-500">完成5个单元</p>
              </div>
              <div className={`
                p-3 rounded-xl text-center border-2
                ${(stats?.streakDays || 0) >= 7 
                  ? 'bg-[#c5a059]/10 border-[#c5a059]' 
                  : 'bg-gray-50 border-gray-200 opacity-50'}
              `}>
                <div className="w-10 h-10 mx-auto mb-2 bg-[#c5a059] rounded-full flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-medium text-[#1a3673]">坚持者</p>
                <p className="text-[10px] text-gray-500">连续7天</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unit Details */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-[#1a3673]">单元详情</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {units.map((unit, idx) => {
                const isCompleted = completedUnitIds.has(unit.id);
                const unitProgress = (() => {
                  if (!user) return 0;
                  const totalSessions = unit.sessions.length;
                  if (totalSessions === 0) return 0;
                  const completedSessions = userProgress.filter(p => 
                    p.unitId === unit.id && p.completed
                  ).length;
                  return (completedSessions / totalSessions) * 100;
                })();
                
                return (
                  <div 
                    key={unit.id} 
                    className={`
                      flex items-center gap-3 p-3 rounded-lg
                      ${isCompleted ? 'bg-emerald-50' : 'bg-gray-50'}
                    `}
                  >
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                      ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-[#1a3673] text-white'}
                    `}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isCompleted ? 'text-emerald-700' : 'text-[#1a3673]'}`}>
                        {unit.name}
                      </p>
                      <ProgressBar value={unitProgress} className="h-1.5 mt-1 bg-gray-200" />
                    </div>
                    <span className="text-xs text-gray-500 w-10 text-right">
                      {Math.round(unitProgress)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
