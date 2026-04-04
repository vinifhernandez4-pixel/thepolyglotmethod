import { useState, useEffect } from 'react';
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
  Save, Check, Upload, ArrowUpDown, Lock as LockIcon
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
  const [showUnitOrderDialog, setShowUnitOrderDialog] = useState(false);

  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [selectedUnitForSession, setSelectedUnitForSession] = useState<Unit | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string; extra?: string } | null>(null);

  const [languageName, setLanguageName] = useState('');
  const [bookName, setBookName] = useState('');
  const [bookLanguageId, setBookLanguageId] = useState('');
  const [unitName, setUnitName] = useState('');
  const [unitBookId, setUnitBookId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupBookId, setGroupBookId] = useState('');
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

  const resetSessionForm = () => {
    setSessionName(''); setSessionEmoji(''); setSessionHtml(''); setSessionAnki('');
    setEditingSession(null);
  };

  const handleSaveLanguage = async () => {
    if (editingLanguage) await Database.updateLanguage(editingLanguage.id, { name: languageName });
    else await Database.createLanguage({ name: languageName, nameEn: languageName, avatar: '' });
    setShowLanguageDialog(false); loadData();
  };

  const handleSaveBook = async () => {
    if (editingBook) await Database.updateBook(editingBook.id, { name: bookName, languageId: bookLanguageId });
    else await Database.createBook({ name: bookName, languageId: bookLanguageId, avatar: '', order: books.length + 1 });
    setShowBookDialog(false); loadData();
  };

  const handleSaveUnit = async () => {
    if (editingUnit) await Database.updateUnit(editingUnit.id, { name: unitName });
    else await Database.createUnit({ bookId: unitBookId, name: unitName, description: '', order: units.length + 1, sessions: [] });
    setShowUnitDialog(false); loadData();
  };

  const handleAddNewSession = async () => {
    if (!selectedUnitForSession) return;
    await Database.addSessionToUnit(selectedUnitForSession.id, { name: sessionName, emoji: sessionEmoji, htmlContent: sessionHtml, ankiCards: [], order: selectedUnitForSession.sessions.length + 1 });
    setShowAddSessionDialog(false); resetSessionForm(); loadData();
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
    // CORREÇÃO: Aspas duplas nas chaves garantem o salvamento no Supabase
    await Database.updateSession(editingSession.id, { "name": sessionName, "emoji": sessionEmoji, "htmlContent": sessionHtml, "ankiCards": ankiCards });
    setEditingSession(null); resetSessionForm(); loadData();
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

  const openEditSession = (unit: Unit, session: Session) => {
    setSelectedUnitForSession(unit); setEditingSession(session); setSessionName(session.name); setSessionEmoji(session.emoji);
    setSessionHtml(session.htmlContent); setSessionAnki(JSON.stringify(session.ankiCards, null, 2));
    setShowSessionDialog(false);
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1a3673] text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Administration</h1>
        <Button variant="outline" onClick={onLogout} className="text-white border-white">Logout</Button>
      </header>

      <main className="p-4 max-w-6xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 grid grid-cols-5">
            <TabsTrigger value="languages"><Globe className="w-4 h-4 mr-2"/>Languages</TabsTrigger>
            <TabsTrigger value="books"><BookOpen className="w-4 h-4 mr-2"/>Books</TabsTrigger>
            <TabsTrigger value="units"><Layers className="w-4 h-4 mr-2"/>Units</TabsTrigger>
            <TabsTrigger value="groups"><Users className="w-4 h-4 mr-2"/>Groups</TabsTrigger>
            <TabsTrigger value="students"><GraduationCap className="w-4 h-4 mr-2"/>Students</TabsTrigger>
          </TabsList>

          {/* LANGUAGES */}
          <TabsContent value="languages">
            <Button onClick={() => { setEditingLanguage(null); setLanguageName(''); setShowLanguageDialog(true); }} className="mb-4"><Plus className="mr-2" />Add Language</Button>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {languages.map(l => (
                <Card key={l.id}><CardContent className="p-4 flex justify-between items-center">
                  <span>{l.name}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditingLanguage(l); setLanguageName(l.name); setShowLanguageDialog(true); }}><Edit2 className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => { setItemToDelete({ type: 'language', id: l.id }); setShowDeleteConfirm(true); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          </TabsContent>

          {/* GROUPS */}
          <TabsContent value="groups">
            <Button onClick={() => { setEditingGroup(null); setGroupName(''); setShowGroupDialog(true); }} className="mb-4"><Plus className="mr-2" />Add Group</Button>
            <div className="grid gap-4">
              {groups.map(g => {
                const groupStudents = students.filter(s => g.studentIds.includes(s.id));
                const groupUnits = units.filter(u => u.bookId === g.bookId);
                return (
                  <Card key={g.id}><CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div><h3 className="text-lg font-bold">{g.name}</h3><p className="text-sm text-gray-500">{groupStudents.length} Students</p></div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setEditingGroup(g); setGroupName(g.name); setGroupBookId(g.bookId); setShowGroupDialog(true); }}><Edit2 className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => { setItemToDelete({ type: 'group', id: g.id }); setShowDeleteConfirm(true); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2"><Label>Access Control</Label><Button size="sm" variant="ghost" onClick={() => { setEditingGroup(g); setShowUnitOrderDialog(true); }}><ArrowUpDown className="w-3 h-3 mr-1"/>Order</Button></div>
                      <div className="flex flex-wrap gap-2">
                        {groupUnits.map(u => (
                          <Button key={u.id} size="sm" variant={g.unlockedUnitIds.includes(u.id) ? "default" : "outline"} onClick={() => g.unlockedUnitIds.includes(u.id) ? Database.lockUnitForGroup(g.id, u.id).then(loadData) : Database.unlockUnitForGroup(g.id, u.id).then(loadData)}>
                            {g.unlockedUnitIds.includes(u.id) ? <Check className="w-3 h-3 mr-1" /> : <LockIcon className="w-3 h-3 mr-1" />} {u.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="border-t pt-4 mt-4 flex justify-between items-center">
                      <Label>Students</Label><Button size="sm" onClick={() => { setEditingGroup(g); setShowAddStudentDialog(true); }}><Plus className="w-3 h-3 mr-1" />Add Student</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {groupStudents.map(s => <Badge key={s.id} variant="secondary">{s.name} <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => Database.removeStudentFromGroup(g.id, s.id).then(loadData)} /></Badge>)}
                    </div>
                  </CardContent></Card>
                );
              })}
            </div>
          </TabsContent>

          {/* BOOKS, UNITS & STUDENTS */}
          <TabsContent value="books">
            <Button onClick={() => { setEditingBook(null); setBookName(''); setShowBookDialog(true); }} className="mb-4">Add Book</Button>
            {books.map(b => <div key={b.id} className="p-3 bg-white border rounded mb-2 flex justify-between items-center"><span>{b.name}</span><Trash2 className="w-4 h-4 text-red-500 cursor-pointer" onClick={() => { setItemToDelete({type:'book', id:b.id}); setShowDeleteConfirm(true); }} /></div>)}
          </TabsContent>
          <TabsContent value="units">
            <Button onClick={() => { setEditingUnit(null); setUnitName(''); setShowUnitDialog(true); }} className="mb-4">Add Unit</Button>
            {units.map(u => <div key={u.id} className="p-3 bg-white border rounded mb-2 flex justify-between items-center"><span>{u.name}</span><div className="flex gap-2"><Eye className="w-4 h-4 cursor-pointer text-blue-500" onClick={() => { setSelectedUnitForSession(u); setShowSessionDialog(true); }} /><Trash2 className="w-4 h-4 text-red-500 cursor-pointer" onClick={() => { setItemToDelete({type:'unit', id:u.id}); setShowDeleteConfirm(true); }} /></div></div>)}
          </TabsContent>
          <TabsContent value="students">
            {students.map(s => <div key={s.id} className="p-3 bg-white border rounded mb-2 flex justify-between items-center"><div><p className="font-bold">{s.name}</p><p className="text-xs text-gray-500">{s.email}</p></div><Trash2 className="w-4 h-4 text-red-500 cursor-pointer" onClick={() => { setItemToDelete({type:'user', id:s.id}); setShowDeleteConfirm(true); }} /></div>)}
          </TabsContent>
        </Tabs>
      </main>

      {/* DIALOGS */}
      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}><DialogContent><DialogHeader><DialogTitle>Language</DialogTitle></DialogHeader><Input value={languageName} onChange={e => setLanguageName(e.target.value)} placeholder="Name" /><DialogFooter><Button onClick={handleSaveLanguage}>Save</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}><DialogContent><DialogHeader><DialogTitle>Book</DialogTitle></DialogHeader><Input value={bookName} onChange={e => setBookName(e.target.value)} placeholder="Book Name" /><Select value={bookLanguageId} onValueChange={setBookLanguageId}><SelectTrigger><SelectValue placeholder="Lang" /></SelectTrigger><SelectContent>{languages.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select><DialogFooter><Button onClick={handleSaveBook}>Save</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={showUnitDialog} onOpenChange={setShowUnitDialog}><DialogContent><DialogHeader><DialogTitle>Unit</DialogTitle></DialogHeader><Input value={unitName} onChange={e => setUnitName(e.target.value)} placeholder="Unit Name" /><Select value={unitBookId} onValueChange={setUnitBookId}><SelectTrigger><SelectValue placeholder="Book" /></SelectTrigger><SelectContent>{books.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select><DialogFooter><Button onClick={handleSaveUnit}>Save</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}><DialogContent><DialogHeader><DialogTitle>Group</DialogTitle></DialogHeader><Input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group Name" /><Select value={groupBookId} onValueChange={setGroupBookId}><SelectTrigger><SelectValue placeholder="Book" /></SelectTrigger><SelectContent>{books.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select><DialogFooter><Button onClick={handleSaveGroup}>Save</Button></DialogFooter></DialogContent></Dialog>
      
      <Dialog open={showAddStudentDialog} onOpenChange={setShowAddStudentDialog}>
        <DialogContent><DialogHeader><DialogTitle>Add Student</DialogTitle></DialogHeader>
          <ScrollArea className="h-60">
            {students.filter(s => !editingGroup?.studentIds.includes(s.id)).map(s => (
              <div key={s.id} className="p-2 border-b cursor-pointer hover:bg-gray-100 flex justify-between items-center" onClick={() => Database.addStudentToGroup(editingGroup!.id, s.id).then(loadData)}>
                <span>{s.name}</span><Plus className="w-4 h-4"/>
              </div>
            ))}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle className="flex justify-between items-center">Sessions <Button size="sm" onClick={() => setShowAddSessionDialog(true)}><Plus className="w-4 h-4 mr-1"/>Add</Button></DialogTitle></DialogHeader>
          <ScrollArea className="h-80">
            {selectedUnitForSession?.sessions.map(s => (
              <div key={s.id} className="p-3 border-b flex justify-between items-center">
                <span>{s.emoji} {s.name}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditSession(selectedUnitForSession!, s)}><Edit2 className="w-3 h-3"/></Button>
                  <Button size="sm" variant="outline" onClick={() => {setItemToDelete({type:'session', id:s.id}); setShowDeleteConfirm(true);}}><Trash2 className="w-3 h-3"/></Button>
                </div>
              </div>
            ))}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddSessionDialog} onOpenChange={setShowAddSessionDialog}><DialogContent><DialogHeader><DialogTitle>Add Session</DialogTitle></DialogHeader>
        <Input value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder="Name" />
        <div className="flex flex-wrap gap-2">{EMOJI_OPTIONS.map(e => <button key={e} onClick={() => setSessionEmoji(e)} className={`p-2 rounded ${sessionEmoji === e ? 'bg-blue-100 ring-1' : ''}`}>{e}</button>)}</div>
        <DialogFooter><Button onClick={handleAddNewSession}>Add</Button></DialogFooter>
      </DialogContent></Dialog>

      <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
        <DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Edit Session</DialogTitle></DialogHeader>
          <Input value={sessionName} onChange={e => setSessionName(e.target.value)} className="mb-2" />
          <Textarea className="h-60 font-mono text-xs" value={sessionHtml} onChange={e => setSessionHtml(e.target.value)} placeholder="HTML Content" />
          <Textarea className="h-32 font-mono text-xs" value={sessionAnki} onChange={e => setSessionAnki(e.target.value)} placeholder="Anki cards JSON or front|back" />
          <DialogFooter><Button onClick={handleSaveSession}><Save className="mr-2 w-4 h-4"/>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}><DialogContent><DialogHeader><DialogTitle>Confirm Delete</DialogTitle></DialogHeader><DialogDescription>This cannot be undone.</DialogDescription><DialogFooter><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
