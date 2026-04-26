import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Edit2, Trash2, Mail, GraduationCap } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

interface Student {
  id: string;
  name: string;
  grade: string;
  email: string;
  status: 'Active' | 'Inactive';
  teacherId: string;
}

export default function ClassManagement() {
  const [activeTab, setActiveTab] = useState<'learners' | 'classes'>('learners');
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setIsLoading(false);
      return;
    }

    const q = query(collection(db, 'students'), where('teacherId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentData: Student[] = [];
      snapshot.forEach((doc) => {
        studentData.push({ id: doc.id, ...doc.data() } as Student);
      });
      setStudents(studentData);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching students:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddLearner = async () => {
    const user = auth.currentUser;
    if (!user) return alert('Please sign in first');
    
    const id = Date.now().toString();
    try {
      await setDoc(doc(db, 'students', id), {
        name: 'New Learner ' + Math.floor(Math.random() * 1000),
        grade: 'Grade 10A',
        email: `learner${id}@school.edu.za`,
        status: 'Active',
        teacherId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if(confirm('Are you sure you want to remove this learner?')) {
      try {
        await deleteDoc(doc(db, 'students', id));
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === 'All' || s.grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Users className="text-brand-cyan" />
            Class & Student Management
          </h2>
          <p className="text-slate-500 text-sm mt-1">Manage your classes, enroll learners, and monitor their status.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('learners')}
          className={`pb-3 px-6 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'learners' ? 'border-brand-cyan text-brand-cyan' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          My Learners
        </button>
        <button 
          onClick={() => setActiveTab('classes')}
          className={`pb-3 px-6 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'classes' ? 'border-brand-cyan text-brand-cyan' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          My Classes
        </button>
      </div>

      {activeTab === 'learners' && (
        <div className="space-y-6 animate-fadeInZoom">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Learner Roster</h3>
            <button onClick={handleAddLearner} className="bg-brand-cyan hover:bg-cyan-500 text-slate-900 px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-sm">
              <Plus size={18} /> Add Learner
            </button>
          </div>
          {/* Filters and Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search learners by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 focus:border-brand-cyan transition-all"
              />
            </div>
            
            {/* Filter */}
            <div className="relative">
              <select
                value={selectedGrade}
                onChange={e => setSelectedGrade(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 focus:border-brand-cyan transition-all appearance-none"
              >
                <option value="All">All Classes</option>
                <option value="Grade 10A">Grade 10A</option>
                <option value="Grade 10B">Grade 10B</option>
                <option value="Grade 11A">Grade 11A</option>
              </select>
            </div>

            {/* Total Stat */}
            <div className="bg-gradient-to-r from-brand-cyan/20 to-brand-cyan/5 border border-brand-cyan/20 rounded-xl p-3 flex items-center gap-4">
              <div className="bg-brand-cyan w-10 h-10 rounded-lg flex items-center justify-center text-slate-900 shadow-sm shrink-0">
                <GraduationCap size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Total</p>
                <p className="text-xl font-bold text-slate-800 leading-none mt-1">{filteredStudents.length}</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest">Learner Name</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest">Class / Grade</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest">Email</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 text-sm">
                        Loading learners...
                      </td>
                    </tr>
                  ) : filteredStudents.length > 0 ? (
                    filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                              {student.name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <span className="font-semibold text-slate-800">{student.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-600">{student.grade}</td>
                        <td className="py-4 px-6 text-sm text-slate-600">{student.email}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold 
                            ${student.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-2 text-slate-400 hover:text-brand-cyan hover:bg-brand-cyan/10 rounded-lg transition-colors" title="Message">
                              <Mail size={16} />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(student.id)}
                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Remove"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 text-sm">
                        No learners found matching your criteria.
                      </td>
                    </tr>
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
            <button className="bg-brand-cyan hover:bg-cyan-500 text-slate-900 px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-sm">
              <Plus size={18} /> Create Class
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Example Class Card */}
            {['Grade 10A Mathematics', 'Grade 10B Physical Sciences', 'Grade 11A English'].map((className, i) => (
              <div key={i} className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 text-brand-cyan flex justify-center items-center">
                    <GraduationCap size={24} />
                  </div>
                  <button className="p-2 text-slate-400 hover:text-slate-600">
                    <Edit2 size={16} />
                  </button>
                </div>
                <h4 className="font-bold text-slate-800 text-lg mb-1">{className}</h4>
                <p className="text-slate-500 text-sm mb-4">Term 1 - 2026</p>
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                  <Users size={16} className="text-slate-400" />
                  <span>{24 + i * 3} Enrolled</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
