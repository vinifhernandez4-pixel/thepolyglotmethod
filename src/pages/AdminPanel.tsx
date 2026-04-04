import { useState, useEffect } from 'react';
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
  Save, Check, Upload, Lock as LockIcon
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdminPanelProps {
  onLogout: () => void;
}

const EMOJI_OPTIONS = [
  '👀', '📝', '📚', '🎧', '🎮', '🎯', '💡', '🔤', 
  '🗣️', '👂', '✍️', '📖', '🎬', '🎵', '🧩', '🏆'
];

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('languages');
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

  // Form states
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [selectedUnitForSession, setSelectedUnitForSession] = useState<Unit | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string; extra?: string } | null>(null);

  const [languageName, setLanguageName] = useState('');
  const [languageNameEn, setLanguageNameEn] = useState('');
  const [languageAvatar, setLanguageAvatar] = useState('');
  const [bookName, setBookName] = useState('');
  const [bookLanguageId, setBookLanguageId] = useState('');
  const [bookAvatar, setBookAvatar] = useState('');
  const [unitName, setUnitName] = useState('');
  const [unitBookId, setUnitBookId] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [sessionEmoji, setSessionEmoji] = useState('');
  const [sessionHtml, setSessionHtml] = useState('');
  const [sessionAnki, setSessionAnki] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [langs, booksData, unitsData, groupsData, usersData] = await Promise.all([
        Database.getLanguages(), Database.getBooks(), Database.getUnits(), Database.getGroups(), Database.getUsers()
      ]);
      setLanguages(langs); setBooks(booksData); setUnits(unitsData); setGroups(groupsData);
      setStudents(usersData.filter(u => u.role === 'student'));
    } catch (error) { console.error(error); }
    setIsLoading(false);
  };

  const handleSaveLanguage = async () => {
    if (editingLanguage) {
      await Database.updateLanguage(editingLanguage.id, { name: languageName, nameEn: languageNameEn, avatar: languageAvatar });
    } else {
      await Database.createLanguage({ name: languageName, nameEn: languageNameEn, avatar: languageAvatar });
    }
    setShowLanguageDialog(false); loadData();
  };

  const handleSaveBook = async () => {
    if (editingBook) {
      await Database.updateBook(editingBook.id, { name: bookName, languageId: bookLanguageId, avatar: bookAvatar });
    } else {
      await Database.createBook({ name: bookName, languageId: bookLanguageId, avatar: bookAvatar, order: books.length + 1 });
    }
    setShowBookDialog(false); loadData();
  };

  const handleSaveUnit = async () => {
    if (editingUnit) {
      await Database.updateUnit(editingUnit.id, { name: unitName });
    } else {
      const newUnit = await Database.createUnit({ bookId: unitBookId, name: unitName, description: '', order: units.length + 1, sessions: [] });
      
      // CRIAÇÃO AUTOMÁTICA DE SESSÕES
      const defaults = [
        { n: 'Preview', e: '👀', o: 1 },
        { n: 'Review', e: '📝', o: 2 },
        { n: 'Grammar', e: '📚', o: 3 },
        { n: 'Audio', e: '🎧', o: 4 }
      ];
      for (const s of defaults) {
        await Database.addSessionToUnit(newUnit.id, { name: s.n, emoji: s.e, order: s.o, htmlContent: '', ankiCards: [] });
      }
    }
    setShowUnitDialog(false); loadData();
  };

  const handleSaveSession = async () => {
    if (!editingSession) return;
    let ankiCards = [];
    try { if (sessionAnki.trim()) ankiCards = JSON.parse(sessionAnki); } catch (e) {
      ankiCards = sessionAnki.trim().split('\n').map((line, idx) => {
        const parts = line.split('|');
        return { id: `card-${idx}`, front: parts[0]?.trim() || '', back: parts[1]?.trim() || '', pronunciation: parts[2]?.trim(), example: parts[3]?.trim() };
      }).filter(c => c.front && c.back);
    }
    await Database.updateSession(editingSession.id, { "name": sessionName, "emoji": sessionEmoji, "htmlContent": sessionHtml, "ankiCards": ankiCards });
    setEditingSession(null); loadData();
  };

  const handleSaveGroup = async () => {
    if (editingGroup) await Database.updateGroup(editingGroup.id, { name: groupName, bookId: groupBookId });
    else await Database.createGroup({ name: groupName, bookId: groupBookId, languageId: '', studentIds: [], unlockedUnitIds: [] });
    setShowGroupDialog(false); loadData();
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    const { type, id } = itemToDelete;
    if (type === 'language') await Database.deleteLanguage(id);
    else if (type === 'book') await Database.deleteBook(id);
    else if (type === 'unit') await Database.deleteUnit(id);
    else if (type === 'group') await Database.deleteGroup(id);
    else if (type === 'user') await Database.deleteUser(id);
    else if (type === 'session') await Database.deleteSession(id);
    setShowDeleteConfirm(false); loadData();
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center text-gray-900">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-[#1a3673] text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <Button variant="outline" onClick={onLogout} className="text-white border-white hover:bg-white/10">Logout</Button>
      </header>

      <main className="p-4 max-w-6xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 grid grid-cols-5 bg-white border shadow-sm">
            <TabsTrigger value="languages" className="text-gray-700 data-[state=active]:bg-gray-100"><Globe className="w-4 h-4 mr-2"/>Languages</TabsTrigger>
            <TabsTrigger value="books" className="text-gray-700 data-[state=active]:bg-gray-100"><BookOpen className="w-4 h-4 mr-2"/>Books</TabsTrigger>
            <TabsTrigger value="units" className="text-gray-700 data-[state=active]:bg-gray-100"><Layers className="w-4 h-4 mr-2"/>Units</TabsTrigger>
            <TabsTrigger value="groups" className="text-gray-700 data-[state=active]:bg-gray-100"><Users className="w-4 h-4 mr-2"/>Groups</TabsTrigger>
            <TabsTrigger value="students" className="text-gray-700 data-[state=active]:bg-gray-100"><GraduationCap className="w-4 h-4 mr-2"/>Students</TabsTrigger>
          </TabsList>

          {/* LANGUAGES */}
          <TabsContent value="languages">
            <Button onClick={() => { setEditingLanguage(null); setLanguageName(''); setLanguageNameEn(''); setLanguageAvatar(''); setShowLanguageDialog(true); }} className="mb-4 bg-[#1a3673] text-white"><Plus className="mr-2" />Add Language</Button>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {languages.map(l => (
                <Card key={l.id} className="bg-white shadow-sm border-gray-200"><CardContent className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {l.avatar && <img src={l.avatar} className="w-8 h-8 rounded-full border shadow-sm" />}
                    <span className="font-medium text-gray-800">{l.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="text-gray-600" onClick={() => { setEditingLanguage(l); setLanguageName(l.name); setLanguageNameEn(l.nameEn); setLanguageAvatar(l.avatar); setShowLanguageDialog(true); }}><Edit2 className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => { setItemToDelete({ type: 'language', id: l.id }); setShowDeleteConfirm(true); }}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          </TabsContent>

          {/* GROUPS */}
          <TabsContent value="groups">
            <Button onClick={() => { setEditingGroup(null); setGroupName(''); setGroupBookId(''); setShowGroupDialog(true); }} className="mb-4 bg-[#1a3673] text-white"><Plus className="mr-2" />Add Group</Button>
            <div className="grid gap-4">
              {groups.map(g => {
                const groupStudents = students.filter(s => g.studentIds.includes(s.id));
                const groupUnits = units.filter(u => u.bookId === g.bookId);
                return (
                  <Card key={g.id} className="bg-white shadow-sm border-gray-200"><CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div><h3 className="text-lg font-bold text-[#1a3673]">{g.name}</h3><p className="text-sm text-gray-500 font-medium">{groupStudents.length} Students Assigned</p></div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="text-gray-600" onClick={() => { setEditingGroup(g); setGroupName(g.name); setGroupBookId(g.bookId); setShowGroupDialog(true); }}><Edit2 className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => { setItemToDelete({ type: 'group', id: g.id }); setShowDeleteConfirm(true); }}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <Label className="text-gray-700 font-bold mb-2 block uppercase text-xs tracking-wider">Unities Unlocked</Label>
                      <div className="flex flex-wrap gap-2">
                        {groupUnits.map(u => (
                          <Button key={u.id} size="sm" variant={g.unlockedUnitIds.includes(u.id) ? "default" : "outline"} className={g.unlockedUnitIds.includes(u.id) ? "bg-emerald-600 text-white" : "text-gray-600 border-gray-300"} onClick={() => g.unlockedUnitIds.includes(u.id) ? Database.lockUnitForGroup(g.id, u.id).then(loadData) : Database.unlockUnitForGroup(g.id, u.id).then(loadData)}>
                            {g.unlockedUnitIds.includes(u.id) ? <Check className="w-3 h-3 mr-1" /> : <LockIcon className="w-3 h-3 mr-1" />} {u.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="border-t pt-4 mt-4 flex justify-between items-center">
                      <Label className="text-gray-700 font-bold uppercase text-xs tracking-wider">Students</Label>
                      <Button size="sm" variant="outline" className="text-[#1a3673] border-[#1a3673]" onClick={() => { setEditingGroup(g); setShowAddStudentDialog(true); }}><Plus className="w-3 h-3 mr-1" />Add Student</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {groupStudents.map(s => <Badge key={s.id} variant="secondary" className="bg-gray-100 text-gray-800 border-gray-300 flex items-center gap-1">{s.name} <X className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500" onClick={() => Database.removeStudentFromGroup(g.id, s.id).then(loadData)} /></Badge>)}
                    </div>
                  </CardContent></Card>
                );
              })}
            </div>
          </TabsContent>

          {/* BOOKS, UNITS & STUDENTS */}
          <TabsContent value="books">
            <Button onClick={() => { setBookName(''); setBookLanguageId(''); setBookAvatar(''); setEditingBook(null); setShowBookDialog(true); }} className="mb-4 bg-[#1a3673] text-white">Add Book</Button>
            {books.map(b => <Card key={b.id} className="mb-2 bg-white"><CardContent className="p-3 flex justify-between items-center text-gray-800 font-medium">{b.name}<Trash2 className="w-4 h-4 text-red-500 cursor-pointer" onClick={() => { setItemToDelete({type:'book', id:b.id}); setShowDeleteConfirm(true); }} /></CardContent></Card>)}
          </TabsContent>
          <TabsContent value="units">
            <Button onClick={() => { setUnitName(''); setUnitBookId(''); setEditingUnit(null); setShowUnitDialog(true); }} className="mb-4 bg-[#1a3673] text-white">Add Unit</Button>
            {units.map(u => <Card key={u.id} className="mb-2 bg-white"><CardContent className="p-3 flex justify-between items-center font-medium text-gray-800"><span>{u.name}</span><div className="flex gap-2"><Eye className="w-4 h-4 text-emerald-600 cursor-pointer" onClick={() => { setSelectedUnitForSession(u); setShowSessionDialog(true); }} /><Trash2 className="w-4 h-4 text-red-500 cursor-pointer" onClick={() => { setItemToDelete({type:'unit', id:u.id}); setShowDeleteConfirm(true); }} /></div></CardContent></Card>)}
          </TabsContent>
          <TabsContent value="students">
            <div className="grid gap-2">{students.map(s => <Card key={s.id} className="bg-white"><CardContent className="p-3 flex justify-between items-center"><div><p className="font-bold text-gray-800">{s.name}</p><p className="text-xs text-gray-500">{s.email}</p></div><Trash2 className="w-4 h-4 text-red-500 cursor-pointer" onClick={() => {setItemToDelete({type:'user', id:s.id}); setShowDeleteConfirm(true);}} /></CardContent></Card>)}</div>
          </TabsContent>
        </Tabs>
      </main>

      {/* DIALOGS - TODOS COM LABELS CLARAS E TEXTO ESCURO */}
      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}><DialogContent className="bg-white">
        <DialogHeader><DialogTitle className="text-[#1a3673]">Language Details</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-gray-700">Native Name</Label><Input className="text-gray-900 border-gray-300" value={languageName} onChange={e => setLanguageName(e.target.value)} /></div>
          <div><Label className="text-gray-700">English Name</Label><Input className="text-gray-900 border-gray-300" value={languageNameEn} onChange={e => setLanguageNameEn(e.target.value)} /></div>
          <div><Label className="text-gray-700">Image Avatar URL</Label><Input className="text-gray-900 border-gray-300" value={languageAvatar} onChange={e => setLanguageAvatar(e.target.value)} /></div>
        </div>
        <DialogFooter><Button onClick={handleSaveLanguage} className="bg-[#1a3673] text-white">Save</Button></DialogFooter>
      </DialogContent></Dialog>

      <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}><DialogContent className="bg-white">
        <DialogHeader><DialogTitle className="text-[#1a3673]">Book Details</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-gray-700">Book Name</Label><Input className="text-gray-900 border-gray-300" value={bookName} onChange={e => setBookName(e.target.value)} /></div>
          <div><Label className="text-gray-700">Avatar Image URL</Label><Input className="text-gray-900 border-gray-300" value={bookAvatar} onChange={e => setBookAvatar(e.target.value)} /></div>
          <div><Label className="text-gray-700">Language</Label><Select value={bookLanguageId} onValueChange={setBookLanguageId}><SelectTrigger className="text-gray-900 border-gray-300"><SelectValue /></SelectTrigger><SelectContent className="bg-white">{languages.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <DialogFooter><Button onClick={handleSaveBook} className="bg-[#1a3673] text-white">Save</Button></DialogFooter>
      </DialogContent></Dialog>

      <Dialog open={showUnitDialog} onOpenChange={setShowUnitDialog}><DialogContent className="bg-white">
        <DialogHeader><DialogTitle className="text-[#1a3673]">Unit Details</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-gray-700">Unit Name</Label><Input className="text-gray-900 border-gray-300" value={unitName} onChange={e => setUnitName(e.target.value)} /></div>
          <div><Label className="text-gray-700">Assign to Book</Label><Select value={unitBookId} onValueChange={setUnitBookId}><SelectTrigger className="text-gray-900 border-gray-300"><SelectValue /></SelectTrigger><SelectContent className="bg-white">{books.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <DialogFooter><Button onClick={handleSaveUnit} className="bg-[#1a3673] text-white">Save Unit (Autocreates Sessions)</Button></DialogFooter>
      </DialogContent></Dialog>

      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}><DialogContent className="bg-white">
        <DialogHeader><DialogTitle className="text-[#1a3673]">Group Details</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-gray-700">Group Name</Label><Input className="text-gray-900 border-gray-300" value={groupName} onChange={e => setGroupName(e.target.value)} /></div>
          <div><Label className="text-gray-700">Assigned Book</Label><Select value={groupBookId} onValueChange={setGroupBookId}><SelectTrigger className="text-gray-900 border-gray-300"><SelectValue /></SelectTrigger><SelectContent className="bg-white">{books.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <DialogFooter><Button onClick={handleSaveGroup} className="bg-[#1a3673] text-white">Save Group</Button></DialogFooter>
      </DialogContent></Dialog>

      <Dialog open={showAddStudentDialog} onOpenChange={setShowAddStudentDialog}><DialogContent className="bg-white">
        <DialogHeader><DialogTitle className="text-[#1a3673]">Select Student</DialogTitle></DialogHeader>
          <ScrollArea className="h-60">
            {students.filter(s => !editingGroup?.studentIds.includes(s.id)).map(s => (
              <div key={s.id} className="p-3 border-b cursor-pointer hover:bg-gray-100 flex justify-between items-center text-gray-800" onClick={() => Database.addStudentToGroup(editingGroup!.id, s.id).then(loadData)}>
                <span>{s.name} <span className="text-xs text-gray-500">({s.email})</span></span><Plus className="w-4 h-4 text-[#1a3673]"/>
              </div>
            ))}
          </ScrollArea>
      </DialogContent></Dialog>
      
      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}><DialogContent className="max-w-2xl bg-white">
        <DialogHeader><DialogTitle className="flex justify-between items-center text-[#1a3673]">Sessions List</DialogTitle></DialogHeader>
          <ScrollArea className="h-80">
            {selectedUnitForSession?.sessions.map(s => (
              <div key={s.id} className="p-3 border-b flex justify-between items-center text-gray-800">
                <span className="font-medium">{s.emoji} {s.name}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-gray-300 text-[#1a3673]" onClick={() => { setEditingSession(s); setSessionName(s.name); setSessionEmoji(s.emoji); setSessionHtml(s.htmlContent); setSessionAnki(JSON.stringify(s.ankiCards, null, 2)); setShowSessionDialog(false); }}><Edit2 className="w-3 h-3 mr-1"/>Edit</Button>
                  <Button size="sm" variant="outline" className="border-gray-300 text-red-500" onClick={() => {setItemToDelete({type:'session', id:s.id}); setShowDeleteConfirm(true);}}><Trash2 className="w-3 h-3"/></Button>
                </div>
              </div>
            ))}
          </ScrollArea>
      </DialogContent></Dialog>

      <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}><DialogContent className="max-w-4xl bg-white">
          <DialogHeader><DialogTitle className="text-[#1a3673]">Session Editor</DialogTitle></DialogHeader>
          <Label className="text-gray-700 font-bold">Session Name</Label>
          <Input value={sessionName} onChange={e => setSessionName(e.target.value)} className="mb-2 text-gray-900" />
          <div className="flex gap-2 mb-2 p-2 bg-gray-50 rounded border border-gray-200">
            {EMOJI_OPTIONS.map(e => <button key={e} onClick={() => setSessionEmoji(e)} className={`p-1 rounded text-xl ${sessionEmoji === e ? 'bg-[#c5a059]/30 ring-1 ring-[#c5a059]' : 'hover:bg-gray-200'}`}>{e}</button>)}
          </div>
          <Label className="text-gray-700 font-bold">HTML Code</Label>
          <Textarea className="h-60 font-mono text-xs text-gray-900 border-gray-300" value={sessionHtml} onChange={e => setSessionHtml(e.target.value)} placeholder="PASTE HTML HERE" />
          <Label className="text-gray-700 font-bold mt-2">Anki JSON</Label>
          <Textarea className="h-32 font-mono text-xs text-gray-900 border-gray-300" value={sessionAnki} onChange={e => setSessionAnki(e.target.value)} placeholder="Anki cards format..." />
          <DialogFooter><Button onClick={handleSaveSession} className="bg-[#1a3673] text-white">Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}><DialogContent className="bg-white">
        <DialogHeader><DialogTitle className="text-red-600">Delete Permanently</DialogTitle></DialogHeader>
        <DialogDescription className="text-gray-600 font-medium">Are you sure? This will remove all associated progress.</DialogDescription>
        <DialogFooter><Button variant="destructive" onClick={handleDelete}>Confirm Delete</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}
