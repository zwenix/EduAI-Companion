import React, { useState, useEffect, useRef } from 'react';
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
  const [selectedClass, setSelectedClass] = useState<ClassModel | null>(null);
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [editClassForm, setEditClassForm] = useState({ name: '', subject: '' });

  const handleTabChange = (tab: 'learners' | 'classes' | 'study_groups') => {
    setActiveTab(tab);
    setSelectedClass(null);
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

      // Update current state
      setSelectedClass({
        ...selectedClass,
        name: newName,
        subject: editClassForm.subject.trim()
      });

      setIsEditingClass(false);
      
      // Notify
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


  // Modals
  const [isAddingLearner, setIsAddingLearner] = useState(false);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [isEditingLearner, setIsEditingLearner] = useState(false);
  const [editingLearnerId, setEditingLearnerId] = useState('');
  const [editLearnerForm, setEditLearnerForm] = useState({ name: '', grade: '', email: '', status: 'Active' as 'Active' | 'Inactive' });

  // CSV Bulk Import states
  const [learnerAddMode, setLearnerAddMode] = useState<'manual' | 'csv'>('manual');
  const [csvStudents, setCsvStudents] = useState<{ name: string; email: string; grade: string }[]>([]);
  const [csvError, setCsvError] = useState('');
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Forms
  const [learnerForm, setLearnerForm] = useState({ name: '', grade: '', email: '', status: 'Active' as const });
  const [classForm, setClassForm] = useState({ name: '', subject: '' });
  const [groupForm, setGroupForm] = useState({ name: '', description: '', selectedMembers: [] as string[] });

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
          throw new Error("CSV header must contain analogous fields for 'Name' and 'Email'. (e.g., Name,Email,Class/Grade)");
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
        
        // Notification
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
    const name = s.name || '';
    const email = s.email || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || email.toLowerCase().includes(searchTerm.toLowerCase());
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
            onClick={() => handleTabChange(tab as any)}
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
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
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
                            {(student.name || '').charAt(0) || '?'}
                          </div>
                          <span className="font-semibold text-slate-800">{student.name || 'Unnamed Learner'}</span>
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
                          <button onClick={() => handleEditLearner(student)} className="p-2 text-slate-400 hover:text-brand-cyan hover:bg-cyan-50 rounded-lg transition-colors cursor-pointer" title="Edit Profile">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteStudent(student.id, student.name)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Remove">
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

            {/* Mobile Stacked List View */}
            <div className="block sm:hidden divide-y divide-slate-100 bg-[#F8FAFC]/50">
              {filteredStudents.map(student => (
                <div key={student.id} className="p-4 space-y-3 hover:bg-slate-50/80 transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-cyan/15 text-brand-cyan flex items-center justify-center text-xs font-bold shrink-0">
                        {(student.name || '').charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{student.name || 'Unnamed Learner'}</p>
                        <p className="text-xs text-slate-500 truncate">{student.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={() => handleEditLearner(student)} 
                        className="p-2 text-slate-400 hover:text-brand-cyan hover:bg-cyan-50 rounded-xl transition-all shrink-0 border border-slate-100 bg-white cursor-pointer" 
                        title="Edit Profile"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button 
                        onClick={() => handleDeleteStudent(student.id, student.name)} 
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shrink-0 border border-slate-100 bg-white cursor-pointer" 
                        title="Remove"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-[11px] text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-100">
                      <GraduationCap size={13} className="text-brand-cyan" />
                      <span>Class: <strong className="font-bold text-slate-800">{student.grade}</strong></span>
                    </div>
                    
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${student.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {student.status}
                    </span>
                  </div>
                </div>
              ))}
              {filteredStudents.length === 0 && (
                <div className="py-12 text-center text-slate-550 text-xs font-medium">No learners found.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'classes' && !selectedClass && (
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
                <div 
                  key={cls.id} 
                  onClick={() => setSelectedClass(cls)}
                  className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200 hover:border-brand-cyan/60 hover:shadow-md transition-all cursor-pointer group text-left"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 text-brand-cyan flex justify-center items-center group-hover:bg-brand-cyan group-hover:text-slate-900 transition-all">
                      <GraduationCap size={24} />
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClass(cls.id, cls.name);
                      }} 
                      className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg mb-1 group-hover:text-brand-cyan transition-colors">{cls.name}</h4>
                  <p className="text-slate-500 text-sm mb-4">{cls.subject}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                      <Users size={16} className="text-slate-400" />
                      <span>{enrolled} Enrolled</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 group-hover:text-brand-cyan transition-colors flex items-center gap-1">
                      Manage →
                    </span>
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

      {activeTab === 'classes' && selectedClass && (
        <div className="space-y-6 animate-fadeInZoom text-left">
          {/* Header with Back button and actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-sm border border-slate-200">
            <div>
              <button 
                onClick={() => setSelectedClass(null)} 
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-brand-cyan mb-2 cursor-pointer transition-all font-semibold"
              >
                ← Back to Classes
              </button>
              <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                {selectedClass.name}
              </h3>
              <p className="text-slate-500 text-sm mt-1">Subject: <span className="font-semibold text-slate-700">{selectedClass.subject}</span></p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setEditClassForm({ name: selectedClass.name, subject: selectedClass.subject });
                  setIsEditingClass(true);
                }} 
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-sm text-sm cursor-pointer"
              >
                <Edit2 size={16} /> Edit Details
              </button>
              <button 
                onClick={() => {
                  setLearnerForm({ name: '', grade: selectedClass.name, email: '', status: 'Active' });
                  setIsAddingLearner(true);
                }} 
                className="bg-brand-cyan hover:bg-cyan-500 text-slate-900 px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-sm text-sm cursor-pointer"
              >
                <Plus size={16} /> Add Learner
              </button>
            </div>
          </div>

          {/* Enrolled Learners List */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-slate-800">Enrolled Learners</h4>
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest">Learner Name</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest">Email</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.filter(s => s.grade === selectedClass.name).map(student => (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                              {(student.name || '').charAt(0) || '?'}
                            </div>
                            <span className="font-semibold text-slate-800">{student.name || 'Unnamed Learner'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-600">{student.email}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${student.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleEditLearner(student)} className="p-2 text-slate-400 hover:text-brand-cyan hover:bg-cyan-50 rounded-lg transition-colors cursor-pointer" title="Edit Profile">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeleteStudent(student.id, student.name)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Remove">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {students.filter(s => s.grade === selectedClass.name).length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500 text-sm">
                          No learners currently enrolled in this class. Click "Add Learner" to get started!
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add Learner</h3>
              <button type="button" onClick={() => {
                setIsAddingLearner(false);
                setCsvStudents([]);
                setCsvError('');
                setLearnerAddMode('manual');
              }}><X className="text-slate-400" /></button>
            </div>

            {/* Selector Tab for Manual vs CSV */}
            <div className="flex border-b border-slate-200 mb-6 font-medium text-sm">
              <button 
                type="button" 
                onClick={() => setLearnerAddMode('manual')}
                className={`flex-1 pb-2.5 border-b-2 text-center transition-colors ${learnerAddMode === 'manual' ? 'border-brand-cyan text-brand-cyan font-bold' : 'border-transparent text-slate-400 hover:text-slate-500'}`}
              >
                Manual Entry
              </button>
              <button 
                type="button" 
                onClick={() => setLearnerAddMode('csv')}
                className={`flex-1 pb-2.5 border-b-2 text-center transition-colors ${learnerAddMode === 'csv' ? 'border-brand-cyan text-brand-cyan font-bold' : 'border-transparent text-slate-400 hover:text-slate-500'}`}
              >
                CSV Bulk Import
              </button>
            </div>

            {learnerAddMode === 'manual' ? (
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
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-55 p-4 rounded-2xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center cursor-pointer hover:border-brand-cyan transition-colors" onClick={() => fileInputRef.current?.click()}>
                  <p className="text-xs font-semibold text-slate-500 mb-2">Upload student roster spreadsheet</p>
                  <p className="text-[10px] text-slate-400 mb-3">(Supported layout: Name, Email, Grade)</p>
                  <button type="button" className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg border font-bold hover:bg-slate-200">Select CSV File</button>
                  <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvSelect} />
                </div>

                {csvError && <p className="text-xs text-rose-500 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-100">{csvError}</p>}
                {csvStudents.length > 0 && (
                  <div className="space-y-3">
                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs font-semibold border border-emerald-100">
                      Successfully parsed {csvStudents.length} student records from CSV!
                    </div>
                    <div className="max-h-40 overflow-y-auto border rounded-xl divide-y text-xs text-slate-600 bg-slate-50">
                      {csvStudents.slice(0, 5).map((s, idx) => (
                        <div key={idx} className="p-2 flex justify-between">
                          <span className="font-bold">{s.name}</span>
                          <span>{s.email} ({s.grade})</span>
                        </div>
                      ))}
                      {csvStudents.length > 5 && <div className="p-2 text-center text-slate-400">...and {csvStudents.length - 5} more records</div>}
                    </div>
                    <button 
                      type="button" 
                      onClick={handleBulkImportCsv} 
                      disabled={isImportingCsv}
                      className="w-full bg-brand-cyan hover:bg-cyan-500 text-slate-900 font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2"
                    >
                      {isImportingCsv ? 'Enrolling Learners...' : `Enroll ${csvStudents.length} Students`}
                    </button>
                  </div>
                )}
              </div>
            )}
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

      {isEditingLearner && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
              <h3 className="text-xl font-bold text-slate-900">Edit Learner Profile</h3>
              <button type="button" onClick={() => setIsEditingLearner(false)}>
                <X className="text-slate-400 cursor-pointer hover:text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleUpdateLearner} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Name</label>
                <input 
                  required 
                  className="w-full border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-brand-cyan" 
                  value={editLearnerForm.name} 
                  onChange={e => setEditLearnerForm({...editLearnerForm, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Email</label>
                <input 
                  type="email" 
                  required 
                  className="w-full border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-brand-cyan" 
                  value={editLearnerForm.email} 
                  onChange={e => setEditLearnerForm({...editLearnerForm, email: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Class</label>
                <select 
                  required 
                  className="w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-900 focus:outline-none focus:border-brand-cyan" 
                  value={editLearnerForm.grade} 
                  onChange={e => setEditLearnerForm({...editLearnerForm, grade: e.target.value})}
                >
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Status</label>
                <select 
                  required 
                  className="w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-900 focus:outline-none focus:border-brand-cyan" 
                  value={editLearnerForm.status} 
                  onChange={e => setEditLearnerForm({...editLearnerForm, status: e.target.value as 'Active' | 'Inactive'})}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-brand-cyan text-slate-900 font-bold py-3 rounded-xl mt-4 cursor-pointer hover:bg-opacity-95 transition-all">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {isEditingClass && selectedClass && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md animate-fadeInZoom">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Edit Class Details</h3>
              <button type="button" onClick={() => setIsEditingClass(false)}><X className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleUpdateClass} className="space-y-4">
              <div className="text-left">
                <label className="block text-sm font-semibold mb-1 text-slate-700">Class Name</label>
                <input 
                  required 
                  className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-brand-cyan" 
                  value={editClassForm.name} 
                  onChange={e => setEditClassForm({...editClassForm, name: e.target.value})} 
                />
              </div>
              <div className="text-left">
                <label className="block text-sm font-semibold mb-1 text-slate-700">Subject</label>
                <input 
                  required 
                  className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-brand-cyan" 
                  value={editClassForm.subject} 
                  onChange={e => setEditClassForm({...editClassForm, subject: e.target.value})} 
                />
              </div>
              <button type="submit" className="w-full bg-brand-cyan text-slate-900 font-bold py-3 rounded-xl mt-4 cursor-pointer hover:bg-opacity-95 transition-all">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
