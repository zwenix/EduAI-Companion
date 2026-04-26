import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Edit2, Trash2, Mail, GraduationCap, X, BookOpen } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

interface Student {
  id: string;
  name: string;
  grade: string;
  email: string;
  status: 'Active' | 'Inactive';
  teacherId: string;
}

interface ClassModel {
  id: string;
  name: string;
  subject: string;
  teacherId: string;
}

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  members: string[]; // array of student ids
}

export default function ClassManagement() {
  const [activeTab, setActiveTab] = useState<'learners' | 'classes' | 'study_groups'>('learners');
  
  // Data
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddingLearner, setIsAddingLearner] = useState(false);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  // Forms
  const [learnerForm, setLearnerForm] = useState({ name: '', grade: '', email: '', status: 'Active' as const });
  const [classForm, setClassForm] = useState({ name: '', subject: '' });
  const [groupForm, setGroupForm] = useState({ name: '', description: '', selectedMembers: [] as string[] });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setIsLoading(false);
      return;
    }

    const qStudents = query(collection(db, 'students'), where('teacherId', '==', user.uid));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });

    const qClasses = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
    const unsubClasses = onSnapshot(qClasses, (snapshot) => {
      setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassModel)));
    });

    const qGroups = query(collection(db, 'study_groups'), where('teacherId', '==', user.uid));
    const unsubGroups = onSnapshot(qGroups, (snapshot) => {
      setStudyGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyGroup)));
      setIsLoading(false);
    });

    return () => { unsubStudents(); unsubClasses(); unsubGroups(); };
  }, []);

  const handleCreateLearner = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert('Please sign in first');
    
    const id = Date.now().toString();
    try {
      await setDoc(doc(db, 'students', id), {
        ...learnerForm,
        teacherId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setIsAddingLearner(false);
      setLearnerForm({ name: '', grade: '', email: '', status: 'Active' });
      
      // Notification
      await setDoc(doc(db, 'notifications', id), {
        title: 'Learner Added',
        message: `Learner ${learnerForm.name} was successfully added.`,
        read: false,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch (err: any) { alert(err.message); }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    
    const id = Date.now().toString();
    try {
      await setDoc(doc(db, 'classes', id), {
        ...classForm,
        teacherId: user.uid,
        createdAt: serverTimestamp(),
      });
      setIsAddingClass(false);
      setClassForm({ name: '', subject: '' });

      // Notification
      await setDoc(doc(db, 'notifications', id), {
        title: 'Class Created',
        message: `Class ${classForm.name} was created successfully.`,
        read: false,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch (err: any) { alert(err.message); }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    
    const id = Date.now().toString();
    try {
      await setDoc(doc(db, 'study_groups', id), {
        name: groupForm.name,
        description: groupForm.description,
        members: groupForm.selectedMembers,
        teacherId: user.uid,
        createdAt: serverTimestamp(),
      });
      setIsAddingGroup(false);
      setGroupForm({ name: '', description: '', selectedMembers: [] });

      // Notification
      await setDoc(doc(db, 'notifications', id), {
        title: 'Study Group Created',
        message: `Study group ${groupForm.name} created with ${groupForm.selectedMembers.length} members.`,
        read: false,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if(confirm('Are you sure you want to remove this learner?')) {
      try { 
        await deleteDoc(doc(db, 'students', id)); 
        await setDoc(doc(db, 'notifications', Date.now().toString()), {
          title: 'Learner Removed',
          message: `Learner ${name} was removed.`,
          read: false,
          userId: auth.currentUser?.uid,
          createdAt: serverTimestamp(),
        });
      } catch (err: any) { alert(err.message); }
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if(confirm('Delete class?')) {
      try { 
        await deleteDoc(doc(db, 'classes', id));
        await setDoc(doc(db, 'notifications', Date.now().toString()), {
          title: 'Class Removed',
          message: `Class ${name} was removed.`,
          read: false,
          userId: auth.currentUser?.uid,
          createdAt: serverTimestamp(),
        });
       } catch (err: any) { alert(err.message); }
    }
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if(confirm('Delete study group?')) {
      try { 
        await deleteDoc(doc(db, 'study_groups', id)); 
        await setDoc(doc(db, 'notifications', Date.now().toString()), {
          title: 'Study Group Removed',
          message: `Study group ${name} was removed.`,
          read: false,
          userId: auth.currentUser?.uid,
          createdAt: serverTimestamp(),
        });
      } catch (err: any) { alert(err.message); }
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === 'All' || s.grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Users className="text-brand-cyan" />
            Class & Student Management
          </h2>
          <p className="text-slate-500 text-sm mt-1">Manage classes, learners, and study groups.</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto">
        {['learners', 'classes', 'study_groups'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-3 px-6 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab ? 'border-brand-cyan text-brand-cyan' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'learners' ? 'My Learners' : tab === 'classes' ? 'My Classes' : 'Study Groups'}
          </button>
        ))}
      </div>

      {activeTab === 'learners' && (
        <div className="space-y-6 animate-fadeInZoom">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Learner Roster</h3>
            <button onClick={() => setIsAddingLearner(true)} className="bg-brand-cyan hover:bg-cyan-500 text-slate-900 px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-sm">
              <Plus size={18} /> Add Learner
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search learners..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 focus:border-brand-cyan"
              />
            </div>
            <div className="relative">
              <select
                value={selectedGrade}
                onChange={e => setSelectedGrade(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 focus:border-brand-cyan appearance-none"
              >
                <option value="All">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest">Learner Name</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest">Class</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest">Email</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                            {student.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-800">{student.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">{student.grade}</td>
                      <td className="py-4 px-6 text-sm text-slate-600">{student.email}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${student.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleDeleteStudent(student.id, student.name)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Remove">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500 text-sm">No learners found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'classes' && (
        <div className="space-y-6 animate-fadeInZoom">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">My Classes</h3>
            <button onClick={() => setIsAddingClass(true)} className="bg-brand-cyan hover:bg-cyan-500 text-slate-900 px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-sm">
              <Plus size={18} /> Create Class
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => {
              const enrolled = students.filter(s => s.grade === cls.name).length;
              return (
                <div key={cls.id} className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 text-brand-cyan flex justify-center items-center">
                      <GraduationCap size={24} />
                    </div>
                    <button onClick={() => handleDeleteClass(cls.id, cls.name)} className="p-2 text-slate-400 hover:text-rose-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg mb-1">{cls.name}</h4>
                  <p className="text-slate-500 text-sm mb-4">{cls.subject}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                    <Users size={16} className="text-slate-400" />
                    <span>{enrolled} Enrolled</span>
                  </div>
                </div>
              );
            })}
            {classes.length === 0 && (
              <p className="text-slate-500 col-span-3">No classes created yet. Create one to get started.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'study_groups' && (
        <div className="space-y-6 animate-fadeInZoom">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Study Groups</h3>
            <button onClick={() => setIsAddingGroup(true)} className="bg-emerald-400 hover:bg-emerald-500 text-slate-900 px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-sm">
              <Plus size={18} /> Create Group
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studyGroups.map((group) => (
              <div key={group.id} className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex justify-center items-center">
                    <BookOpen size={24} />
                  </div>
                  <button onClick={() => handleDeleteGroup(group.id, group.name)} className="p-2 text-slate-400 hover:text-rose-500">
                    <Trash2 size={16} />
                  </button>
                </div>
                <h4 className="font-bold text-slate-800 text-lg mb-1">{group.name}</h4>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{group.description || 'No description'}</p>
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                  <Users size={16} className="text-slate-400" />
                  <span>{group.members.length} Members</span>
                </div>
              </div>
            ))}
            {studyGroups.length === 0 && (
              <p className="text-slate-500 col-span-3">No study groups. Create one to assign materials directly to groups.</p>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {isAddingLearner && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Add Learner</h3>
              <button type="button" onClick={() => setIsAddingLearner(false)}><X className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateLearner} className="space-y-4">
              <div><label className="block text-sm font-semibold mb-1">Name</label><input required className="w-full border rounded-xl p-3" value={learnerForm.name} onChange={e => setLearnerForm({...learnerForm, name: e.target.value})} /></div>
              <div><label className="block text-sm font-semibold mb-1">Email</label><input type="email" required className="w-full border rounded-xl p-3" value={learnerForm.email} onChange={e => setLearnerForm({...learnerForm, email: e.target.value})} /></div>
              <div><label className="block text-sm font-semibold mb-1">Class</label>
                <select required className="w-full border rounded-xl p-3 bg-white" value={learnerForm.grade} onChange={e => setLearnerForm({...learnerForm, grade: e.target.value})}>
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                {classes.length === 0 && <p className="text-xs text-rose-500 mt-1">Please create a class first.</p>}
              </div>
              <button type="submit" className="w-full bg-brand-cyan text-slate-900 font-bold py-3 rounded-xl mt-4">Save Learner</button>
            </form>
          </div>
        </div>
      )}

      {isAddingClass && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Create Class</h3>
              <button type="button" onClick={() => setIsAddingClass(false)}><X className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div><label className="block text-sm font-semibold mb-1">Class Name</label><input required className="w-full border rounded-xl p-3" placeholder="e.g. Grade 10A" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} /></div>
              <div><label className="block text-sm font-semibold mb-1">Subject</label><input required className="w-full border rounded-xl p-3" placeholder="e.g. Mathematics" value={classForm.subject} onChange={e => setClassForm({...classForm, subject: e.target.value})} /></div>
              <button type="submit" className="w-full bg-brand-cyan text-slate-900 font-bold py-3 rounded-xl mt-4">Create Class</button>
            </form>
          </div>
        </div>
      )}

      {isAddingGroup && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Create Study Group</h3>
              <button type="button" onClick={() => setIsAddingGroup(false)}><X className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div><label className="block text-sm font-semibold mb-1">Group Name</label><input required className="w-full border rounded-xl p-3" placeholder="e.g. Math Olympiad Prep" value={groupForm.name} onChange={e => setGroupForm({...groupForm, name: e.target.value})} /></div>
              <div><label className="block text-sm font-semibold mb-1">Description</label><input className="w-full border rounded-xl p-3" value={groupForm.description} onChange={e => setGroupForm({...groupForm, description: e.target.value})} /></div>
              <div>
                <label className="block text-sm font-semibold mb-1">Select Members</label>
                <div className="border rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
                  {students.map(s => (
                    <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded text-emerald-500"
                        checked={groupForm.selectedMembers.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) setGroupForm(prev => ({...prev, selectedMembers: [...prev.selectedMembers, s.id]}));
                          else setGroupForm(prev => ({...prev, selectedMembers: prev.selectedMembers.filter(id => id !== s.id)}));
                        }}
                      />
                      {s.name} ({s.grade})
                    </label>
                  ))}
                  {students.length === 0 && <p className="text-slate-500 text-sm">Add learners first to select them.</p>}
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-400 text-slate-900 font-bold py-3 rounded-xl mt-4">Create Group</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
