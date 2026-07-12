import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Search, Plus, Edit2, Trash2, Mail, GraduationCap, X, 
  BookOpen, ChevronRight, Layers, PieChart, Sparkles, Check, CloudUpload, ArrowLeft
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

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

export default function ClassManagement({ isDarkMode = true }: { isDarkMode?: boolean }) {
  const [activeTab, setActiveTab] = useState<'learners' | 'classes' | 'study_groups'>('learners');
  
  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassModel | null>(null);
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [editClassForm, setEditClassForm] = useState({ name: '', subject: '' });

  // Modals
  const [isAddingLearner, setIsAddingLearner] = useState(false);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [isEditingLearner, setIsEditingLearner] = useState(false);
  const [editingLearnerId, setEditingLearnerId] = useState('');
  const [editLearnerForm, setEditLearnerForm] = useState({ name: '', grade: '', email: '', status: 'Active' as 'Active' | 'Inactive' });

  // CSV Bulk Import
  const [learnerAddMode, setLearnerAddMode] = useState<'manual' | 'csv'>('manual');
  const [csvStudents, setCsvStudents] = useState<{ name: string; email: string; grade: string }[]>([]);
  const [csvError, setCsvError] = useState('');
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Forms
  const [learnerForm, setLearnerForm] = useState({ name: '', grade: '', email: '', status: 'Active' as const });
  const [classForm, setClassForm] = useState({ name: '', subject: '' });
  const [groupForm, setGroupForm] = useState({ name: '', description: '', selectedMembers: [] as string[] });

  // Load classes, students, and groups from Firebase Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setIsLoading(false);
      return;
    }

    const qStudents = query(collection(db, 'students'), where('teacherId', '==', user.uid));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    }, (error) => console.error("Students snapshot fail:", error));

    const qClasses = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
    const unsubClasses = onSnapshot(qClasses, (snapshot) => {
      setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassModel)));
    }, (error) => console.error("Classes snapshot fail:", error));

    const qGroups = query(collection(db, 'study_groups'), where('teacherId', '==', user.uid));
    const unsubGroups = onSnapshot(qGroups, (snapshot) => {
      setStudyGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyGroup)));
      setIsLoading(false);
    }, (error) => console.error("Groups snapshot fail:", error));

    return () => { unsubStudents(); unsubClasses(); unsubGroups(); };
  }, []);

  const handleTabChange = (tab: 'learners' | 'classes' | 'study_groups') => {
    setActiveTab(tab);
    setSelectedClass(null);
  };

  // Class Actions
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

      // Create a local notification
      await setDoc(doc(db, 'notifications', id), {
        title: 'Class Created',
        message: `Class "${classForm.name}" was created successfully.`,
        read: false,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch (err: any) { 
      alert("Error creating class: " + err.message); 
    }
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    const oldName = selectedClass.name;
    const newName = editClassForm.name.trim();
    if (!newName || !editClassForm.subject.trim()) return alert("Please fill in class name and subject");

    try {
      await updateDoc(doc(db, 'classes', selectedClass.id), {
        name: newName,
        subject: editClassForm.subject.trim(),
        updatedAt: serverTimestamp()
      });

      // Update enrolled students grade string as they are linked by name
      if (oldName !== newName) {
        const enrolledStudents = students.filter(s => s.grade === oldName);
        for (const s of enrolledStudents) {
          await updateDoc(doc(db, 'students', s.id), {
            grade: newName,
            updatedAt: serverTimestamp()
          });
        }
      }

      setSelectedClass({
        ...selectedClass,
        name: newName,
        subject: editClassForm.subject.trim()
      });

      setIsEditingClass(false);
      
      await setDoc(doc(db, 'notifications', Date.now().toString()), {
        title: 'Class Updated',
        message: `Class details for ${newName} updated successfully.`,
        read: false,
        userId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      });
    } catch (err: any) {
      alert("Error updating class: " + err.message);
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if(confirm(`Are you sure you want to delete class ${name}?`)) {
      try { 
        await deleteDoc(doc(db, 'classes', id));
        await setDoc(doc(db, 'notifications', Date.now().toString()), {
          title: 'Class Removed',
          message: `Class ${name} was removed.`,
          read: false,
          userId: auth.currentUser?.uid,
          createdAt: serverTimestamp(),
        });
        if (selectedClass?.id === id) {
          setSelectedClass(null);
        }
       } catch (err: any) { alert(err.message); }
    }
  };

  // Student Actions
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
      
      await setDoc(doc(db, 'notifications', id), {
        title: 'Learner Added',
        message: `Learner ${learnerForm.name} was successfully added.`,
        read: false,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch (err: any) { alert(err.message); }
  };

  const handleEditLearner = (student: Student) => {
    setEditingLearnerId(student.id);
    setEditLearnerForm({ name: student.name, grade: student.grade, email: student.email, status: student.status });
    setIsEditingLearner(true);
  };

  const handleUpdateLearner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLearnerId) return;

    try {
      await updateDoc(doc(db, 'students', editingLearnerId), {
        name: editLearnerForm.name,
        email: editLearnerForm.email,
        grade: editLearnerForm.grade,
        status: editLearnerForm.status,
        updatedAt: serverTimestamp()
      });
      setIsEditingLearner(false);
      setEditingLearnerId('');
    } catch (err: any) {
      alert("Error updating student: " + err.message);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if(confirm(`Are you sure you want to remove learner ${name}?`)) {
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

  // Group Actions
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

      await setDoc(doc(db, 'notifications', id), {
        title: 'Study Group Created',
        message: `Study group ${groupForm.name} created with ${groupForm.selectedMembers.length} members.`,
        read: false,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if(confirm(`Delete study group ${name}?`)) {
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

  // CSV Parsing
  const handleCsvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCsvError('');
    setCsvStudents([]);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error("Could not read file contents.");
        
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 2) {
          throw new Error("CSV file must contain a header row and at least one student record.");
        }
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const nameIdx = headers.findIndex(h => h.includes('name'));
        const emailIdx = headers.findIndex(h => h.includes('email'));
        const gradeIdx = headers.findIndex(h => h.includes('class') || h.includes('grade'));
        
        if (nameIdx === -1 || emailIdx === -1) {
          throw new Error("CSV header must contain fields for 'Name' and 'Email'. (e.g., Name,Email,Class)");
        }
        
        const parsedList = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ""));
          if (cols.length < 2) continue;
          
          parsedList.push({
            name: cols[nameIdx] || '',
            email: cols[emailIdx] || '',
            grade: gradeIdx !== -1 ? cols[gradeIdx] || 'Grade 10A' : 'Grade 10A'
          });
        }
        
        if (parsedList.length === 0) {
          throw new Error("No student records parsed from the CSV.");
        }
        
        setCsvStudents(parsedList);
      } catch (err: any) {
        setCsvError(err.message || "Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
  };

  const handleBulkImportCsv = async () => {
    const user = auth.currentUser;
    if (!user) return alert('Please sign in first');
    if (csvStudents.length === 0) return;
    
    setIsImportingCsv(true);
    let successCount = 0;
    
    for (const item of csvStudents) {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
      try {
        await setDoc(doc(db, 'students', id), {
          name: item.name,
          email: item.email,
          grade: item.grade,
          status: 'Active',
          teacherId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        await setDoc(doc(db, 'notifications', id), {
          title: 'Learner Enrolled',
          message: `Learner ${item.name} enrolled via bulk CSV.`,
          read: false,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        successCount++;
      } catch (e) {
        console.error("Failed to import student CSV row", item, e);
      }
    }
    
    alert(`Successfully imported ${successCount} out of ${csvStudents.length} learners!`);
    setIsImportingCsv(false);
    setIsAddingLearner(false);
    setCsvStudents([]);
    setLearnerAddMode('manual');
  };

  // Filtering
  const filteredStudents = students.filter(s => {
    const name = s.name || '';
    const email = s.email || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === 'All' || s.grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  return (
    <div className="space-y-8 pb-10">
      {/* Premium Glassmorphic Header Banner */}
      <div className="relative rounded-[32px] p-8 lg:p-10 overflow-hidden text-white border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] bg-[#070b19]/60 backdrop-blur-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-all duration-300">
        <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-brand-cyan/15 blur-3xl pointer-events-none" />
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-brand-pink/15 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-5">
          <div className="p-4 bg-brand-cyan/10 border border-brand-cyan/25 rounded-2xl text-brand-cyan shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <Users size={36} className="icon-glow-cyan" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-brand-cyan font-black block mb-1">Administrative Center</span>
            <h2 className="text-2xl lg:text-3xl font-display font-black tracking-tight leading-none text-white text-glow-cyan">
              Class & Learner <span className="text-brand-cyan font-hand text-3xl">Management</span>
            </h2>
            <p className="text-slate-400 font-medium text-xs lg:text-sm mt-2 max-w-lg">
              Organize classes, manage learner profiles, import rosters, and structure active study groups inside a centralized DBE & CAPS-focused ecosystem.
            </p>
          </div>
        </div>

        {/* Dynamic Overview Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-3 w-full md:w-auto shrink-0 md:border-l md:border-white/10 md:pl-6">
          <div className="bg-white/[0.03] border border-white/5 p-3.5 rounded-2xl text-center min-w-[90px]">
            <span className="text-[10px] font-black tracking-wider text-slate-400 block uppercase">Learners</span>
            <span className="text-xl lg:text-2xl font-black text-brand-cyan font-mono mt-1 block">{students.length}</span>
          </div>
          <div className="bg-white/[0.03] border border-white/5 p-3.5 rounded-2xl text-center min-w-[90px]">
            <span className="text-[10px] font-black tracking-wider text-slate-400 block uppercase">Classes</span>
            <span className="text-xl lg:text-2xl font-black text-white font-mono mt-1 block">{classes.length}</span>
          </div>
          <div className="bg-white/[0.03] border border-white/5 p-3.5 rounded-2xl text-center min-w-[90px]">
            <span className="text-[10px] font-black tracking-wider text-slate-400 block uppercase">Groups</span>
            <span className="text-xl lg:text-2xl font-black text-purple-400 font-mono mt-1 block">{studyGroups.length}</span>
          </div>
        </div>
      </div>

      {/* Glassmorphic Tab Selector Navigation */}
      <div className="flex p-1.5 bg-white/[0.02] border border-white/10 rounded-2xl max-w-md">
        {(['learners', 'classes', 'study_groups'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={cn(
              "flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer text-center",
              activeTab === tab 
                ? "bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan shadow-[0_0_12px_rgba(34,211,238,0.25)]" 
                : "text-slate-400 border border-transparent hover:text-white hover:bg-white/5"
            )}
          >
            {tab === 'learners' ? 'Learners' : tab === 'classes' ? 'Classes' : 'Study Groups'}
          </button>
        ))}
      </div>

      {/* Primary Tab Content Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + (selectedClass ? `-${selectedClass.id}` : '')}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
        >
          {/* TAB 1: LEARNERS ROSTER */}
          {activeTab === 'learners' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-brand-cyan rounded-full block" />
                  Learner Roster List
                </h3>
                <button 
                  onClick={() => setIsAddingLearner(true)} 
                  className="bg-brand-cyan hover:bg-cyan-500 text-slate-950 px-6 py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus size={16} strokeWidth={3} /> Add Learner
                </button>
              </div>

              {/* Filters Panel */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white/[0.02] border border-white/10 rounded-2xl">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text"
                    placeholder="Search by learner name or email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <select
                    value={selectedGrade}
                    onChange={e => setSelectedGrade(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-cyan [&>option]:bg-[#070b19] [&>option]:text-white cursor-pointer"
                  >
                    <option value="All">All Classes</option>
                    {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Glassmorphic Table list */}
              <div className="bg-[#070b19]/40 backdrop-blur-xl rounded-[24px] shadow-2xl border border-white/10 overflow-hidden">
                {/* Desktop view */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/[0.02] border-b border-white/10">
                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Learner Name</th>
                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Enrolled Class</th>
                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</th>
                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredStudents.map(student => (
                        <tr key={student.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan font-bold flex items-center justify-center text-sm shadow-inner">
                                {(student.name || '').charAt(0) || '?'}
                              </div>
                              <span className="font-bold text-white text-sm">{student.name || 'Unnamed Learner'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-300 font-medium">{student.grade}</td>
                          <td className="py-4 px-6 text-sm text-slate-400 font-mono">{student.email}</td>
                          <td className="py-4 px-6">
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                              student.status === 'Active' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            )}>
                              ● {student.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleEditLearner(student)} 
                                className="p-2 text-slate-400 hover:text-brand-cyan hover:bg-white/5 rounded-xl transition-all cursor-pointer border border-transparent hover:border-white/5" 
                                title="Edit Profile"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button 
                                onClick={() => handleDeleteStudent(student.id, student.name)} 
                                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-xl transition-all cursor-pointer border border-transparent hover:border-white/5" 
                                title="Remove Student"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-500 text-sm font-medium">No learners found in roster.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile view */}
                <div className="block sm:hidden divide-y divide-white/5">
                  {filteredStudents.map(student => (
                    <div key={student.id} className="p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan font-bold flex items-center justify-center text-sm shrink-0">
                            {(student.name || '').charAt(0) || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white text-sm truncate">{student.name || 'Unnamed'}</p>
                            <p className="text-xs text-slate-400 truncate font-mono">{student.email}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0",
                          student.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/15 text-slate-400 border border-slate-500/20'
                        )}>
                          {student.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                        <span className="text-slate-400">Class: <strong className="text-white font-bold">{student.grade}</strong></span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEditLearner(student)} className="p-2 text-slate-400 hover:text-brand-cyan bg-white/5 rounded-lg border border-white/5"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteStudent(student.id, student.name)} className="p-2 text-slate-400 hover:text-rose-400 bg-white/5 rounded-lg border border-white/5"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredStudents.length === 0 && (
                    <div className="py-12 text-center text-slate-550 text-sm font-medium">No learners found.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY CLASSES (HUB VIEW & SINGLE VIEW) */}
          {activeTab === 'classes' && !selectedClass && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-brand-cyan rounded-full block" />
                  Syllabus Classroom Hub
                </h3>
                <button 
                  onClick={() => setIsAddingClass(true)} 
                  className="bg-brand-cyan hover:bg-cyan-500 text-slate-950 px-6 py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus size={16} strokeWidth={3} /> Create Class
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls) => {
                  const enrolled = students.filter(s => s.grade === cls.name).length;
                  return (
                    <div 
                      key={cls.id} 
                      onClick={() => setSelectedClass(cls)}
                      className="bg-white/[0.02] hover:bg-white/[0.04] rounded-[24px] p-6 border border-white/10 hover:border-brand-cyan/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all duration-300 cursor-pointer group text-left relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-transparent to-brand-cyan/5 rounded-bl-[100px] pointer-events-none" />
                      
                      <div className="flex justify-between items-start mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 text-brand-cyan flex justify-center items-center group-hover:bg-brand-cyan group-hover:text-slate-950 group-hover:scale-105 transition-all duration-300 border border-brand-cyan/20">
                          <GraduationCap size={22} className="icon-glow-cyan" />
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClass(cls.id, cls.name);
                          }} 
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-white/5 rounded-xl transition-colors cursor-pointer border border-transparent"
                          title="Delete Class"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <h4 className="font-bold text-white text-lg mb-1 group-hover:text-brand-cyan transition-colors truncate">{cls.name}</h4>
                      <p className="text-slate-400 text-xs mb-5 font-semibold tracking-wider uppercase">{cls.subject}</p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 font-semibold">
                          <Users size={14} className="text-brand-cyan" />
                          <span>{enrolled} Enrolled</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-brand-cyan transition-colors flex items-center gap-1">
                          Manage <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  );
                })}
                {classes.length === 0 && (
                  <div className="col-span-full py-12 text-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.01]">
                    <GraduationCap size={44} className="mx-auto text-slate-600 mb-3" />
                    <h4 className="text-lg font-bold text-white mb-1">No Classes Registered Yet</h4>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto mb-5">Create educational syllabus classes to assign learner portfolios and run SBA tracking reports.</p>
                    <button 
                      onClick={() => setIsAddingClass(true)}
                      className="bg-brand-cyan/15 hover:bg-brand-cyan/25 border border-brand-cyan/35 text-brand-cyan px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                      Initialize Class
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2-B: DETAILED VIEW OF SPECIFIC CLASS */}
          {activeTab === 'classes' && selectedClass && (
            <div className="space-y-6 text-left">
              {/* Specific Class Header Capsule */}
              <div className="relative rounded-[28px] p-6 border border-white/10 bg-[#070b19]/60 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-[#a21caf]/10 blur-3xl pointer-events-none" />
                
                <div className="relative z-10">
                  <button 
                    onClick={() => setSelectedClass(null)} 
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-cyan mb-2 font-black uppercase tracking-widest cursor-pointer transition-all"
                  >
                    <ArrowLeft size={13} strokeWidth={3} /> Class Hub
                  </button>
                  <h3 className="text-2xl font-black text-white flex items-center gap-3 leading-none mt-2">
                    {selectedClass.name}
                  </h3>
                  <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase mt-1.5">Subject: <span className="font-black text-brand-cyan">{selectedClass.subject}</span></p>
                </div>
                <div className="flex gap-2 relative z-10">
                  <button 
                    onClick={() => {
                      setEditClassForm({ name: selectedClass.name, subject: selectedClass.subject });
                      setIsEditingClass(true);
                    }} 
                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 size={13} /> Edit Class
                  </button>
                  <button 
                    onClick={() => {
                      setLearnerForm({ name: '', grade: selectedClass.name, email: '', status: 'Active' });
                      setIsAddingLearner(true);
                    }} 
                    className="bg-brand-cyan hover:bg-cyan-500 text-slate-950 px-4 py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                  >
                    <Plus size={14} strokeWidth={3} /> Add Learner
                  </button>
                </div>
              </div>

              {/* Class Specific Learner List */}
              <div className="space-y-4">
                <h4 className="text-lg font-black tracking-tight text-white">Enrolled Class List</h4>
                <div className="bg-[#070b19]/40 backdrop-blur-xl rounded-[24px] border border-white/10 overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/[0.02] border-b border-white/10">
                          <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Learner Name</th>
                          <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</th>
                          <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                          <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {students.filter(s => s.grade === selectedClass.name).map(student => (
                          <tr key={student.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan font-bold flex items-center justify-center text-xs">
                                  {(student.name || '').charAt(0) || '?'}
                                </div>
                                <span className="font-bold text-white text-sm">{student.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-sm text-slate-300 font-mono">{student.email}</td>
                            <td className="py-4 px-6">
                              <span className={cn(
                                "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                student.status === 'Active' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                              )}>
                                ● {student.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleEditLearner(student)} className="p-2 text-slate-400 hover:text-brand-cyan hover:bg-white/5 rounded-xl transition-all cursor-pointer"><Edit2 size={14} /></button>
                                <button onClick={() => handleDeleteStudent(student.id, student.name)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-xl transition-all cursor-pointer"><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {students.filter(s => s.grade === selectedClass.name).length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-12 text-center text-slate-500 text-sm font-semibold">
                              No learners are currently enrolled in this class. Click "Add Learner" to register someone!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STUDY GROUPS */}
          {activeTab === 'study_groups' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-brand-cyan rounded-full block" />
                  Syllabus Study Groups
                </h3>
                <button 
                  onClick={() => setIsAddingGroup(true)} 
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-6 py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus size={16} strokeWidth={3} /> Create Group
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {studyGroups.map((group) => (
                  <div 
                    key={group.id} 
                    className="bg-white/[0.02] border border-white/10 rounded-[24px] p-6 shadow-2xl relative overflow-hidden group text-left transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-transparent to-emerald-500/5 rounded-bl-[100px] pointer-events-none" />
                    
                    <div className="flex justify-between items-start mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex justify-center items-center group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-300">
                        <BookOpen size={20} />
                      </div>
                      <button 
                        onClick={() => handleDeleteGroup(group.id, group.name)} 
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-white/5 rounded-xl transition-colors border border-transparent"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <h4 className="font-bold text-white text-lg mb-1.5 group-hover:text-emerald-400 transition-colors truncate">{group.name}</h4>
                    <p className="text-slate-400 text-xs mb-5 font-medium line-clamp-2 min-h-[32px]">{group.description || 'No description assigned.'}</p>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 font-semibold w-fit">
                      <Users size={14} className="text-emerald-400" />
                      <span>{group.members.length} Members</span>
                    </div>
                  </div>
                ))}
                {studyGroups.length === 0 && (
                  <div className="col-span-full py-12 text-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.01]">
                    <BookOpen size={44} className="mx-auto text-slate-600 mb-3" />
                    <h4 className="text-lg font-bold text-white mb-1">No Active Study Groups</h4>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto mb-5">Build localized study groups to quickly share notes, materials, or target custom curricula directly.</p>
                    <button 
                      onClick={() => setIsAddingGroup(true)}
                      className="bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                      Create Group
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* GLASSMORPHIC MODALS LIST */}
      <AnimatePresence>
        {/* Modal A: Add Learner (With Manual vs CSV Tab selector) */}
        {isAddingLearner && (
          <div className="fixed inset-0 bg-[#070b19]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#090e1d]/95 border border-white/15 rounded-[32px] p-6 lg:p-8 w-full max-w-md shadow-[0_0_50px_rgba(34,211,238,0.15)] relative text-white"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white text-glow-cyan">Enroll Learner</h3>
                <button 
                  type="button" 
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-400 transition-colors"
                  onClick={() => {
                    setIsAddingLearner(false);
                    setCsvStudents([]);
                    setCsvError('');
                    setLearnerAddMode('manual');
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Mode Selectors */}
              <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl mb-6 text-xs font-bold uppercase tracking-wider">
                <button 
                  type="button" 
                  onClick={() => setLearnerAddMode('manual')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-center transition-all",
                    learnerAddMode === 'manual' ? "bg-brand-cyan text-slate-950 font-black" : "text-slate-400 hover:text-white"
                  )}
                >
                  Manual Entry
                </button>
                <button 
                  type="button" 
                  onClick={() => setLearnerAddMode('csv')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-center transition-all",
                    learnerAddMode === 'csv' ? "bg-brand-cyan text-slate-950 font-black" : "text-slate-400 hover:text-white"
                  )}
                >
                  CSV Bulk Upload
                </button>
              </div>

              {learnerAddMode === 'manual' ? (
                <form onSubmit={handleCreateLearner} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-black text-brand-cyan mb-1.5">Full Name</label>
                    <input 
                      required 
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-cyan" 
                      placeholder="e.g. Sindi Dlamini"
                      value={learnerForm.name} 
                      onChange={e => setLearnerForm({...learnerForm, name: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-black text-brand-cyan mb-1.5">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-cyan font-mono" 
                      placeholder="e.g. sindi@domain.za"
                      value={learnerForm.email} 
                      onChange={e => setLearnerForm({...learnerForm, email: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-black text-brand-cyan mb-1.5">Target Class</label>
                    <select 
                      required 
                      className="w-full bg-[#0B1122] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-cyan cursor-pointer" 
                      value={learnerForm.grade} 
                      onChange={e => setLearnerForm({...learnerForm, grade: e.target.value})}
                    >
                      <option value="" className="bg-[#0B1122]">Select Class</option>
                      {classes.map(c => <option key={c.id} value={c.name} className="bg-[#0b1122]">{c.name}</option>)}
                    </select>
                    {classes.length === 0 && <p className="text-[10px] text-rose-400 font-semibold mt-1.5">⚠️ Setup a class in 'Classes' tab first!</p>}
                  </div>
                  
                  <button 
                    type="submit" 
                    className="w-full bg-brand-cyan hover:bg-cyan-500 text-slate-950 py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-all mt-6 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                  >
                    Enroll Learner
                  </button>
                </form>
              ) : (
                <div className="space-y-4 text-left">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white/[0.02] hover:bg-white/[0.04] p-6 rounded-2xl border-2 border-dashed border-white/10 hover:border-brand-cyan text-center flex flex-col items-center justify-center cursor-pointer transition-colors" 
                  >
                    <CloudUpload size={32} className="text-brand-cyan mb-2 icon-glow-cyan" />
                    <p className="text-xs font-bold text-white mb-1">Upload student roster CSV spreadsheet</p>
                    <p className="text-[10px] text-slate-400">(Columns analog to: Name, Email, Class)</p>
                    <button type="button" className="text-[10px] uppercase tracking-wider font-black bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg border border-white/10 mt-3">Select File</button>
                    <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvSelect} />
                  </div>

                  {csvError && <p className="text-xs text-rose-400 font-semibold bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{csvError}</p>}
                  
                  {csvStudents.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl text-xs font-bold border border-emerald-500/20 flex items-center gap-2">
                        <Check size={16} /> Parsed {csvStudents.length} student records from file!
                      </div>
                      <div className="max-h-36 overflow-y-auto border border-white/10 rounded-xl divide-y divide-white/5 text-xs text-slate-300 bg-white/[0.02] p-2">
                        {csvStudents.slice(0, 5).map((s, idx) => (
                          <div key={idx} className="py-2 px-1 flex justify-between gap-2">
                            <span className="font-bold text-white truncate">{s.name}</span>
                            <span className="text-slate-400 font-mono text-[10px] truncate shrink-0">{s.email} ({s.grade})</span>
                          </div>
                        ))}
                        {csvStudents.length > 5 && <div className="py-2 text-center text-slate-500 text-[10px] font-bold">and {csvStudents.length - 5} more records...</div>}
                      </div>
                      
                      <button 
                        type="button" 
                        onClick={handleBulkImportCsv} 
                        disabled={isImportingCsv}
                        className="w-full bg-brand-cyan hover:bg-cyan-500 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all mt-4 flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                      >
                        {isImportingCsv ? 'Enrolling Students...' : `Enroll ${csvStudents.length} Students`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Modal B: Create Class */}
        {isAddingClass && (
          <div className="fixed inset-0 bg-[#070b19]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#090e1d]/95 border border-white/15 rounded-[32px] p-6 lg:p-8 w-full max-w-md shadow-[0_0_50px_rgba(34,211,238,0.15)] text-white"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white text-glow-cyan">Create Class</h3>
                <button 
                  type="button" 
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-400 transition-colors"
                  onClick={() => setIsAddingClass(false)}
                >
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleCreateClass} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-black text-brand-cyan mb-1.5">Class Designation</label>
                  <input 
                    required 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-cyan" 
                    placeholder="e.g. Grade 10A" 
                    value={classForm.name} 
                    onChange={e => setClassForm({...classForm, name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-black text-brand-cyan mb-1.5">Active Subject</label>
                  <input 
                    required 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-cyan" 
                    placeholder="e.g. Mathematics" 
                    value={classForm.subject} 
                    onChange={e => setClassForm({...classForm, subject: e.target.value})} 
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-brand-cyan hover:bg-cyan-500 text-slate-950 py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-all mt-6 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                >
                  Create Class
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal C: Create Study Group */}
        {isAddingGroup && (
          <div className="fixed inset-0 bg-[#070b19]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#090e1d]/95 border border-white/15 rounded-[32px] p-6 lg:p-8 w-full max-w-md shadow-[0_0_50px_rgba(16,185,129,0.15)] text-white"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white text-glow-cyan">Create Study Group</h3>
                <button 
                  type="button" 
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-400 transition-colors"
                  onClick={() => setIsAddingGroup(false)}
                >
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleCreateGroup} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-black text-emerald-400 mb-1.5">Group Title</label>
                  <input 
                    required 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-400" 
                    placeholder="e.g. Math Olympiad Team" 
                    value={groupForm.name} 
                    onChange={e => setGroupForm({...groupForm, name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-black text-emerald-400 mb-1.5">Description</label>
                  <input 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-400" 
                    placeholder="e.g. Advanced preparation for localized assessments"
                    value={groupForm.description} 
                    onChange={e => setGroupForm({...groupForm, description: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-black text-emerald-400 mb-2">Assign Student Members</label>
                  <div className="border border-white/10 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2 bg-white/[0.01]">
                    {students.map(s => (
                      <label key={s.id} className="flex items-center gap-2.5 cursor-pointer py-1 hover:bg-white/5 px-1.5 rounded-lg transition-all text-xs font-semibold">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-white/20 text-emerald-400 focus:ring-0 focus:ring-offset-0 bg-white/5"
                          checked={groupForm.selectedMembers.includes(s.id)}
                          onChange={(e) => {
                            if (e.target.checked) setGroupForm(prev => ({...prev, selectedMembers: [...prev.selectedMembers, s.id]}));
                            else setGroupForm(prev => ({...prev, selectedMembers: prev.selectedMembers.filter(id => id !== s.id)}));
                          }}
                        />
                        <span className="text-white">{s.name}</span>
                        <span className="text-slate-400 text-[10px]">({s.grade})</span>
                      </label>
                    ))}
                    {students.length === 0 && <p className="text-slate-500 text-xs font-semibold p-2">Roster is empty. Enroll learners first!</p>}
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-all mt-6 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                >
                  Assemble Group
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal D: Edit Student */}
        {isEditingLearner && (
          <div className="fixed inset-0 bg-[#070b19]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#090e1d]/95 border border-white/15 rounded-[32px] p-6 lg:p-8 w-full max-w-md shadow-[0_0_50px_rgba(34,211,238,0.15)] text-white"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white text-glow-cyan">Edit Profile</h3>
                <button 
                  type="button" 
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-400 transition-colors"
                  onClick={() => setIsEditingLearner(false)}
                >
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleUpdateLearner} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-black text-brand-cyan mb-1.5">Full Name</label>
                  <input 
                    required 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-cyan" 
                    value={editLearnerForm.name} 
                    onChange={e => setEditLearnerForm({...editLearnerForm, name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-black text-brand-cyan mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-cyan font-mono" 
                    value={editLearnerForm.email} 
                    onChange={e => setEditLearnerForm({...editLearnerForm, email: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-black text-brand-cyan mb-1.5">Assigned Class</label>
                  <select 
                    required 
                    className="w-full bg-[#0B1122] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-cyan cursor-pointer" 
                    value={editLearnerForm.grade} 
                    onChange={e => setEditLearnerForm({...editLearnerForm, grade: e.target.value})}
                  >
                    <option value="" className="bg-[#0b1122]">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.name} className="bg-[#0b1122]">{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-black text-brand-cyan mb-1.5">Roster Status</label>
                  <select 
                    required 
                    className="w-full bg-[#0B1122] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-cyan cursor-pointer" 
                    value={editLearnerForm.status} 
                    onChange={e => setEditLearnerForm({...editLearnerForm, status: e.target.value as 'Active' | 'Inactive'})}
                  >
                    <option value="Active" className="bg-[#0b1122]">Active</option>
                    <option value="Inactive" className="bg-[#0b1122]">Inactive</option>
                  </select>
                </div>
                
                <button 
                  type="submit" 
                  className="w-full bg-brand-cyan hover:bg-cyan-500 text-slate-950 py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-all mt-6 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                >
                  Save Profile Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal E: Edit Class Details */}
        {isEditingClass && selectedClass && (
          <div className="fixed inset-0 bg-[#070b19]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#090e1d]/95 border border-white/15 rounded-[32px] p-6 lg:p-8 w-full max-w-md shadow-[0_0_50px_rgba(34,211,238,0.15)] text-white"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white text-glow-cyan">Edit Class details</h3>
                <button 
                  type="button" 
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-400 transition-colors"
                  onClick={() => setIsEditingClass(false)}
                >
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleUpdateClass} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-black text-brand-cyan mb-1.5">Class Designation</label>
                  <input 
                    required 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-cyan" 
                    value={editClassForm.name} 
                    onChange={e => setEditClassForm({...editClassForm, name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-black text-brand-cyan mb-1.5">Syllabus Subject</label>
                  <input 
                    required 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-cyan" 
                    value={editClassForm.subject} 
                    onChange={e => setEditClassForm({...editClassForm, subject: e.target.value})} 
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-brand-cyan hover:bg-cyan-500 text-slate-950 py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-all mt-6 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                >
                  Save Class Details
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
