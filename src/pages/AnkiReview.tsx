import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Database from '@/lib/database';
import { 
  fsrsReview, 
  getIntervalTextForGrade,
  getCardStatusFromStability 
} from '@/lib/fsrs';
import type { UserAnkiCard } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, Volume2, RotateCcw, Brain, Trophy, Menu, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AnkiReviewProps {
  onBack: () => void;
}

interface VoiceOption {
  name: string;
  lang: string;
  voice: SpeechSynthesisVoice;
}

// Grade mapping: 1=Again, 2=Hard, 3=Good, 4=Easy
const GRADE_AGAIN = 1;
const GRADE_HARD = 2;
const GRADE_GOOD = 3;
const GRADE_EASY = 4;

export default function AnkiReview({ onBack }: AnkiReviewProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [cards, setCards] = useState<UserAnkiCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [isComplete, setIsComplete] = useState(false);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const hasSpokenRef = useRef(false);
  
  // Voice settings
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [selectedTargetVoice, setSelectedTargetVoice] = useState<string>('');
  const [selectedNativeVoice, setSelectedNativeVoice] = useState<string>('');
  const [savedVoiceSettings, setSavedVoiceSettings] = useState(false);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        const voiceOptions = voices.map(v => ({
          name: v.name,
          lang: v.lang,
          voice: v
        }));
        setAvailableVoices(voiceOptions);
        
        // Set default voices if not selected
        if (!selectedTargetVoice) {
          const spanishVoice = voiceOptions.find(v => v.lang.startsWith('es'));
          if (spanishVoice) setSelectedTargetVoice(spanishVoice.name);
        }
        if (!selectedNativeVoice) {
          const chineseVoice = voiceOptions.find(v => v.lang.startsWith('zh'));
          if (chineseVoice) setSelectedNativeVoice(chineseVoice.name);
        }
      }
    };
    
    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Load cards
  useEffect(() => {
    const loadCards = async () => {
      if (!user) return;
      setIsLoading(true);
      
      try {
        const dueCards = await Database.getDueCards(user.id);
        const newCards = (await Database.getNewCards(user.id)).slice(0, 20);
        const allCards = [...dueCards, ...newCards];
        setCards(allCards.sort(() => Math.random() - 0.5));
      } catch (error) {
        console.error('Error loading cards:', error);
      }
      
      setIsLoading(false);
      hasSpokenRef.current = false;
    };
    
    loadCards();
  }, [user]);

  // Auto-speak when card changes
  useEffect(() => {
    if (cards.length > 0 && currentIndex < cards.length && autoSpeakEnabled) {
      const currentCard = cards[currentIndex];
      if (!hasSpokenRef.current) {
        const timer = setTimeout(() => {
          speak(currentCard.front, 'front');
          hasSpokenRef.current = true;
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [currentIndex, cards, autoSpeakEnabled, selectedTargetVoice]);

  const getVoiceByName = (name: string): SpeechSynthesisVoice | undefined => {
    return availableVoices.find(v => v.name === name)?.voice;
  };

  const speak = (text: string, side: 'front' | 'back') => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      
      const currentCard = cards[currentIndex];
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      
      // Lógica de detecção automática por tag lang_front / lang_back
      let targetLang = '';
      if (side === 'front') {
        targetLang = (currentCard as any).lang_front || 'es'; // 'es' como fallback
      } else {
        targetLang = (currentCard as any).lang_back || 'zh'; // 'zh' como fallback
      }

      // Escolher a voz baseada no idioma detectado
      let voiceName = '';
      if (targetLang.startsWith('es')) {
        voiceName = selectedTargetVoice;
      } else if (targetLang.startsWith('zh')) {
        voiceName = selectedNativeVoice;
      }

      const voice = getVoiceByName(voiceName);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = targetLang === 'es' ? 'es-ES' : 'zh-CN';
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
    if (cards[currentIndex]) {
      speak(cards[currentIndex].back, 'back');
    }
  };

  const handleRate = async (grade: number, label: string) => {
    if (!user || cards.length === 0) return;
    const currentCard = cards[currentIndex];
    let elapsedDays = 0;
    if (currentCard.lastReviewDate) {
      const lastReview = new Date(currentCard.lastReviewDate);
      const now = new Date();
      elapsedDays = Math.floor((now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
    }
    const result = fsrsReview(currentCard, grade, elapsedDays);
    const reviewCount = currentCard.status === 'new' ? 1 : (currentCard.repetitions + 1);
    const newStatus = getCardStatusFromStability(result.stability, reviewCount);
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + result.interval);
    
    await Database.updateAnkiCard(currentCard.id, {
      stability: result.stability,
      difficulty: result.difficulty,
      interval: result.interval,
      repetitions: reviewCount,
      nextReviewDate: nextReviewDate.toISOString(),
      lastReviewDate: new Date().toISOString(),
      status: newStatus,
    });
    
    setSessionStats(prev => ({
      ...prev,
      [label]: prev[label as keyof typeof prev] + 1
    }));
    hasSpokenRef.current = false;
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      setIsComplete(true);
    }
  };

  const handleRestart = async () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
    setIsComplete(false);
    hasSpokenRef.current = false;
    if (user) {
      const dueCards = await Database.getDueCards(user.id);
      const newCards = (await Database.getNewCards(user.id)).slice(0, 20);
      setCards([...dueCards, ...newCards].sort(() => Math.random() - 0.5));
    }
  };

  const handleSaveVoiceSettings = () => {
    setSavedVoiceSettings(true);
    setTimeout(() => setSavedVoiceSettings(false), 2000);
    setShowVoiceDialog(false);
  };

  const getButtonInterval = (grade: number): string => {
    if (!currentCard) return '';
    let elapsedDays = 0;
    if (currentCard.lastReviewDate) {
      const lastReview = new Date(currentCard.lastReviewDate);
      const now = new Date();
      elapsedDays = Math.floor((now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
    }
    return getIntervalTextForGrade(currentCard, grade, elapsedDays);
  };

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex) / cards.length) * 100 : 0;

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

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-[#1a3673] flex flex-col">
        <header className="bg-[#1a3673] border-b border-white/10 px-4 h-14 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1 text-white/80 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{t('back')}</span>
          </button>
          <div className="w-8 h-8">
            <img src="/logofinal.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-12 h-12 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{t('allCaughtUp')}</h2>
            <p className="text-white/60 mb-6">{t('comeBackTomorrow')}</p>
            <Button onClick={onBack} className="bg-[#c5a059] hover:bg-[#b08d4b] text-white">
              {t('back')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const total = sessionStats.again + sessionStats.hard + sessionStats.good + sessionStats.easy;
    const accuracy = total > 0 ? ((sessionStats.good + sessionStats.easy) / total) * 100 : 0;
    return (
      <div className="min-h-screen bg-[#1a3673] flex flex-col">
        <header className="bg-[#1a3673] border-b border-white/10 px-4 h-14 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1 text-white/80 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{t('back')}</span>
          </button>
          <div className="w-8 h-8">
            <img src="/logofinal.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white border-0">
            <CardContent className="p-6 text-center">
              <div className="w-20 h-20 bg-[#c5a059]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-10 h-10 text-[#c5a059]" />
              </div>
              <h2 className="text-xl font-bold text-[#1a3673] mb-4">复习完成！</h2>
              <div className="grid grid-cols-4 gap-2 mb-6">
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-red-500">{sessionStats.again}</p>
                  <p className="text-xs text-red-600">{t('again')}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-orange-500">{sessionStats.hard}</p>
                  <p className="text-xs text-orange-600">{t('hard')}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-blue-500">{sessionStats.good}</p>
                  <p className="text-xs text-blue-600">{t('good')}</p>
                </div>
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-500">{sessionStats.easy}</p>
                  <p className="text-xs text-emerald-600">{t('easy')}</p>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">正确率</p>
                <div className="flex items-center gap-3">
                  <Progress value={accuracy} className="flex-1" />
                  <span className="font-semibold text-[#1a3673]">{Math.round(accuracy)}%</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleRestart} variant="outline" className="flex-1 border-[#1a3673] text-[#1a3673]">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  继续复习
                </Button>
                <Button onClick={onBack} className="flex-1 bg-[#1a3673] hover:bg-[#142a5a] text-white">
                  {t('back')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a3673] flex flex-col">
      <header className="bg-[#1a3673] border-b border-white/10 px-4 h-14 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-white/80 hover:text-white">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">{t('back')}</span>
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowVoiceDialog(true)} className="p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors" title="语音设置">
            <Menu className="w-4 h-4" />
          </button>
          <div className="w-8 h-8">
            <img src="/logofinal.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <button onClick={() => setAutoSpeakEnabled(!autoSpeakEnabled)} className={`p-2 rounded-full transition-colors ${autoSpeakEnabled ? 'bg-[#c5a059]/30 text-[#c5a059]' : 'bg-white/10 text-white/50'}`}>
            <Volume2 className="w-4 h-4" />
          </button>
          <span className="text-sm text-white/60">{currentIndex + 1} / {cards.length}</span>
        </div>
      </header>
      <div className="h-1 bg-white/10">
        <div className="h-full bg-[#c5a059] transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex-1 flex flex-col p-4">
        <Card className="flex-1 flex flex-col border-0 shadow-xl bg-white">
          <CardContent className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="text-center w-full">
              <p className="text-sm text-gray-400 mb-4 uppercase tracking-wide">正面</p>
              <h2 className="text-4xl sm:text-5xl font-bold text-[#1a3673] mb-4">{currentCard.front}</h2>
              {currentCard.pronunciation && (
                <button onClick={() => speak(currentCard.front, 'front')} className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a3673]/10 rounded-full text-sm text-[#1a3673] hover:bg-[#1a3673]/20">
                  <Volume2 className="w-4 h-4" />
                  {currentCard.pronunciation}
                </button>
              )}
            </div>
            {showAnswer && (
              <>
                <div className="w-full my-6">
                  <div className="border-t border-gray-200" />
                </div>
                <div className="text-center w-full">
                  <p className="text-sm text-gray-400 mb-4 uppercase tracking-wide">背面</p>
                  <h2 className="text-4xl sm:text-5xl font-bold text-emerald-600 mb-4">{currentCard.back}</h2>
                  {currentCard.example && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                      <p className="text-gray-600 italic">&ldquo;{currentCard.example}&rdquo;</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <div className="mt-4">
          {!showAnswer ? (
            <Button onClick={handleShowAnswer} className="w-full h-14 bg-[#1a3673] hover:bg-[#142a5a] text-white font-semibold text-lg">
              {t('showAnswer')}
            </Button>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              <Button onClick={() => handleRate(GRADE_AGAIN, 'again')} variant="outline" className="h-20 flex flex-col items-center justify-center border-red-300 hover:bg-red-50">
                <span className="text-red-600 font-bold">{t('again')}</span>
                <span className="text-xs text-red-400 mt-1">{getButtonInterval(GRADE_AGAIN)}</span>
                <span className="text-[10px] text-red-300">忘记</span>
              </Button>
              <Button onClick={() => handleRate(GRADE_HARD, 'hard')} variant="outline" className="h-20 flex flex-col items-center justify-center border-orange-300 hover:bg-orange-50">
                <span className="text-orange-600 font-bold">{t('hard')}</span>
                <span className="text-xs text-orange-400 mt-1">{getButtonInterval(GRADE_HARD)}</span>
                <span className="text-[10px] text-orange-300">困难</span>
              </Button>
              <Button onClick={() => handleRate(GRADE_GOOD, 'good')} variant="outline" className="h-20 flex flex-col items-center justify-center border-blue-300 hover:bg-blue-50">
                <span className="text-blue-600 font-bold">{t('good')}</span>
                <span className="text-xs text-blue-400 mt-1">{getButtonInterval(GRADE_GOOD)}</span>
                <span className="text-[10px] text-blue-300">良好</span>
              </Button>
              <Button onClick={() => handleRate(GRADE_EASY, 'easy')} variant="outline" className="h-20 flex flex-col items-center justify-center border-emerald-300 hover:bg-emerald-50">
                <span className="text-emerald-600 font-bold">{t('easy')}</span>
                <span className="text-xs text-emerald-400 mt-1">{getButtonInterval(GRADE_EASY)}</span>
                <span className="text-[10px] text-emerald-300">简单</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showVoiceDialog} onOpenChange={setShowVoiceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-[#1a3673]" />
              语音设置
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">学习语言语音 (西班牙语)</label>
              <Select value={selectedTargetVoice} onValueChange={setSelectedTargetVoice}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择语音" />
                </SelectTrigger>
                <SelectContent>
                  {availableVoices.filter(v => v.lang.startsWith('es')).map(voice => (
                    <SelectItem key={voice.name} value={voice.name}>{voice.name}</SelectItem>
                  ))}
                  {availableVoices.filter(v => v.lang.startsWith('es')).length === 0 && (
                    <SelectItem value="default-es">默认西班牙语</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">母语语音 (中文)</label>
              <Select value={selectedNativeVoice} onValueChange={setSelectedNativeVoice}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择语音" />
                </SelectTrigger>
                <SelectContent>
                  {availableVoices.filter(v => v.lang.startsWith('zh')).map(voice => (
                    <SelectItem key={voice.name} value={voice.name}>{voice.name}</SelectItem>
                  ))}
                  {availableVoices.filter(v => v.lang.startsWith('zh')).length === 0 && (
                    <SelectItem value="default-zh">默认中文</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            {savedVoiceSettings && (
              <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />
                设置已保存
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVoiceDialog(false)}>取消</Button>
            <Button onClick={handleSaveVoiceSettings} className="bg-[#1a3673] hover:bg-[#142a5a] text-white">
              <Check className="w-4 h-4 mr-1" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
