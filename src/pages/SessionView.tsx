import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Database from '@/lib/database';
import type { Unit, Session as SessionType } from '@/types';
import { Button } from '@/components/ui/button';
import { Check, ChevronLeft, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import HTMLSandbox from '@/components/HTMLSandbox';

interface SessionViewProps {
  unitId: string;
  sessionId: string;
  onBack: () => void;
  onComplete: () => void;
}

export default function SessionView({ unitId, sessionId, onBack, onComplete }: SessionViewProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [session, setSession] = useState<SessionType | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [cardsAdded, setCardsAdded] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const unitData = await Database.getUnitById(unitId);
      if (unitData) {
        setUnit(unitData);
        const sessionData = unitData.sessions.find(s => s.id === sessionId);
        if (sessionData) {
          setSession(sessionData);
        }
      }

      if (user) {
        const completed = await Database.isSessionCompleted(user.id, sessionId);
        setIsCompleted(completed);
      }
      setIsLoading(false);
    };
    
    loadData();
  }, [unitId, sessionId, user]);

  const handleComplete = async () => {
    if (!user || !session) return;

    // Mark session as completed
    await Database.completeSession(user.id, unitId, sessionId);
    
    // Add Anki cards if any
    let addedCards = 0;
    if (session.ankiCards && session.ankiCards.length > 0) {
      await Database.addAnkiCardsToUser(user.id, unitId, sessionId, session.ankiCards);
      addedCards = session.ankiCards.length;
    }
    
    // Record study time
    await Database.recordStudySession(user.id, 15); // Assume 15 minutes per session
    
    setCardsAdded(addedCards);
    setIsCompleted(true);
    setShowCompleteDialog(true);
  };

  const handleCloseDialog = () => {
    setShowCompleteDialog(false);
    onComplete();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a3673]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white/70">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!unit || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a3673]">
        <div className="text-center">
          <p className="text-white/70">未找到课程内容</p>
          <Button onClick={onBack} className="mt-4 bg-[#c5a059] hover:bg-[#b08d4b]">
            {t('back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a3673]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1a3673] border-b border-white/10">
        <div className="flex items-center justify-between px-4 h-14">
          <button 
            onClick={onBack}
            className="flex items-center gap-1 text-white/80 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{t('back')}</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-lg">{session.emoji}</span>
            <span className="text-sm font-medium text-white/90 hidden sm:inline">{session.name}</span>
          </div>

          <div className="w-8 h-8">
            <img 
              src="/logofinal.png" 
              alt="Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=PM&backgroundColor=1a3673';
              }}
            />
          </div>

          <Button
            onClick={handleComplete}
            disabled={isCompleted}
            size="sm"
            className={`
              ${isCompleted 
                ? 'bg-emerald-500 hover:bg-emerald-500' 
                : 'bg-[#c5a059] hover:bg-[#b08d4b]'
              } text-white font-medium border-0
            `}
          >
            {isCompleted ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                {t('completed')}
              </>
            ) : (
              t('markComplete')
            )}
          </Button>
        </div>
        
        {/* Progress bar */}
        <div className="h-0.5 bg-white/10">
          <div 
            className="h-full bg-[#c5a059] transition-all duration-300" 
            style={{ width: isCompleted ? '100%' : '0%' }} 
          />
        </div>
      </header>

      {/* Content */}
      <main className="w-full">
        {session.htmlContent ? (
          <HTMLSandbox htmlContent={session.htmlContent} />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-white/70 p-8">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">{session.emoji}</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">{session.name}</h2>
            <p className="text-center text-white/50">
              此环节暂无内容<br />
              请联系管理员添加学习材料
            </p>
          </div>
        )}
      </main>

      {/* Completion Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1a3673]">
              <Sparkles className="w-5 h-5 text-[#c5a059]" />
              {t('completed')}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {cardsAdded > 0 ? (
                <>
                  恭喜完成！已添加 <span className="font-semibold text-[#1a3673]">{cardsAdded}</span> 张卡片到你的 Anki 复习库。
                </>
              ) : (
                '恭喜完成本环节！'
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              onClick={handleCloseDialog} 
              className="w-full bg-[#1a3673] hover:bg-[#142a5a]"
            >
              {t('continueLearning')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
