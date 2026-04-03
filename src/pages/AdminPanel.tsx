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
  ArrowUpDown, Lock as LockIcon
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdminPanelProps {
  onLogout: () => void;
}

const EMOJI_OPTIONS = [
  '👀', '📝', '📚', '🎧', '🎮', '🎯', '💡', '🔤', 
  '🗣️', '👂', '✍️', '📖', '🎬', '🎵', '🧩', '🏆',
  '⭐', '💬', '📋', '🔍', '💭', '🎨', '📊', '🔢'
];

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const { user: _user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('languages');
  
  const [languages, setLanguages] = useState<Language[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [selectedUnitForSession, setSelectedUnitForSession] = useState<Unit | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string; extra?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkUploadRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [langs, booksData, unitsData, groupsData, usersData] = await Promise.all([
        Database.getLanguages(), Database.getBooks(), Database.getUnits(), Database.getGroups(), Database.getUsers()
      ]);
      setLanguages(langs); setBooks(booksData); setUnits(unitsData); setGroups(groupsData);
      setStudents(usersData.filter(u => u.role === 'student'));
    } catch (error) { console.error('Error loading data:', error); }
    setIsLoading(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => { setSessionHtml(e.target?.result as string); };
    reader.readAsText(file);
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !selectedUnitForSession) return;
    const fileArray = Array.from(files);
    const uploadedSessions: { name: string; content: string; ankiContent: string }[] = [];
    for (const file of fileArray) {
      if (file.name.endsWith('.html') && !file.name.includes('_anki')) {
        const content = await file.text();
        const baseName = file.name.replace('.html', '');
        const ankiFile = fileArray.find(f => f.name === `${baseName}_anki.html` || f.name === `${baseName}_anki.txt` || f.name === `${baseName}_anki.json`);
        let ankiContent = '';
        if (ankiFile) ankiContent = await ankiFile.text();
        uploadedSessions.push({ name: baseName.charAt(0).toUpperCase() + baseName.slice(1), content, ankiContent });
      }
    }
    for (const sessionData of uploadedSessions) {
      const existingSession = selectedUnitForSession.sessions.find(s => s.name.toLowerCase() === sessionData.name.toLowerCase());
      let ankiCards = [];
      if (sessionData.ankiContent) {
        try { ankiCards = JSON.parse(sessionData.ankiContent); } catch (e) {
          const lines = sessionData.ankiContent.trim().split('\n');
          ankiCards = lines.map((line, idx) => {
            const parts = line.split('|');
            return { id: `card-${idx}`, front: parts[0]?.trim() || '', back: parts[1]?.trim() || '', pronunciation: parts[2]?.trim(), example: parts[3]?.trim() };
          }).filter(c => c.front && c.back);
        }
      }
      if (existingSession) {
        await Database.updateSession(existingSession.id, { "htmlContent": sessionData.content, "ankiCards": ankiCards });
      } else {
        const newOrder = selectedUnitForSession.sessions.length + 1;
        const emoji = EMOJI_OPTIONS.find(e => sessionData.name.toLowerCase().includes('preview') ? e === '👀' : sessionData.name.toLowerCase().includes('review') ? e === '📝' : sessionData.name.toLowerCase().includes('grammar') ? e === '📚' : sessionData.name.toLowerCase().includes('audio') ? e === '🎧' : e === '🎮') || '🎮';
        await Database.addSessionToUnit(selectedUnitForSession.id, { name: sessionData.name, emoji, "htmlContent": sessionData.content, "ankiCards": ankiCards, order: newOrder });
      }
    }
    await loadData();
    const updatedUnit = await Database.getUnitById(selectedUnitForSession.id);
    if (updatedUnit) setSelectedUnitForSession(updatedUnit);
    setShowBulkUploadDialog(false);
  };

  const handleSaveLanguage = async () => {
    const avatar = languageAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${languageNameEn}&backgroundColor=1a3673`;
    if (editingLanguage) await Database.updateLanguage(editingLanguage.id, { name: languageName, nameEn: languageNameEn, avatar });
    else await Database.createLanguage({ name: languageName, nameEn: languageNameEn, avatar });
    setShowLanguageDialog(false); resetLanguageForm(); await loadData();
  };
  const resetLanguageForm = () => { setLanguageName(''); setLanguageNameEn(''); setLanguageAvatar(''); setEditingLanguage(null); };

  const handleSaveBook = async () => {
    const avatar = bookAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${bookName}&backgroundColor=c5a059`;
    if (editingBook) await Database.updateBook(editingBook.id, { name: bookName, languageId: bookLanguageId, avatar });
    else {
      const booksInLanguage = await Database.getBooksByLanguage(bookLanguageId);
      await Database.createBook({ name: bookName, languageId: bookLanguageId, avatar, order: booksInLanguage.length + 1 });
    }
    setShowBookDialog(false); resetBookForm(); await loadData();
  };
  const resetBookForm = () => { setBookName(''); setBookLanguageId(''); setBookAvatar(''); setEditingBook(null); };

  const handleSaveUnit = async () => {
    if (editingUnit) {
      await Database.updateUnit(editingUnit.id, { name: unitName, description: unitDescription });
      setShowUnitDialog(false); resetUnitForm();
    } else {
      const unitsInBook = await Database.getUnitsByBook(unitBookId);
      const newUnit = await Database.createUnit({ bookId: unitBookId, name: unitName, description: unitDescription, order: unitsInBook.length + 1, sessions: [] });
      const defaultSessions = [{ name: 'Preview', emoji: '👀', order: 1 }, { name: 'Review', emoji: '📝', order: 2 }, { name: 'Grammar', emoji: '📚', order: 3 }, { name: 'Audio', emoji: '🎧', order: 4 }];
      for (const session of defaultSessions) {
        await Database.addSessionToUnit(newUnit.id, { name: session.name, emoji: session.emoji, "htmlContent": '', "ankiCards": [], order: session.order });
      }
      setShowUnitDialog(false); resetUnitForm();
    }
    await loadData();
  };
  const resetUnitForm = () => { setUnitName(''); setUnitBookId(''); setUnitDescription(''); setEditingUnit(null); };

  const handleAddNewSession = async () => {
    if (!selectedUnitForSession) return;
    await Database.addSessionToUnit(selectedUnitForSession.id, { name: sessionName, emoji: sessionEmoji, htmlContent: sessionHtml, ankiCards: [], order: selectedUnitForSession.sessions.length + 1 });
    setShowAddSessionDialog(false); resetSessionForm(); await loadData();
    const updatedUnit = await Database.getUnitById(selectedUnitForSession.id);
    if (updatedUnit) setSelectedUnitForSession(updatedUnit);
  };

  const handleSaveSession = async () => {
    if (!selectedUnitForSession || !editingSession) return;
    let ankiCards = [];
    try { if (sessionAnki.trim()) ankiCards = JSON.parse(sessionAnki); } catch (e) {
      const lines = sessionAnki.trim().split('\n');
      ankiCards = lines.map((line, idx) => {
        const parts = line.split('|');
        return { id: `card-${idx}`, front: parts[0]?.trim() || '', back: parts[1]?.trim() || '', pronunciation: parts[2]?.trim(), example: parts[3]?.trim() };
      }).filter(c => c.front && c.back);
    }
    await Database.updateSession(editingSession.id, { "name": sessionName, "emoji": sessionEmoji, "htmlContent": sessionHtml, "ankiCards": ankiCards });
    setShowSessionDialog(false); resetSessionForm(); await loadData();
    const updatedUnit = await Database.getUnitById(selectedUnitForSession.id);
    if (updatedUnit) setSelectedUnitForSession(updatedUnit);
  };

  const handleSaveGroup = async () => {
    if (editingGroup) await Database.updateGroup(editingGroup.id, { name: groupName, bookId: groupBookId });
    else {
      const book = await Database.getBookById(groupBookId);
      await Database.createGroup({ name: groupName, bookId: groupBookId, languageId: book?.languageId || '', studentIds: [], unlockedUnitIds: [] });
    }
    setShowGroupDialog(false); resetGroupForm(); await loadData();
  };
  const resetGroupForm = () => { setGroupName(''); setGroupBookId(''); setEditingGroup(null); };

  const handleUnlockUnit = async (groupId: string, unitId: string) => { await Database.unlockUnitForGroup(groupId, unitId); await loadData(); };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    switch (itemToDelete.type) {
      case 'language': await Database.deleteLanguage(itemToDelete.id); break;
      case 'book': await Database.deleteBook(itemToDelete.id); break;
      case 'unit': await Database.deleteUnit(itemToDelete.id); break;
      case 'group': await Database.deleteGroup(itemToDelete.id); break;
      case 'user': await Database.deleteUser(itemToDelete.id); break;
      case 'session': if (itemToDelete.extra) await Database.deleteSession(itemToDelete.id); break;
    }
    setShowDeleteConfirm(false); setItemToDelete(null); await loadData();
  };

  const openEditSession = (unit: Unit, session: Session) => {
    setSelectedUnitForSession(unit); setEditingSession(session); setSessionName(session.name); setSessionEmoji(session.emoji); setSessionHtml(session.htmlContent);
    setSessionAnki(JSON.stringify(session.ankiCards, null, 2)); setUploadedFileName(''); setShowSessionDialog(true);
  };
  const openAddSession = (unit: Unit) => { setSelectedUnitForSession(unit); setSessionName(''); setSessionEmoji('🎮'); setSessionHtml(''); setSessionAnki(''); setUploadedFileName(''); setShowAddSessionDialog(true); };

  const getLanguageName = (id: string) => languages.find(l => l.id === id)?.name || '-';

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-[#1a3673] border-t-transparent rounded-full mx-auto mb-4" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1a3673] text-white p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <img src="/logofinal.png" alt="Logo" className="w-10 h-10 object-contain" />
            <div><h1 className="text-lg font-bold">管理后台</h1><p className="text-xs text-white/70">Admin Panel</p></div>
          </div>
          <Button variant="outline" size="sm" onClick={onLogout} className="border-white/30 text-white hover:bg-white/10">{t('logout')}</Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="languages" className="flex items-center gap-2"><Globe className="w-4 h-4" /><span className="hidden sm:inline">{t('languages')}</span></TabsTrigger>
            <TabsTrigger value="books" className="flex items-center gap-2"><BookOpen className="w-4 h-4" /><span className="hidden sm:inline">{t('books')}</span></TabsTrigger>
            <TabsTrigger value="units" className="flex items-center gap-2"><Layers className="w-4 h-4" /><span className="hidden sm:inline">{t('units')}</span></TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2"><Users className="w-4 h-4" /><span className="hidden sm:inline">{t('groups')}</span></TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2"><GraduationCap className="w-4 h-4" /><span className="hidden sm:inline">{t('students')}</span></TabsTrigger>
          </TabsList>

          <TabsContent value="languages">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('languages')}</h2>
              <Button onClick={() => { resetLanguageForm(); setShowLanguageDialog(true); }} className="bg-[#1a3673] text-white"><Plus className="w-4 h-4 mr-2" />{t('addLanguage')}</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {languages.map(lang => (
                <Card key={lang.id} className="group"><CardContent className="p-4 text-center">
                  <img src={lang.avatar} className="w-16 h-16 rounded-full mx-auto mb-3" />
                  <h3 className="font-semibold">{lang.name}</h3><p className="text-sm text-gray-500">{lang.nameEn}</p>
                  <div className="flex justify-center gap-2 mt-3"><Button variant="outline" size="sm" onClick={() => { setEditingLanguage(lang); setLanguageName(lang.name); setLanguageNameEn(lang.nameEn); setLanguageAvatar(lang.avatar); setShowLanguageDialog(true); }}><Edit2 className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => { setItemToDelete({ type: 'language', id: lang.id }); setShowDeleteConfirm(true); }}><Trash2 className="w-4 h-4" /></Button></div>
                </CardContent></Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="books">
            <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">{t('books')}</h2><Button onClick={() => { resetBookForm(); setShowBookDialog(true); }} className="bg-[#1a3673] text-white"><Plus className="w-4 h-4 mr-2" />{t('addBook')}</Button></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {books.map(book => (
                <Card key={book.id} className="group"><CardContent className="p-4 text-center">
                  <img src={book.avatar} className="w-16 h-20 rounded mx-auto mb-3 object-cover" /><h3 className="font-semibold">{book.name}</h3><p className="text-xs text-gray-500">{getLanguageName(book.languageId)}</p>
                  <div className="flex justify-center gap-2 mt-3"><Button variant="outline" size="sm" onClick={() => { setEditingBook(book); setBookName(book.name); setBookLanguageId(book.languageId); setBookAvatar(book.avatar); setShowBookDialog(true); }}><Edit2 className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => { setItemToDelete({ type: 'book', id: book.id }); setShowDeleteConfirm(true); }}><Trash2 className="w-4 h-4" /></Button></div>
                </CardContent></Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="units">
            <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">{t('units')}</h2><Button onClick={() => { resetUnitForm(); setShowUnitDialog(true); }} className="bg-[#1a3673] text-white"><Plus className="w-4 h-4 mr-2" />{t('addUnit')}</Button></div>
            <div className="space-y-4">{books.map(book => {
              const bookUnits = units.filter(u => u.bookId === book.id).sort((a,b) => a.order - b.order);
              return bookUnits.length > 0 ? (
                <Card key={book.id}><CardHeader><CardTitle className="text-lg">{book.name}</CardTitle></CardHeader><CardContent className="space-y-2">
                  {bookUnits.map((unit, idx) => (
                    <div key={unit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex gap-3"><Badge variant="secondary">{idx+1}</Badge><div><p className="font-medium">{unit.name}</p></div></div>
                      <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => { setEditingUnit(unit); setUnitName(unit.name); setUnitBookId(unit.bookId); setUnitDescription(unit.description || ''); setShowUnitDialog(true); }}><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => { setSelectedUnitForSession(unit); setShowSessionDialog(true); }}><Eye className="w-4 h-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => { setItemToDelete({ type: 'unit', id: unit.id }); setShowDeleteConfirm(true); }}><Trash2 className="w-4 h-4" /></Button></div>
                    </div>
                  ))}
                </CardContent></Card>
              ) : null;
            })}</div>
          </TabsContent>

          <TabsContent value="groups">
            <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">{t('groups')}</h2><Button onClick={() => { resetGroupForm(); setShowGroupDialog(true); }} className="bg-[#1a3673] text-white"><Plus className="w-4 h-4 mr-2" />{t('addGroup')}</Button></div>
            <div className="grid gap-4">{groups.map(group => {
              const groupBook = books.find(b => b.id === group.bookId);
              const groupStudents = students.filter(s => group.studentIds.includes(s.id));
              const groupUnits = units.filter(u => u.bookId === group.bookId).sort((a,b) => a.order - b.order);
              return (
                <Card key={group.id}><CardContent className="p-4">
                  <div className="flex justify-between"><div><h3 className="font-semibold text-lg">{group.name}</h3><p className="text-sm text-gray-500">{groupBook?.name} · {groupStudents.length} 学生</p></div>
                  <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => { setEditingGroup(group); setGroupName(group.name); setGroupBookId(group.bookId); setShowGroupDialog(true); }}><Edit2 className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => { setItemToDelete({ type: 'group', id: group.id }); setShowDeleteConfirm(true); }}><Trash2 className="w-4 h-4" /></Button></div></div>
                  <div className="mt-4 pt-4 border-t"><p className="text-sm font-medium mb-2">解锁单元</p><div className="flex flex-wrap gap-2">
                    {groupUnits.map(unit => {
                      const isUnlocked = group.unlockedUnitIds.includes(unit.id);
                      return (<Button key={unit.id} variant="outline" size="sm" className={isUnlocked ? 'bg-emerald-500 text-white' : ''} onClick={() => isUnlocked ? Database.lockUnitForGroup(group.id, unit.id).then(loadData) : handleUnlockUnit(group.id, unit.id)}>{isUnlocked ? <Check className="w-3 h-3 mr-1" /> : <LockIcon className="w-3 h-3 mr-1" />}{unit.name}</Button>);
                    })}
                  </div></div>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center"><p className="text-sm font-medium">学生列表</p><Button size="sm" variant="outline" onClick={() => { setEditingGroup(group); setShowAddStudentDialog(true); }}><Plus className="w-3 h-3 mr-1" />添加学生</Button></div>
                  <div className="flex flex-wrap gap-2 mt-2">{groupStudents.map(s => (<Badge key={s.id} variant="secondary">{s.name}<X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => Database.removeStudentFromGroup(group.id, s.id).then(loadData)} /></Badge>))}</div>
                </CardContent></Card>
              );
            })}</div>
          </TabsContent>

          <TabsContent value="students">
            <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">{t('students')}</h2></div>
            <div className="grid gap-2">{students.map(student => (<Card key={student.id}><CardContent className="p-4 flex justify-between items-center"><div><p className="font-medium">{student.name}</p><p className="text-xs text-gray-500">{student.email}</p></div><Button variant="outline" size="sm" onClick={() => { setItemToDelete({ type: 'user', id: student.id }); setShowDeleteConfirm(true); }}><Trash2 className="w-4 h-4" /></Button></CardContent></Card>))}</div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs - Todos unificados em uma lista limpa */}
      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}><DialogContent><DialogHeader><DialogTitle>{editingLanguage ? '编辑' : '添加'}语言</DialogTitle></DialogHeader><div className="space-y-4 py-4"><div><Label>中文名称</Label><Input value={languageName} onChange={e => setLanguageName(e.target.value)} /></div><div><Label>英文名称</Label><Input value={languageNameEn} onChange={e => setLanguageNameEn(e.target.value)} /></div></div><DialogFooter><Button onClick={handleSaveLanguage} className="bg-[#1a3673] text-white">{t('save')}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}><DialogContent><DialogHeader><DialogTitle>{editingBook ? '编辑' : '添加'}教材</DialogTitle></DialogHeader><div className="space-y-4 py-4"><div><Label>教材名称</Label><Input value={bookName} onChange={e => setBookName(e.target.value)} /></div><div><Label>所属语言</Label><Select value={bookLanguageId} onValueChange={setBookLanguageId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{languages.map(l => (<SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>))}</SelectContent></Select></div></div><DialogFooter><Button onClick={handleSaveBook} className="bg-[#1a3673] text-white">{t('save')}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={showUnitDialog} onOpenChange={setShowUnitDialog}><DialogContent><DialogHeader><DialogTitle>{editingUnit ? '编辑' : '添加'}单元</DialogTitle></DialogHeader><div className="space-y-4 py-4"><div><Label>单元名称</Label><Input value={unitName} onChange={e => setUnitName(e.target.value)} /></div>{!editingUnit && (<div><Label>所属教材</Label><Select value={unitBookId} onValueChange={setUnitBookId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{books.map(b => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}</SelectContent></Select></div>)}</div><DialogFooter><Button onClick={handleSaveUnit} className="bg-[#1a3673] text-white">{t('save')}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}><DialogContent><DialogHeader><DialogTitle>{editingGroup ? '编辑' : '添加'}班级</DialogTitle></DialogHeader><div className="space-y-4 py-4"><div><Label>班级名称</Label><Input value={groupName} onChange={e => setGroupName(e.target.value)} /></div><div><Label>选择教材</Label><Select value={groupBookId} onValueChange={setGroupBookId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{books.map(b => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}</SelectContent></Select></div></div><DialogFooter><Button onClick={handleSaveGroup} className="bg-[#1a3673] text-white">{t('save')}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={showAddStudentDialog} onOpenChange={setShowAddStudentDialog}><DialogContent><DialogHeader><DialogTitle>添加学生</DialogTitle></DialogHeader><div className="max-h-[300px] overflow-y-auto space-y-2">{students.filter(s => !editingGroup?.studentIds.includes(s.id)).map(s => (<div key={s.id} className="flex justify-between p-2 bg-gray-50 rounded" onClick={() => Database.addStudentToGroup(editingGroup!.id, s.id).then(loadData)}><p>{s.name}</p><Plus className="w-4 h-4" /></div>))}</div></DialogContent></Dialog>
      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle className="flex justify-between">编辑单元环节<div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setShowBulkUploadDialog(true)}><Upload className="w-4 h-4 mr-1" />批量</Button><Button size="sm" onClick={() => openAddSession(selectedUnitForSession!)}><Plus className="w-4 h-4 mr-1" />添加</Button></div></DialogTitle></DialogHeader><ScrollArea className="h-[50vh]">{selectedUnitForSession?.sessions.map(s => (<div key={s.id} className="flex justify-between p-2 border-b"><span>{s.emoji} {s.name}</span><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => openEditSession(selectedUnitForSession!, s)}><Edit2 className="w-3 h-3" /></Button><Button size="sm" variant="outline" onClick={() => { setItemToDelete({ type: 'session', id: s.id, extra: selectedUnitForSession.id }); setShowDeleteConfirm(true); }}><Trash2 className="w-3 h-3" /></Button></div></div>))}</ScrollArea></DialogContent></Dialog>
      <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}><DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>编辑环节</DialogTitle></DialogHeader><div className="space-y-4"><Input value={sessionName} onChange={e => setSessionName(e.target.value)} /><Textarea className="h-[200px]" value={sessionHtml} onChange={e => setSessionHtml(e.target.value)} /><Textarea placeholder="Anki cards..." value={sessionAnki} onChange={e => setSessionAnki(e.target.value)} /></div><DialogFooter><Button onClick={handleSaveSession} className="bg-[#1a3673] text-white">{t('save')}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={showBulkUploadDialog} onOpenChange={setShowBulkUploadDialog}><DialogContent><DialogHeader><DialogTitle>批量上传</DialogTitle></DialogHeader><div className="p-8 border-2 border-dashed text-center"><input ref={bulkUploadRef} type="file" multiple className="hidden" onChange={handleBulkUpload} /><Button onClick={() => bulkUploadRef.current?.click()}><Upload className="w-4 h-4 mr-2" />选择文件</Button></div></DialogContent></Dialog>
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}><DialogContent><DialogHeader><DialogTitle>确认删除</DialogTitle></DialogHeader><DialogFooter><Button variant="destructive" onClick={handleDelete}>{t('delete')}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
