import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Database from '@/lib/database';
import type { Language, Book, Unit, Group, User, Session } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Edit2, Trash2, Users, BookOpen, Globe, 
  Layers, GraduationCap, Eye, X,
  Save, Check, AlertTriangle, Upload, FileText,
  ArrowUpDown, Lock
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdminPanelProps {
  onLogout: () => void;
}

// Emoji options for sessions
const EMOJI_OPTIONS = [
  '👀', '📝', '📚', '🎧', '🎮', '🎯', '💡', '🔤', 
  '🗣️', '👂', '✍️', '📖', '🎬', '🎵', '🧩', '🏆',
  '⭐', '💬', '📋', '🔍', '💭', '🎨', '📊', '🔢'
];

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const { user: _user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('languages');
  
  // Data states
  const [languages, setLanguages] = useState<Language[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [showAddSessionDialog, setShowAddSessionDialog] = useState(false);
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  const [showUnitOrderDialog, setShowUnitOrderDialog] = useState(false);

  // Form states
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [selectedUnitForSession, setSelectedUnitForSession] = useState<Unit | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string; extra?: string } | null>(null);

  // File upload refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkUploadRef = useRef<HTMLInputElement>(null);

  // Form inputs
  const [languageName, setLanguageName] = useState('');
  const [languageNameEn, setLanguageNameEn] = useState('');
  const [languageAvatar, setLanguageAvatar] = useState('');
  const [bookName, setBookName] = useState('');
  const [bookLanguageId, setBookLanguageId] = useState('');
  const [bookAvatar, setBookAvatar] = useState('');
  const [unitName, setUnitName] = useState('');
  const [unitBookId, setUnitBookId] = useState('');
  const [unitDescription, setUnitDescription] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupBookId, setGroupBookId] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [sessionEmoji, setSessionEmoji] = useState('');
  const [sessionHtml, setSessionHtml] = useState('');
  const [sessionAnki, setSessionAnki] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [langs, booksData, unitsData, groupsData, usersData] = await Promise.all([
        Database.getLanguages(),
        Database.getBooks(),
        Database.getUnits(),
        Database.getGroups(),
        Database.getUsers()
      ]);
      setLanguages(langs);
      setBooks(booksData);
      setUnits(unitsData);
      setGroups(groupsData);
      setStudents(usersData.filter(u => u.role === 'student'));
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setSessionHtml(content);
    };
    reader.readAsText(file);
  };

  // Bulk upload handler
  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !selectedUnitForSession) return;

    const fileArray = Array.from(files);
    const uploadedSessions: { name: string; content: string; ankiContent: string }[] = [];

    // Process HTML files
    for (const file of fileArray) {
      if (file.name.endsWith('.html') && !file.name.includes('_anki')) {
        const content = await file.text();
        const baseName = file.name.replace('.html', '');
        
        // Look for corresponding anki file
        const ankiFile = fileArray.find(f => f.name === `${baseName}_anki.html` || f.name === `${baseName}_anki.txt` || f.name === `${baseName}_anki.json`);
        let ankiContent = '';
        if (ankiFile) {
          ankiContent = await ankiFile.text();
        }

        uploadedSessions.push({
          name: baseName.charAt(0).toUpperCase() + baseName.slice(1),
          content,
          ankiContent
        });
      }
    }

    // Create or update sessions
    for (const sessionData of uploadedSessions) {
      const existingSession = selectedUnitForSession.sessions.find(
        s => s.name.toLowerCase() === sessionData.name.toLowerCase()
      );

      let ankiCards = [];
      if (sessionData.ankiContent) {
        try {
          ankiCards = JSON.parse(sessionData.ankiContent);
        } catch (e) {
          // Try parsing as CSV format
          const lines = sessionData.ankiContent.trim().split('\n');
          ankiCards = lines.map((line, idx) => {
            const parts = line.split('|');
            return {
              id: `card-${idx}`,
              front: parts[0]?.trim() || '',
              back: parts[1]?.trim() || '',
              pronunciation: parts[2]?.trim(),
              example: parts[3]?.trim(),
            };
          }).filter(c => c.front && c.back);
        }
      }

      if (existingSession) {
        // Update existing session
        await Database.updateSession(existingSession.id, {
          htmlContent: sessionData.content,
          ankiCards,
        });
      } else {
        // Create new session
        const newOrder = selectedUnitForSession.sessions.length + 1;
        const emoji = EMOJI_OPTIONS.find(e => 
          sessionData.name.toLowerCase().includes('preview') ? e === '👀' :
          sessionData.name.toLowerCase().includes('review') ? e === '📝' :
          sessionData.name.toLowerCase().includes('grammar') ? e === '📚' :
          sessionData.name.toLowerCase().includes('audio') ? e === '🎧' :
          e === '🎮'
        ) || '🎮';

        await Database.addSessionToUnit(selectedUnitForSession.id, {
          name: sessionData.name,
          emoji,
          htmlContent: sessionData.content,
          ankiCards,
          order: newOrder,
        });
      }
    }

    // Refresh data
    await loadData();
    const updatedUnit = await Database.getUnitById(selectedUnitForSession.id);
    if (updatedUnit) {
      setSelectedUnitForSession(updatedUnit);
    }

    setShowBulkUploadDialog(false);
    alert(`成功上传 ${uploadedSessions.length} 个环节！`);
  };

  // Language handlers
  const handleSaveLanguage = async () => {
    const avatar = languageAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${languageNameEn}&backgroundColor=1a3673`;
    
    if (editingLanguage) {
      await Database.updateLanguage(editingLanguage.id, {
        name: languageName,
        nameEn: languageNameEn,
        avatar,
      });
    } else {
      await Database.createLanguage({
        name: languageName,
        nameEn: languageNameEn,
        avatar,
      });
    }
    
    setShowLanguageDialog(false);
    resetLanguageForm();
    await loadData();
  };

  const resetLanguageForm = () => {
    setLanguageName('');
    setLanguageNameEn('');
    setLanguageAvatar('');
    setEditingLanguage(null);
  };

  // Book handlers
  const handleSaveBook = async () => {
    const avatar = bookAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${bookName}&backgroundColor=c5a059`;
    
    if (editingBook) {
      await Database.updateBook(editingBook.id, {
        name: bookName,
        languageId: bookLanguageId,
        avatar,
      });
    } else {
      const booksInLanguage = await Database.getBooksByLanguage(bookLanguageId);
      await Database.createBook({
        name: bookName,
        languageId: bookLanguageId,
        avatar,
        order: booksInLanguage.length + 1,
      });
    }
    
    setShowBookDialog(false);
    resetBookForm();
    await loadData();
  };

  const resetBookForm = () => {
    setBookName('');
    setBookLanguageId('');
    setBookAvatar('');
    setEditingBook(null);
  };

  // Unit handlers
  const handleSaveUnit = async () => {
    if (editingUnit) {
      await Database.updateUnit(editingUnit.id, {
        name: unitName,
        description: unitDescription,
      });
      setShowUnitDialog(false);
      resetUnitForm();
    } else {
      const unitsInBook = await Database.getUnitsByBook(unitBookId);
      const newUnit = await Database.createUnit({
        bookId: unitBookId,
        name: unitName,
        description: unitDescription,
        order: unitsInBook.length + 1,
        sessions: [],
      });
      
      // Create default sessions
      const defaultSessions = [
        { name: 'Preview', emoji: '👀', order: 1 },
        { name: 'Review', emoji: '📝', order: 2 },
        { name: 'Grammar', emoji: '📚', order: 3 },
        { name: 'Audio', emoji: '🎧', order: 4 },
      ];
      
      for (const session of defaultSessions) {
        await Database.addSessionToUnit(newUnit.id, {
          name: session.name,
          emoji: session.emoji,
          htmlContent: '',
          ankiCards: [],
          order: session.order,
        });
      }
      
      setShowUnitDialog(false);
      resetUnitForm();
    }
    await loadData();
  };

  const resetUnitForm = () => {
    setUnitName('');
    setUnitBookId('');
    setUnitDescription('');
    setEditingUnit(null);
  };

  // Add new session handler
  const handleAddNewSession = async () => {
    if (!selectedUnitForSession) return;

    const newOrder = selectedUnitForSession.sessions.length + 1;
    
    await Database.addSessionToUnit(selectedUnitForSession.id, {
      name: sessionName,
      emoji: sessionEmoji,
      htmlContent: sessionHtml,
      ankiCards: [],
      order: newOrder,
    });

    setShowAddSessionDialog(false);
    resetSessionForm();
    await loadData();
    
    // Refresh the selected unit
    const updatedUnit = await Database.getUnitById(selectedUnitForSession.id);
    if (updatedUnit) {
      setSelectedUnitForSession(updatedUnit);
    }
  };

  // Session handlers
  const handleSaveSession = async () => {
    if (!selectedUnitForSession) return;

    let ankiCards = [];
    try {
      if (sessionAnki.trim()) {
        ankiCards = JSON.parse(sessionAnki);
      }
    } catch (e) {
      // Try parsing as CSV format
      const lines = sessionAnki.trim().split('\n');
      ankiCards = lines.map((line, idx) => {
        const parts = line.split('|');
        return {
          id: `card-${idx}`,
          front: parts[0]?.trim() || '',
          back: parts[1]?.trim() || '',
          pronunciation: parts[2]?.trim(),
          example: parts[3]?.trim(),
        };
      }).filter(c => c.front && c.back);
    }

    if (editingSession) {
      await Database.updateSession(editingSession.id, {
        name: sessionName,
        emoji: sessionEmoji,
        htmlContent: sessionHtml,
        ankiCards,
      });
    }

    setShowSessionDialog(false);
    resetSessionForm();
    await loadData();
    
    // Refresh the selected unit
    const updatedUnit = await Database.getUnitById(selectedUnitForSession.id);
    if (updatedUnit) {
      setSelectedUnitForSession(updatedUnit);
    }
  };

  const handleDeleteSession = async (unitId: string, sessionId: string) => {
    await Database.deleteSession(sessionId);
    await loadData();
    
    // Refresh the selected unit
    const updatedUnit = await Database.getUnitById(unitId);
    if (updatedUnit) {
      setSelectedUnitForSession(updatedUnit);
    }
  };

  const resetSessionForm = () => {
    setSessionName('');
    setSessionEmoji('');
    setSessionHtml('');
    setSessionAnki('');
    setUploadedFileName('');
    setEditingSession(null);
  };

  // Group handlers
  const handleSaveGroup = async () => {
    if (editingGroup) {
      await Database.updateGroup(editingGroup.id, {
        name: groupName,
        bookId: groupBookId,
      });
    } else {
      const book = await Database.getBookById(groupBookId);
      await Database.createGroup({
        name: groupName,
        bookId: groupBookId,
        languageId: book?.languageId || '',
        studentIds: [],
        unlockedUnitIds: [],
      });
    }
    
    setShowGroupDialog(false);
    resetGroupForm();
    await loadData();
  };

  const resetGroupForm = () => {
    setGroupName('');
    setGroupBookId('');
    setEditingGroup(null);
  };

  const handleUnlockUnit = async (groupId: string, unitId: string) => {
    await Database.unlockUnitForGroup(groupId, unitId);
    await loadData();
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    switch (itemToDelete.type) {
      case 'language':
        await Database.deleteLanguage(itemToDelete.id);
        break;
      case 'book':
        await Database.deleteBook(itemToDelete.id);
        break;
      case 'unit':
        await Database.deleteUnit(itemToDelete.id);
        break;
      case 'group':
        await Database.deleteGroup(itemToDelete.id);
        break;
      case 'user':
        await Database.deleteUser(itemToDelete.id);
        break;
      case 'session':
        if (itemToDelete.extra) {
          await handleDeleteSession(itemToDelete.extra, itemToDelete.id);
        }
        break;
    }

    setShowDeleteConfirm(false);
    setItemToDelete(null);
    await loadData();
  };

  const openEditSession = (unit: Unit, session: Session) => {
    setSelectedUnitForSession(unit);
    setEditingSession(session);
    setSessionName(session.name);
    setSessionEmoji(session.emoji);
    setSessionHtml(session.htmlContent);
    setSessionAnki(JSON.stringify(session.ankiCards, null, 2));
    setUploadedFileName('');
    setShowSessionDialog(true);
  };

  const openAddSession = (unit: Unit) => {
    setSelectedUnitForSession(unit);
    setSessionName('');
    setSessionEmoji('🎮');
    setSessionHtml('');
    setSessionAnki('');
    setUploadedFileName('');
    setShowAddSessionDialog(true);
  };

  const getLanguageName = (id: string) => languages.find(l => l.id === id)?.name || '-';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#1a3673] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1a3673] text-white p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <img 
              src="/logofinal.png" 
              alt="Logo" 
              className="w-10 h-10 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=PM&backgroundColor=1a3673';
              }}
            />
            <div>
              <h1 className="text-lg font-bold">管理后台</h1>
              <p className="text-xs text-white/70">Admin Panel</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onLogout} className="border-white/30 text-white hover:bg-white/10">
            {t('logout')}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="languages" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{t('languages')}</span>
            </TabsTrigger>
            <TabsTrigger value="books" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">{t('books')}</span>
            </TabsTrigger>
            <TabsTrigger value="units" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">{t('units')}</span>
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">{t('groups')}</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">{t('students')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Languages Tab */}
          <TabsContent value="languages">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('languages')}</h2>
              <Button 
                onClick={() => {
                  resetLanguageForm();
                  setShowLanguageDialog(true);
                }}
                className="bg-[#1a3673] hover:bg-[#142a5a] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('addLanguage')}
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {languages.map(lang => (
                <Card key={lang.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center">
                      <img src={lang.avatar} alt="" className="w-16 h-16 rounded-full mb-3" />
                      <h3 className="font-semibold">{lang.name}</h3>
                      <p className="text-sm text-gray-500">{lang.nameEn}</p>
                      <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-white text-[#1a3673] border-[#1a3673]/30 hover:bg-[#1a3673]/10"
                          onClick={() => {
                            setEditingLanguage(lang);
                            setLanguageName(lang.name);
                            setLanguageNameEn(lang.nameEn);
                            setLanguageAvatar(lang.avatar);
                            setShowLanguageDialog(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-white text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                          onClick={() => {
                            setItemToDelete({ type: 'language', id: lang.id });
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Books Tab */}
          <TabsContent value="books">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('books')}</h2>
              <Button 
                onClick={() => {
                  resetBookForm();
                  setShowBookDialog(true);
                }}
                className="bg-[#1a3673] hover:bg-[#142a5a] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('addBook')}
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {books.map(book => (
                <Card key={book.id} className="group">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center">
                      <img src={book.avatar} alt="" className="w-16 h-20 rounded mb-3 object-cover" />
                      <h3 className="font-semibold text-sm">{book.name}</h3>
                      <p className="text-xs text-gray-500">{getLanguageName(book.languageId)}</p>
                      <div className="flex gap-2 mt-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-white text-[#1a3673] border-[#1a3673]/30 hover:bg-[#1a3673]/10"
                          onClick={() => {
                            setEditingBook(book);
                            setBookName(book.name);
                            setBookLanguageId(book.languageId);
                            setBookAvatar(book.avatar);
                            setShowBookDialog(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-white text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                          onClick={() => {
                            setItemToDelete({ type: 'book', id: book.id });
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Units Tab */}
          <TabsContent value="units">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('units')}</h2>
              <Button 
                onClick={() => {
                  resetUnitForm();
                  setShowUnitDialog(true);
                }}
                className="bg-[#1a3673] hover:bg-[#142a5a] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('addUnit')}
              </Button>
            </div>
            <div className="space-y-4">
              {books.map(book => {
                const bookUnits = units.filter(u => u.bookId === book.id).sort((a, b) => a.order - b.order);
                if (bookUnits.length === 0) return null;
                
                return (
                  <Card key={book.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <img src={book.avatar} alt="" className="w-8 h-8 rounded" />
                        {book.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {bookUnits.map((unit, idx) => (
                          <div key={unit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary">{idx + 1}</Badge>
                              <div>
                                <p className="font-medium">{unit.name}</p>
                                <p className="text-sm text-gray-500">{unit.sessions.length} {t('sessions')}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-white text-[#1a3673] border-[#1a3673]/30 hover:bg-[#1a3673]/10"
                                onClick={() => {
                                  setEditingUnit(unit);
                                  setUnitName(unit.name);
                                  setUnitBookId(unit.bookId);
                                  setUnitDescription(unit.description || '');
                                  setShowUnitDialog(true);
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                onClick={() => {
                                  setSelectedUnitForSession(unit);
                                  setShowSessionDialog(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-white text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                                onClick={() => {
                                  setItemToDelete({ type: 'unit', id: unit.id });
                                  setShowDeleteConfirm(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('groups')}</h2>
              <Button 
                onClick={() => {
                  resetGroupForm();
                  setShowGroupDialog(true);
                }}
                className="bg-[#1a3673] hover:bg-[#142a5a] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('addGroup')}
              </Button>
            </div>
            <div className="grid gap-4">
              {groups.map(group => {
                const groupBook = books.find(b => b.id === group.bookId);
                const groupStudents = students.filter(s => group.studentIds.includes(s.id));
                const groupUnits = units.filter(u => u.bookId === group.bookId).sort((a, b) => a.order - b.order);
                
                return (
                  <Card key={group.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{group.name}</h3>
                          <p className="text-sm text-gray-500">
                            {groupBook?.name} · {groupStudents.length} {t('students')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {group.unlockedUnitIds.length} / {groupUnits.length} {t('units')} {t('unlocked')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-white text-[#1a3673] border-[#1a3673]/30 hover:bg-[#1a3673]/10"
                            onClick={() => {
                              setEditingGroup(group);
                              setGroupName(group.name);
                              setGroupBookId(group.bookId);
                              setShowGroupDialog(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-white text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                            onClick={() => {
                              setItemToDelete({ type: 'group', id: group.id });
                              setShowDeleteConfirm(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Unlock units section */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">解锁单元 (点击解锁/锁定)</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white text-[#1a3673] border-[#1a3673]/30 hover:bg-[#1a3673]/10"
                            onClick={() => {
                              setEditingGroup(group);
                              setShowUnitOrderDialog(true);
                            }}
                          >
                            <ArrowUpDown className="w-3 h-3 mr-1" />
                            调整顺序
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {groupUnits.map((unit) => {
                            const isUnlocked = group.unlockedUnitIds.includes(unit.id);
                            
                            return (
                              <Button
                                key={unit.id}
                                variant="outline"
                                size="sm"
                                className={isUnlocked 
                                  ? 'bg-emerald-500 hover:bg-red-500 text-white border-emerald-500 hover:border-red-500 transition-colors' 
                                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                }
                                onClick={async () => {
                                  if (isUnlocked) {
                                    // Lock the unit
                                    await Database.lockUnitForGroup(group.id, unit.id);
                                    await loadData();
                                  } else {
                                    // Unlock the unit
                                    await handleUnlockUnit(group.id, unit.id);
                                    await loadData();
                                  }
                                }}
                                title={isUnlocked ? '点击锁定此单元' : '点击解锁此单元'}
                              >
                                {isUnlocked ? <Check className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                                {unit.name}
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Students section */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">学生列表</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-white text-[#1a3673] border-[#1a3673]/30 hover:bg-[#1a3673]/10"
                            onClick={() => {
                              setEditingGroup(group);
                              setShowAddStudentDialog(true);
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            添加学生
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {groupStudents.map(student => (
                            <Badge key={student.id} variant="secondary" className="flex items-center gap-1">
                              {student.name}
                              <button
                                onClick={async () => {
                                  await Database.removeStudentFromGroup(group.id, student.id);
                                  await loadData();
                                }}
                                className="ml-1 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('students')}</h2>
              <p className="text-sm text-gray-500">共 {students.length} 名学生</p>
            </div>
            <div className="grid gap-2">
              {students.map(student => {
                const studentGroup = groups.find(g => g.id === student.groupId);
                
                return (
                  <Card key={student.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#1a3673] rounded-full flex items-center justify-center text-white font-semibold">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                            <p className="text-xs text-gray-400">
                              {studentGroup ? studentGroup.name : '未分配班级'}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-white text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                          onClick={() => {
                            setItemToDelete({ type: 'user', id: student.id });
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Language Dialog */}
      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLanguage ? '编辑语言' : t('addLanguage')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>语言名称 (中文)</Label>
              <Input value={languageName} onChange={e => setLanguageName(e.target.value)} placeholder="例如：西班牙语" />
            </div>
            <div>
              <Label>语言名称 (英文)</Label>
              <Input value={languageNameEn} onChange={e => setLanguageNameEn(e.target.value)} placeholder="例如：Spanish" />
            </div>
            <div>
              <Label>头像URL (可选)</Label>
              <Input value={languageAvatar} onChange={e => setLanguageAvatar(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLanguageDialog(false)}>{t('cancel')}</Button>
            <Button onClick={handleSaveLanguage} className="bg-[#1a3673] hover:bg-[#142a5a] text-white">{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Book Dialog */}
      <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBook ? '编辑教材' : t('addBook')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>教材名称</Label>
              <Input value={bookName} onChange={e => setBookName(e.target.value)} placeholder="例如：西班牙语 A1" />
            </div>
            <div>
              <Label>所属语言</Label>
              <Select value={bookLanguageId} onValueChange={setBookLanguageId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择语言" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.id} value={lang.id}>{lang.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>封面URL (可选)</Label>
              <Input value={bookAvatar} onChange={e => setBookAvatar(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookDialog(false)}>{t('cancel')}</Button>
            <Button onClick={handleSaveBook} className="bg-[#1a3673] hover:bg-[#142a5a] text-white">{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unit Dialog */}
      <Dialog open={showUnitDialog} onOpenChange={setShowUnitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUnit ? '编辑单元' : t('addUnit')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingUnit && (
              <div>
                <Label>所属教材</Label>
                <Select value={unitBookId} onValueChange={setUnitBookId}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择教材" />
                  </SelectTrigger>
                  <SelectContent>
                    {books.map(book => (
                      <SelectItem key={book.id} value={book.id}>{book.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>单元名称</Label>
              <Input value={unitName} onChange={e => setUnitName(e.target.value)} placeholder="例如：第1课: 你好" />
            </div>
            <div>
              <Label>描述</Label>
              <Input value={unitDescription} onChange={e => setUnitDescription(e.target.value)} placeholder="简短描述..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnitDialog(false)}>{t('cancel')}</Button>
            <Button onClick={handleSaveUnit} className="bg-[#1a3673] hover:bg-[#142a5a] text-white">{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session List Dialog */}
      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>编辑单元内容</span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => selectedUnitForSession && setShowBulkUploadDialog(true)}
                  className="border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059]/10"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  批量上传
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => selectedUnitForSession && openAddSession(selectedUnitForSession)}
                  className="bg-[#c5a059] hover:bg-[#b08d4b] text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  添加新环节
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            {selectedUnitForSession && (
              <div className="space-y-4 py-4">
                <p className="font-medium text-[#1a3673]">{selectedUnitForSession.name}</p>
                <div className="space-y-2">
                  {selectedUnitForSession.sessions.sort((a, b) => a.order - b.order).map((session, idx) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{idx + 1}</Badge>
                        <span className="text-xl">{session.emoji}</span>
                        <div>
                          <p className="font-medium">{session.name}</p>
                          <p className="text-xs text-gray-500">
                            {session.ankiCards.length} 张卡片 · 
                            {session.htmlContent ? ' 有内容' : ' 无内容'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditSession(selectedUnitForSession!, session)}
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          编辑
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setItemToDelete({ type: 'session', id: session.id, extra: selectedUnitForSession.id });
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setShowSessionDialog(false)} variant="outline">{t('close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={showBulkUploadDialog} onOpenChange={setShowBulkUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量上传环节</DialogTitle>
            <DialogDescription>
              上传 HTML 文件，文件名格式：preview.html, review.html, grammar.html, audio.html 等。
              对应的 Anki 文件请命名为：preview_anki.html, review_anki.html 等。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">选择多个 HTML 文件</p>
              <p className="text-gray-400 text-sm mb-4">支持 .html 和 .txt 格式</p>
              <input
                ref={bulkUploadRef}
                type="file"
                accept=".html,.txt,.json"
                multiple
                onChange={handleBulkUpload}
                className="hidden"
              />
              <Button 
                onClick={() => bulkUploadRef.current?.click()}
                className="bg-[#1a3673] hover:bg-[#142a5a] text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                选择文件
              </Button>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">文件名示例：</p>
              <ul className="text-xs text-blue-600 mt-1 space-y-1">
                <li>• preview.html (环节内容)</li>
                <li>• preview_anki.json (Anki 卡片 - 可选)</li>
                <li>• review.html, grammar.html, audio.html...</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkUploadDialog(false)}>{t('cancel')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Session Dialog */}
      <Dialog open={showAddSessionDialog} onOpenChange={setShowAddSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加新环节</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>环节名称</Label>
              <Input 
                value={sessionName} 
                onChange={e => setSessionName(e.target.value)} 
                placeholder="例如：游戏练习"
              />
            </div>
            <div>
              <Label>表情符号</Label>
              <div className="grid grid-cols-8 gap-2 mt-2">
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setSessionEmoji(emoji)}
                    className={`p-2 text-2xl rounded-lg transition-colors ${
                      sessionEmoji === emoji ? 'bg-[#c5a059]/30 ring-2 ring-[#c5a059]' : 'hover:bg-gray-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSessionDialog(false)}>{t('cancel')}</Button>
            <Button 
              onClick={handleAddNewSession} 
              className="bg-[#c5a059] hover:bg-[#b08d4b] text-white"
              disabled={!sessionName || !sessionEmoji}
            >
              <Plus className="w-4 h-4 mr-1" />
              添加环节
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Content Editor */}
      <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>编辑 {editingSession?.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>名称</Label>
                  <Input value={sessionName} onChange={e => setSessionName(e.target.value)} />
                </div>
                <div>
                  <Label>表情符号</Label>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {EMOJI_OPTIONS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => setSessionEmoji(emoji)}
                        className={`p-2 text-xl rounded-lg transition-colors ${
                          sessionEmoji === emoji ? 'bg-[#c5a059]/30 ring-2 ring-[#c5a059]' : 'hover:bg-gray-100'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* HTML Content with File Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>HTML 内容</Label>
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".html,.htm"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-[#1a3673] text-[#1a3673] hover:bg-[#1a3673]/10"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      上传文件
                    </Button>
                  </div>
                </div>
                {uploadedFileName && (
                  <p className="text-sm text-emerald-600 mb-2">
                    已上传: {uploadedFileName}
                  </p>
                )}
                <Textarea 
                  value={sessionHtml} 
                  onChange={e => setSessionHtml(e.target.value)} 
                  placeholder="<div>HTML内容...</div>"
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
              
              <div>
                <Label>Anki 卡片 (JSON 或 格式: 正面|背面|发音|例句)</Label>
                <Textarea 
                  value={sessionAnki} 
                  onChange={e => setSessionAnki(e.target.value)} 
                  placeholder={`[{"front": "Hola", "back": "你好", "pronunciation": "[ˈo.la]", "example": "¡Hola!"}]`}
                  className="min-h-[150px] font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  或使用简单格式：正面|背面|发音|例句 (每行一张卡片)
                </p>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSession(null)}>{t('cancel')}</Button>
            <Button onClick={handleSaveSession} className="bg-[#1a3673] hover:bg-[#142a5a] text-white">
              <Save className="w-4 h-4 mr-1" />
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGroup ? '编辑班级' : t('addGroup')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>班级名称</Label>
              <Input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="例如：西班牙语强化班 A" />
            </div>
            <div>
              <Label>使用教材</Label>
              <Select value={groupBookId} onValueChange={setGroupBookId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择教材" />
                </SelectTrigger>
                <SelectContent>
                  {books.map(book => (
                    <SelectItem key={book.id} value={book.id}>{book.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGroupDialog(false)}>{t('cancel')}</Button>
            <Button onClick={handleSaveGroup} className="bg-[#1a3673] hover:bg-[#142a5a] text-white">{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student to Group Dialog */}
      <Dialog open={showAddStudentDialog} onOpenChange={setShowAddStudentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加学生到班级</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">选择要添加的学生：</p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {students
                .filter(s => !editingGroup?.studentIds.includes(s.id))
                .map(student => (
                  <div 
                    key={student.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={async () => {
                      if (editingGroup) {
                        await Database.addStudentToGroup(editingGroup.id, student.id);
                        await loadData();
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#1a3673] rounded-full flex items-center justify-center text-white text-sm">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.email}</p>
                      </div>
                    </div>
                    <Plus className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowAddStudentDialog(false)} variant="outline">{t('close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              确认删除
            </DialogTitle>
            <DialogDescription>
              此操作不可撤销。确定要删除吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>{t('cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t('delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unit Order Dialog */}
      <Dialog open={showUnitOrderDialog} onOpenChange={setShowUnitOrderDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>调整单元顺序</DialogTitle>
            <DialogDescription>
              点击下方单元添加到顺序列表，或从列表中移除重新选择
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Selected Units (Order) */}
            <div>
              <p className="text-sm font-medium mb-2 text-[#1a3673]">已选择的单元顺序（点击移除）：</p>
              <div className="flex flex-wrap gap-2 min-h-[50px] p-3 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                {editingGroup && units
                  .filter(u => u.bookId === editingGroup.bookId)
                  .sort((a, b) => {
                    const orderA = editingGroup.unitOrder?.indexOf(a.id) ?? -1;
                    const orderB = editingGroup.unitOrder?.indexOf(b.id) ?? -1;
                    if (orderA === -1 && orderB === -1) return a.order - b.order;
                    if (orderA === -1) return 1;
                    if (orderB === -1) return -1;
                    return orderA - orderB;
                  })
                  .filter(u => editingGroup.unitOrder?.includes(u.id) || editingGroup.unlockedUnitIds.includes(u.id))
                  .map((unit, idx) => (
                    <Button
                      key={unit.id}
                      variant="outline"
                      size="sm"
                      className="bg-emerald-500 hover:bg-red-500 text-white border-emerald-500 hover:border-red-500 transition-colors"
                      onClick={async () => {
                        if (editingGroup) {
                          const newOrder = (editingGroup.unitOrder || []).filter(id => id !== unit.id);
                          const newUnlocked = editingGroup.unlockedUnitIds.filter(id => id !== unit.id);
                          await Database.updateGroup(editingGroup.id, { 
                            unitOrder: newOrder,
                            unlockedUnitIds: newUnlocked 
                          });
                          await loadData();
                          setEditingGroup({...editingGroup, unitOrder: newOrder, unlockedUnitIds: newUnlocked});
                        }
                      }}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      {idx + 1}. {unit.name}
                    </Button>
                  ))}
                {(editingGroup?.unitOrder?.length === 0 && editingGroup?.unlockedUnitIds.length === 0) && (
                  <p className="text-gray-400 text-sm">尚未选择任何单元</p>
                )}
              </div>
            </div>

            {/* Available Units */}
            <div>
              <p className="text-sm font-medium mb-2 text-gray-600">可用单元（点击添加到顺序）：</p>
              <div className="flex flex-wrap gap-2">
                {editingGroup && units
                  .filter(u => u.bookId === editingGroup.bookId)
                  .sort((a, b) => a.order - b.order)
                  .filter(u => !editingGroup.unitOrder?.includes(u.id) && !editingGroup.unlockedUnitIds.includes(u.id))
                  .map(unit => (
                    <Button
                      key={unit.id}
                      variant="outline"
                      size="sm"
                      className="bg-white text-gray-600 border-gray-300 hover:bg-[#1a3673] hover:text-white transition-colors"
                      onClick={async () => {
                        if (editingGroup) {
                          const newOrder = [...(editingGroup.unitOrder || []), unit.id];
                          const newUnlocked = [...editingGroup.unlockedUnitIds, unit.id];
                          await Database.updateGroup(editingGroup.id, { 
                            unitOrder: newOrder,
                            unlockedUnitIds: newUnlocked 
                          });
                          await loadData();
                          setEditingGroup({...editingGroup, unitOrder: newOrder, unlockedUnitIds: newUnlocked});
                        }
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {unit.name}
                    </Button>
                  ))}
                {editingGroup && units.filter(u => u.bookId === editingGroup.bookId && !editingGroup.unitOrder?.includes(u.id) && !editingGroup.unlockedUnitIds.includes(u.id)).length === 0 && (
                  <p className="text-gray-400 text-sm">所有单元已添加</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowUnitOrderDialog(false)} className="bg-[#1a3673] hover:bg-[#142a5a] text-white">
              <Check className="w-4 h-4 mr-1" />
              完成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
