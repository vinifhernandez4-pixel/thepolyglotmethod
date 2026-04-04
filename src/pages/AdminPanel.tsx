import { useState, useEffect } from 'react';
import Database from '@/lib/database';
import type { Language, Book, Unit, Group, User, Session } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Edit2, Trash2, Globe, BookOpen, Layers, GraduationCap, Users, Eye, X, Check, Lock as LockIcon 
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdminPanelProps {
  onLogout: () => void;
}

const EMOJI_OPTIONS = ['👀', '📝', '📚', '🎧', '🎮', '🎯', '💡', '🔤', '🗣️', '👂', '✍️', '📖', '🎬', '🎵', '🧩', '🏆'];

export default function AdminPanel({ onLogout }: AdminPanelProps) {
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

  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [selectedUnitForSession, setSelectedUnitForSession] = useState<Unit | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string } | null>(null);

  const [languageName, setLanguageName] = useState('');
  const [languageNameEn, setLanguageNameEn] = useState('');
  const [languageAvatar, setLanguageAvatar] = useState('');
  const [bookName, setBookName] = useState('');
  const [bookLanguageId, setBookLanguageId] = useState('');
  const [bookAvatar, setBookAvatar] = useState('');
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

  const handleSaveLanguage = async () => {
    const p = { name: languageName, nameEn: languageNameEn, avatar: languageAvatar };
    if (editingLanguage) await Database.updateLanguage(editingLanguage.id, p);
    else await Database.createLanguage(p);
    setShowLanguageDialog(false); loadData();
  };

  const handleSaveBook = async () => {
    const p = { name: bookName, languageId: bookLanguageId, avatar: bookAvatar, order: books.length + 1 };
    if (editingBook) await Database.updateBook(editingBook.id, { name: bookName, languageId: bookLanguageId, avatar: bookAvatar });
    else await Database.createBook(p);
    setShowBookDialog(false); loadData();
  };

  const handleSaveUnit = async () => {
    if (editingUnit) await Database.updateUnit(editingUnit.id, { name: unitName });
    else {
      const newUnit = await Database.createUnit({ bookId: unitBookId, name: unitName, order: units.length + 1, sessions: [] });
      const defs = [{ n: 'Preview', e: '👀' }, { n: 'Review', e: '📝' }, { n: 'Grammar', e: '📚' }, { n: 'Audio', e: '🎧' }];
      for (let i = 0; i < defs.length; i++) {
        await Database.addSessionToUnit(newUnit.id, { name: defs[i].n, emoji: defs[i].e, order: i + 1, htmlContent: '', ankiCards: [] });
      }
    }
    setShowUnitDialog(false); loadData();
  };

  const handleAddNewSession = async () => {
    if (!selectedUnitForSession) return;
    await Database.addSessionToUnit(selectedUnitForSession.id, { name: sessionName, emoji: sessionEmoji, htmlContent: sessionHtml, ankiCards: [], order: selectedUnitForSession.sessions.length + 1 });
    setShowAddSessionDialog(false); loadData();
  };

  const handleSaveSession = async () => {
    if (!editingSession) return;
    let cards = [];
    try { if (sessionAnki.trim()) cards = JSON.parse(sessionAnki); } catch (e) {
      cards = sessionAnki.trim().split('\n').map((l, i) => {
        const p = l.split('|');
        return { id: `c-${i}`, front: p[0]?.trim() || '', back: p[1]?.trim() || '', pronunciation: p[2]?.trim(), example: p[3]?.trim() };
      }).filter(c => c.front && c.back);
    }
    await Database.updateSession(editingSession.id, { "name": sessionName, "emoji": sessionEmoji, "htmlContent": sessionHtml, "ankiCards": cards });
    setEditingSession(null); loadData();
  };

  const handleSaveGroup = async () => {
    const p = { name: groupName, bookId: groupBookId, languageId: '', studentIds: [], unlockedUnitIds: [] };
    if (editingGroup) await Database.updateGroup(editingGroup.id, { name: groupName, bookId: groupBookId });
    else await Database.createGroup(p);
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
    setShowDeleteConfirm(false); setItemToDelete(null); loadData();
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center text-gray-900 bg-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-[#1a3673] text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2"><Globe className="w-6 h-6"/> <h1 className="text-xl font-bold">Polyglot Admin</h1></div>
        <Button variant="outline" onClick={onLogout} className="text-white border-white hover:bg-white/10">Logout</Button>
      </header>

      <main className="p-4 max-w-6xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 grid grid-cols-5 bg-white border">
            <TabsTrigger value="languages" className="text-gray-700">Langs</TabsTrigger>
            <TabsTrigger value="books" className="text-gray-700">Books</TabsTrigger>
            <TabsTrigger value="units" className="text-gray-700">Units</TabsTrigger>
            <TabsTrigger value="groups" className="text-gray-700">Groups</TabsTrigger>
            <TabsTrigger value="students" className="text-gray-700">Students</TabsTrigger>
          </TabsList>

          <TabsContent value="languages">
            <Button onClick={() => { setEditingLanguage(null); setLanguageName(''); setLanguageNameEn(''); setLanguageAvatar(''); setShowLanguageDialog(true); }} className="mb-4 bg-[#1a3673] text-white"><Plus className="mr-2" />Add</Button>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {languages.map(l => (
                <Card key={l.id} className="bg-white border-gray-200 shadow-sm"><CardContent className="p-4 flex justify-between items-center text-gray-800">
                  <div className="flex items-center gap-2">{l.avatar && <img src={l.avatar} className="w-8 h-8 rounded-full border border-gray-200" />}<span>{l.name}</span></div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="text-gray-600" onClick={() => { setEditingLanguage(l); setLanguageName(l.name); setLanguageNameEn(l.nameEn || ''); setLanguageAvatar(l.avatar || ''); setShowLanguageDialog(true); }}><Edit2 className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => { setItemToDelete({ type: 'language', id: l.id }); setShowDeleteConfirm(true); }}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="groups">
            <Button onClick={() => { setEditingGroup(null); setGroupName(''); setGroupBookId(''); setShowGroupDialog(true); }} className="mb-4 bg-[#1a3673] text-white"><Plus className="mr-2" />Add Group</Button>
            <div className="grid gap-4">
              {groups.map(g => (
                <Card key={g.id} className="bg-white border-gray-200"><CardContent className="p-4">
                  <div className="flex justify-between border-b pb-4 mb-4">
                    <div className="flex items-center gap-2"><Users className="w-5 h-5 text-[#1a3673]"/><h3 className="font-bold text-[#1a3673] text-lg">{g.name}</h3></div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditingGroup(g); setGroupName(g.name); setGroupBookId(g.bookId); setShowGroupDialog(true); }}><Edit2 className="w-4 h-4"/></Button>
                      <Button size="sm" variant="outline" className="text-red-500" onClick={() => { setItemToDelete({ type: 'group', id: g.id }); setShowDeleteConfirm(true); }}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <div className="mb-4 text-gray-700">
                    <Label className="font-bold mb-2 block text-xs uppercase tracking-wider">Access</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {units.filter(u => u.bookId === g.bookId).map(u => {
                        const isUnlocked = g.unlockedUnitIds.includes(u.id);
                        return (
                          <Button key={u.id} size="sm" variant={isUnlocked ? "default" : "outline"} className={isUnlocked ? "bg-emerald-600 text-white" : "text-gray-500 border-gray-200"} onClick={() => isUnlocked ? Database.lockUnitForGroup(g.id, u.id).then(loadData) : Database.unlockUnitForGroup(g.id, u.id).then(loadData)}>
                            {isUnlocked ? <Check className="w-3 h-3 mr-1" /> : <LockIcon className="w-3 h-3 mr-1" />} {u.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="border-t pt-4 flex justify-between items-center text-gray-700">
                    <Label className="font-bold text-xs uppercase tracking-wider">Students</Label>
                    <Button size="sm" variant="ghost" className="text-[#1a3673]" onClick={() => { setEditingGroup(g); setShowAddStudentDialog(true); }}><Plus className="w-3 h-3 mr-1" />Add Student</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {students.filter(s => g.studentIds.includes(s.id)).map(s => <Badge key={s.id} variant="secondary" className="bg-gray-100 text-gray-700">{s.name} <X className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500" onClick={() => Database.removeStudentFromGroup(g.id, s.id).then(loadData)} /></Badge>)}
                  </div>
                </CardContent></Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="books">
            <Button onClick={() => { setBookName(''); setBookLanguageId(''); setBookAvatar(''); setEditingBook(null); setShowBookDialog(true); }} className="mb-4 bg-[#1a3673] text-white">Add Book</Button>
            {books.map(b => (
              <Card key={b.id} className="mb-2 bg-white"><CardContent className="p-3 flex justify-between items-center text-gray-800">
                <div className="flex items-center gap-3">{b.avatar && <img src={b.avatar} className="w-8 h-10 object-cover rounded border"/>} <span>{b.name}</span></div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setEditingBook(b); setBookName(b.name); setBookLanguageId(b.languageId); setBookAvatar(b.avatar); setShowBookDialog(true); }}><Edit2 className="w-4 h-4"/></Button>
                  <Trash2 className="w-4 h-4 text-red-500 cursor-pointer" onClick={() => { setItemToDelete({type:'book', id:b.id}); setShowDeleteConfirm(true); }} />
                </div>
              </CardContent></Card>
            ))}
          </TabsContent>

          <TabsContent value="units">
            <Button onClick={() => { setUnitName(''); setUnitBookId(''); setEditingUnit(null); setShowUnitDialog(true); }} className="mb-4 bg-[#1a3673] text-white">Add Unit</Button>
            {languages.map(lang => (
              <div key={lang.id} className="mb-8">
                <CardHeader className="p-0 border-b mb-4"><CardTitle className="text-lg font-bold text-[#1a3673] flex items-center gap-2 pb-2"><Globe className="w-5 h-5"/>{lang.name}</CardTitle></CardHeader>
                {books.filter(b => b.languageId === lang.id).map(book => (
                  <div key={book.id} className="ml-4 mb-6">
                    <h3 className="font-bold text-gray-600 mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4"/>{book.name}</h3>
                    <div className="grid gap-2">
                      {units.filter(u => u.bookId === book.id).sort((a,b)=>a.order-b.order).map(u => (
                        <div key={u.id} className="p-3 bg-white rounded border border-gray-200 flex justify-between items-center text-gray-800 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-gray-400"/><span>{u.name}</span></div>
                          <div className="flex gap-3">
                            <Eye className="w-5 h-5 text-emerald-600 cursor-pointer" onClick={() => { setSelectedUnitForSession(u); setShowSessionDialog(true); }} />
                            <Edit2 className="w-5 h-5 text-gray-400 cursor-pointer" onClick={() => { setEditingUnit(u); setUnitName(u.name); setUnitBookId(u.bookId); setShowUnitDialog(true); }} />
                            <Trash2 className="w-5 h-5 text-red-500 cursor-pointer" onClick={() => { setItemToDelete({type:'unit', id:u.id}); setShowDeleteConfirm(true); }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="students">
            {students.map(s => <Card key={s.id} className="bg-white mb-2"><CardContent className="p-3 flex justify-between items-center text-gray-800">
              <div className="flex items-center gap-3"><GraduationCap className="w-5 h-5 text-gray-400"/><div><p className="font-bold">{s.name}</p><p className="text-xs text-gray-500">{s.email}</p></div></div>
              <Trash2 className="w-4 h-4 text-red-500 cursor-pointer" onClick={() => {setItemToDelete({type:'user', id:s.id}); setShowDeleteConfirm(true);}} />
            </CardContent></Card>)}
          </TabsContent>
        </Tabs>
      </main>

      {/* DIALOGS */}
      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader><DialogTitle className="text-[#1a3673]">Language Settings</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Native Name</Label><Input value={languageName} onChange={e => setLanguageName(e.target.value)} className="text-gray-900" /></div>
            <div><Label>English Name</Label><Input value={languageNameEn} onChange={e => setLanguageNameEn(e.target.value)} className="text-gray-900" /></div>
            <div><Label>Avatar URL</Label><Input value={languageAvatar} onChange={e => setLanguageAvatar(e.target.value)} className="text-gray-900" /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveLanguage} className="bg-[#1a3673] text-white w-full">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader><DialogTitle className="text-[#1a3673]">Book Details</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={bookName} onChange={e => setBookName(e.target.value)} className="text-gray-900" /></div>
            <div><Label>Cover URL</Label><Input value={bookAvatar} onChange={e => setBookAvatar(e.target.value)} className="text-gray-900" /></div>
            <div><Label>Language</Label><Select value={bookLanguageId} onValueChange={setBookLanguageId}><SelectTrigger className="text-gray-900"><SelectValue placeholder="Lang"/></SelectTrigger><SelectContent className="bg-white">{languages.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button onClick={handleSaveBook} className="bg-[#1a3673] text-white w-full">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUnitDialog} onOpenChange={setShowUnitDialog}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader><DialogTitle className="text-[#1a3673]">Unit Settings</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Unit Name</Label><Input value={unitName} onChange={e => setUnitName(e.target.value)} className="text-gray-900" /></div>
            {!editingUnit && (<div><Label>Book</Label><Select value={unitBookId} onValueChange={setUnitBookId}><SelectTrigger className="text-gray-900"><SelectValue placeholder="Book"/></SelectTrigger><SelectContent className="bg-white">{books.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>)}
          </div>
          <DialogFooter><Button onClick={handleSaveUnit} className="bg-[#1a3673] text-white w-full">Save Unit</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader><DialogTitle className="text-[#1a3673]">Group Details</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Group Name</Label><Input value={groupName} onChange={e => setGroupName(e.target.value)} className="text-gray-900" /></div>
            <div><Label>Book</Label><Select value={groupBookId} onValueChange={setGroupBookId}><SelectTrigger className="text-gray-900"><SelectValue placeholder="Book"/></SelectTrigger><SelectContent className="bg-white">{books.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button onClick={handleSaveGroup} className="bg-[#1a3673] text-white w-full">Save Group</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddStudentDialog} onOpenChange={setShowAddStudentDialog}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader><DialogTitle className="text-[#1a3673]">Add Student</DialogTitle></DialogHeader>
          <ScrollArea className="h-60 mt-2 pr-4">{students.filter(s => !editingGroup?.studentIds.includes(s.id)).map(s => <div key={s.id} className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex justify-between items-center text-gray-800" onClick={() => editingGroup && Database.addStudentToGroup(editingGroup.id, s.id).then(loadData)}><span>{s.name} <span className="text-xs text-gray-400">({s.email})</span></span> <Plus className="w-4 h-4 text-[#1a3673]"/></div>)}</ScrollArea>
          <DialogFooter><Button variant="outline" onClick={() => setShowAddStudentDialog(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent className="max-w-2xl bg-white text-gray-900">
          <DialogHeader><DialogTitle className="text-[#1a3673] flex justify-between items-center">Unit Content <Button size="sm" className="bg-[#c5a059]" onClick={() => setShowAddSessionDialog(true)}>+ Add Session</Button></DialogTitle></DialogHeader>
          <ScrollArea className="h-80 mt-4 pr-4">
            {selectedUnitForSession?.sessions.sort((a,b)=>a.order-b.order).map(s => (
              <div key={s.id} className="p-3 border-b border-gray-100 flex justify-between items-center bg-white text-gray-900">
                <span className="font-semibold">{s.emoji} {s.name}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-gray-300 text-[#1a3673]" onClick={() => { setEditingSession(s); setSessionName(s.name); setSessionEmoji(s.emoji); setSessionHtml(s.htmlContent); setSessionAnki(JSON.stringify(s.ankiCards, null, 2)); setShowSessionDialog(false); }}><Edit2 className="w-3 h-3 mr-1"/>Edit</Button>
                  <Button size="sm" variant="outline" className="border-gray-300 text-red-500" onClick={() => {setItemToDelete({type:'session', id:s.id}); setShowDeleteConfirm(true);}}><Trash2 className="w-3 h-3"/></Button>
                </div>
              </div>
            ))}
          </ScrollArea>
          <DialogFooter><Button variant="outline" onClick={() => setShowSessionDialog(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddSessionDialog} onOpenChange={setShowAddSessionDialog}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader><DialogTitle className="text-[#1a3673]">Add New Session</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder="Session Name" className="text-gray-900 border-gray-300" />
            <div className="flex gap-2 flex-wrap">{EMOJI_OPTIONS.map(e => <button key={e} onClick={() => setSessionEmoji(e)} className={`p-2 rounded text-xl ${sessionEmoji === e ? 'bg-blue-100 ring-2' : ''}`}>{e}</button>)}</div>
          </div>
          <DialogFooter><Button onClick={handleAddNewSession} className="bg-[#1a3673] text-white">Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
        <DialogContent className="max-w-5xl bg-white text-gray-900 max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[#1a3673]">Edit Session</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input value={sessionName} onChange={e => setSessionName(e.target.value)} className="text-gray-900 border-gray-300" />
            <div className="flex gap-2 flex-wrap">{EMOJI_OPTIONS.map(e => <button key={e} onClick={() => setSessionEmoji(e)} className={`p-2 rounded text-xl ${sessionEmoji === e ? 'bg-blue-100 ring-2' : ''}`}>{e}</button>)}</div>
            <Textarea className="h-60 font-mono text-xs text-gray-900 border-gray-300 bg-gray-50" value={sessionHtml} onChange={e => setSessionHtml(e.target.value)} />
            <Textarea className="h-32 font-mono text-xs text-gray-900 border-gray-300 bg-gray-50" value={sessionAnki} onChange={e => setSessionAnki(e.target.value)} />
          </div>
          <DialogFooter className="mt-4"><Button onClick={handleSaveSession} className="bg-[#1a3673] text-white w-full h-12">Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader><DialogTitle className="text-red-600">Delete Permanently?</DialogTitle></DialogHeader>
          <DialogDescription className="text-gray-600">This action cannot be undone.</DialogDescription>
          <DialogFooter className="mt-4"><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
