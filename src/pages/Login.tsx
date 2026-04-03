import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Mail, Lock, User, MessageCircle, BookOpen, Globe } from 'lucide-react';
import Database from '@/lib/database';
import type { Language, Book } from '@/types';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const { login, register } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showWelcomeMessage, _setShowWelcomeMessage] = useState(false);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerWechat, setRegisterWechat] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  
  // Data states
  const [languages, setLanguages] = useState<Language[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Load languages and books on mount
  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);
      try {
        const langs = await Database.getLanguages();
        setLanguages(langs);
      } catch (err) {
        console.error('Error loading languages:', err);
      }
      setIsDataLoading(false);
    };
    loadData();
  }, []);

  // Load books when language is selected
  useEffect(() => {
    const loadBooks = async () => {
      if (selectedLanguage) {
        try {
          const booksData = await Database.getBooksByLanguage(selectedLanguage);
          setBooks(booksData);
        } catch (err) {
          console.error('Error loading books:', err);
        }
      } else {
        setBooks([]);
      }
    };
    loadBooks();
  }, [selectedLanguage]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const result = await login(loginEmail, loginPassword);
    
    if (result.success) {
      onLogin();
    } else {
      setError(result.message);
    }
    
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const result = await register({
      name: registerName,
      email: registerEmail,
      password: registerPassword,
      wechat: registerWechat,
      selectedLanguageId: selectedLanguage || undefined,
      selectedBookId: selectedBook || undefined,
    });
    
    if (result.success) {
      // Auto login after registration and go to dashboard
      onLogin();
      return;
    } else {
      setError(result.message);
    }
    
    setIsLoading(false);
  };

  // Welcome message after registration (kept for reference but not used)
  if (showWelcomeMessage) {
    return (
      <div className="min-h-screen bg-[#1a3673] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4">
              <img 
                src="/logofinal.png" 
                alt="Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=PM&backgroundColor=1a3673';
                }}
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">多语者学法社</h1>
            <p className="text-white/50 text-sm">The Polyglot Method Studio</p>
          </div>

          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#c5a059]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#c5a059]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#1a3673] mb-4">注册成功！</h2>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <p className="text-amber-800 text-sm mb-2">
                    您还没有被分配到任何课程，请将您的用户名告知学校以便继续学习。
                  </p>
                  <p className="text-amber-700 text-xs">
                    如果您还不是学生，请联系我们了解多语者方法论的语言课程。
                  </p>
                </div>
                <div className="space-y-3">
                  <Button 
                    onClick={() => onLogin()}
                    className="w-full h-11 bg-[#1a3673] hover:bg-[#142a5a] text-white font-semibold"
                  >
                    进入应用
                  </Button>
                  <a 
                    href="https://xhslink.com/m/7uum8WeBuhR"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-center transition-colors"
                  >
                    关注我们的小红书
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center text-white/50 text-xs space-y-1">
            <p className="text-white/70 font-medium">多语者学法社 | The Polyglot Method Studio</p>
            <p>湖南省 长沙市 天心区 汇金国际银座</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a3673] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section - No border */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4">
            <img 
              src="/logofinal.png" 
              alt="Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=PM&backgroundColor=1a3673';
              }}
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">多语者学法社</h1>
          <p className="text-white/50 text-sm">The Polyglot Method Studio</p>
          <p className="text-[#c5a059] text-xs mt-2">{t('slogan')}</p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
              <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-[#1a3673] text-gray-600 font-medium">
                {t('login')}
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:text-[#1a3673] text-gray-600 font-medium">
                {t('register')}
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl text-center text-[#1a3673]">{t('login')}</CardTitle>
                <CardDescription className="text-center text-sm">
                  欢迎回来，继续你的学习之旅
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium text-[#1a3673]">
                      {t('email')}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10 h-11 border-gray-200 focus:border-[#1a3673] focus:ring-[#1a3673]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-medium text-[#1a3673]">
                      {t('password')}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 border-gray-200 focus:border-[#1a3673] focus:ring-[#1a3673]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 bg-[#1a3673] hover:bg-[#142a5a] text-white font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? t('loading') : t('login')}
                  </Button>

                  <div className="text-center">
                    <button type="button" className="text-sm text-[#1a3673] hover:underline">
                      {t('forgotPassword')}
                    </button>
                  </div>
                </form>
              </CardContent>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl text-center text-[#1a3673]">{t('register')}</CardTitle>
                <CardDescription className="text-center text-sm">
                  创建账号，开始学习之旅
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-sm font-medium text-[#1a3673]">
                      {t('name')}
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="你的名字"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className="pl-10 h-11 border-gray-200 focus:border-[#1a3673] focus:ring-[#1a3673]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-sm font-medium text-[#1a3673]">
                      {t('email')}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="your@email.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="pl-10 h-11 border-gray-200 focus:border-[#1a3673] focus:ring-[#1a3673]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-sm font-medium text-[#1a3673]">
                      {t('password')}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 border-gray-200 focus:border-[#1a3673] focus:ring-[#1a3673]"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-wechat" className="text-sm font-medium text-[#1a3673]">
                      {t('wechat')}
                    </Label>
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="register-wechat"
                        type="text"
                        placeholder="微信号"
                        value={registerWechat}
                        onChange={(e) => setRegisterWechat(e.target.value)}
                        className="pl-10 h-11 border-gray-200 focus:border-[#1a3673] focus:ring-[#1a3673]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#1a3673] flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      选择学习语言
                    </Label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage} disabled={isDataLoading}>
                      <SelectTrigger className="h-11 border-gray-200 focus:border-[#1a3673] focus:ring-[#1a3673]">
                        <SelectValue placeholder={isDataLoading ? "加载中..." : "选择你想学习的语言"} />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang: Language) => (
                          <SelectItem key={lang.id} value={lang.id}>
                            <div className="flex items-center gap-2">
                              <img src={lang.avatar} alt="" className="w-5 h-5 rounded-full" />
                              {lang.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedLanguage && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[#1a3673] flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        选择教材
                      </Label>
                      <Select value={selectedBook} onValueChange={setSelectedBook}>
                        <SelectTrigger className="h-11 border-gray-200 focus:border-[#1a3673] focus:ring-[#1a3673]">
                          <SelectValue placeholder="选择教材" />
                        </SelectTrigger>
                        <SelectContent>
                          {books.map((book: Book) => (
                            <SelectItem key={book.id} value={book.id}>
                              <div className="flex items-center gap-2">
                                <img src={book.avatar} alt="" className="w-5 h-5 rounded" />
                                {book.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 bg-[#c5a059] hover:bg-[#b08d4b] text-white font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? t('loading') : t('register')}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-white/50 text-xs space-y-2">
          <p className="text-white/70 font-medium">多语者学法社 | The Polyglot Method Studio</p>
          <p>湖南省 长沙市 天心区 汇金国际银座</p>
          <a 
            href="https://xhslink.com/m/7uum8WeBuhR"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            关注我们的小红书
          </a>
        </div>
      </div>
    </div>
  );
}
