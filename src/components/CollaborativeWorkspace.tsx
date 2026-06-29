import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Sparkles, Send, Plus, CheckCircle, Circle, Trash2, 
  MousePointer, BookOpen, Clock, Heart, ArrowRight, Save, ShieldAlert,
  Loader2, RefreshCw, MessageSquare, ClipboardList, FileText
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { 
  collection, query, where, onSnapshot, doc, 
  setDoc, updateDoc, deleteDoc, serverTimestamp, getDocs
} from 'firebase/firestore';
import confetti from 'canvas-confetti';

interface CollaborativeWorkspaceProps {
  isDarkMode: boolean;
}

interface Project {
  id: string;
  groupId: string;
  groupName: string;
  title: string;
  description: string;
  notes: string;
  subject: string;
  tasks: Array<{
    id: string;
    title: string;
    assignedTo: string;
    completed: boolean;
  }>;
  createdBy: string;
  createdByName: string;
  updatedAt: any;
}

interface Cursor {
  userId: string;
  name: string;
  x: number;
  y: number;
  projectId: string;
  updatedAt: number;
  color: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  members: string[];
}

interface Message {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
}

// Visual color palette for cursor allocations
const CURSOR_COLORS = [
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#a855f7', // Purple
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#ef4444'  // Red
];

export default function CollaborativeWorkspace({ isDarkMode }: CollaborativeWorkspaceProps) {
  const [user, setUser] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [cursors, setCursors] = useState<Cursor[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // State variables for creation / editing
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjSubject, setNewProjSubject] = useState('Mathematics');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [chatInput, setChatInput] = useState('');
  
  // Ref for absolute/percentage cursor tracking bounding box
  const workspaceAreaRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const notesTimeoutRef = useRef<any>(null);

  // 1. Resolve Auth user and profile
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Load student profile to get official name
        const q = query(
          collection(db, 'students'), 
          where('email', '==', currentUser.email?.toLowerCase().trim())
        );
        getDocs(q).then((snap) => {
          if (!snap.empty) {
            setStudentProfile({ id: snap.docs[0].id, ...snap.docs[0].data() });
          }
        }).catch(console.error);
      }
    });
    return () => unsub();
  }, []);

  const currentStudentName = studentProfile?.name || user?.displayName || user?.email?.split('@')[0] || 'Peer Learner';

  // 2. Fetch study groups that student belongs to (or all if teacher)
  useEffect(() => {
    if (!user) return;
    
    const email = user.email?.toLowerCase().trim() || '';
    
    // Check if user is a student or teacher
    const qStudents = query(collection(db, 'students'), where('email', '==', email));
    
    getDocs(qStudents).then((stdSnap) => {
      let qGroups;
      if (!stdSnap.empty) {
        // User is a student, fetch groups where they are a member
        const studentId = stdSnap.docs[0].id;
        qGroups = query(collection(db, 'study_groups'), where('members', 'array-contains', studentId));
      } else {
        // Fallback: fetch groups by teacher ID
        qGroups = query(collection(db, 'study_groups'), where('teacherId', '==', user.uid));
      }

      const unsubGroups = onSnapshot(qGroups, (snapshot) => {
        const groupsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Group[];
        setMyGroups(groupsList);
        
        // Default to first group if none selected
        if (groupsList.length > 0 && !selectedGroup) {
          setSelectedGroup(groupsList[0]);
        }
      }, (err) => console.error("Error loading study groups for collaborative workspace", err));

      return () => unsubGroups();
    }).catch(console.error);
  }, [user]);

  // 3. Load project documents for the selected study group
  useEffect(() => {
    if (!selectedGroup) return;

    const qProjs = query(
      collection(db, 'collaborative_projects'), 
      where('groupId', '==', selectedGroup.id)
    );

    const unsubProjs = onSnapshot(qProjs, (snapshot) => {
      const projsList = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Project[];
      setProjects(projsList);

      // Keep active project sync updated
      if (selectedProject) {
        const updatedSelected = projsList.find(p => p.id === selectedProject.id);
        if (updatedSelected) {
          setSelectedProject(updatedSelected);
        }
      }
    }, (err) => console.error("Error loading collaborative projects", err));

    return () => unsubProjs();
  }, [selectedGroup, selectedProject?.id]);

  // 4. Load real-time cursor presence and chat messages for active Project
  useEffect(() => {
    if (!selectedProject) {
      setCursors([]);
      setMessages([]);
      return;
    }

    // A. Sync Chat Messages
    const qMsgs = query(
      collection(db, 'communicator_messages'),
      where('projectId', '==', selectedProject.id)
    );
    const unsubMsgs = onSnapshot(qMsgs, (snapshot) => {
      const msgList = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Message[];
      // Sort messages locally
      msgList.sort((a, b) => {
        const t1 = a.createdAt?.seconds || 0;
        const t2 = b.createdAt?.seconds || 0;
        return t1 - t2;
      });
      setMessages(msgList);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    // B. Sync Live Cursors
    const qCursors = query(
      collection(db, 'collaborative_cursors'),
      where('projectId', '==', selectedProject.id)
    );
    const unsubCursors = onSnapshot(qCursors, (snapshot) => {
      const cursorList = snapshot.docs
        .map(d => ({
          userId: d.id,
          ...d.data()
        })) as Cursor[];
      
      const now = Date.now();
      // Filter out cursors that are older than 15 seconds (stale presence) and excluding self
      const activeCursors = cursorList.filter(c => 
        c.userId !== user?.uid && 
        (now - (c.updatedAt || 0)) < 15000
      );
      setCursors(activeCursors);
    });

    return () => {
      unsubMsgs();
      unsubCursors();
    };
  }, [selectedProject?.id, user?.uid]);

  // 5. Track Mouse Move to Broadcast local cursor position
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedProject || !user || !workspaceAreaRef.current) return;

    const rect = workspaceAreaRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Allocate a color based on user UID hash
    const colorIdx = Math.abs(user.uid.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % CURSOR_COLORS.length;
    const assignedColor = CURSOR_COLORS[colorIdx];

    // Throttle / save to Firestore
    const cursorRef = doc(db, 'collaborative_cursors', user.uid);
    setDoc(cursorRef, {
      userId: user.uid,
      name: currentStudentName,
      projectId: selectedProject.id,
      groupId: selectedGroup?.id || '',
      x,
      y,
      color: assignedColor,
      updatedAt: Date.now()
    }, { merge: true }).catch((err) => console.warn("Error updating cursor", err));
  };

  // 6. Handle Notes field editing with debounce
  const handleNotesChange = (val: string) => {
    if (!selectedProject) return;

    // 1. Optimistic Update
    setSelectedProject(prev => prev ? { ...prev, notes: val } : null);

    // 2. Debounced save to Firebase
    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current);
    }

    notesTimeoutRef.current = setTimeout(async () => {
      try {
        const projRef = doc(db, 'collaborative_projects', selectedProject.id);
        await updateDoc(projRef, {
          notes: val,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed syncing notes to database", err);
      }
    }, 600);
  };

  // Create Project handler
  const handleCreateProject = async () => {
    if (!newProjTitle.trim() || !selectedGroup || !user) return;

    const projId = 'project_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5);
    const newProj: Project = {
      id: projId,
      groupId: selectedGroup.id,
      groupName: selectedGroup.name,
      title: newProjTitle,
      subject: newProjSubject,
      description: newProjDesc,
      notes: '',
      tasks: [],
      createdBy: user.uid,
      createdByName: currentStudentName,
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'collaborative_projects', projId), newProj);
      setNewProjTitle('');
      setNewProjDesc('');
      setShowCreateModal(false);
      setSelectedProject(newProj);
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error("Error creating project", err);
      alert("Could not create study group project. Please check network.");
    }
  };

  // Synced Task Board actions
  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !selectedProject) return;

    const newTask = {
      id: 'task_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
      title: newTaskTitle.trim(),
      assignedTo: newTaskAssignee.trim() || 'Anyone',
      completed: false
    };

    const updatedTasks = [...(selectedProject.tasks || []), newTask];

    try {
      await updateDoc(doc(db, 'collaborative_projects', selectedProject.id), {
        tasks: updatedTasks,
        updatedAt: serverTimestamp()
      });
      setNewTaskTitle('');
      setNewTaskAssignee('');
    } catch (err) {
      console.error("Error adding task", err);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!selectedProject) return;

    const updatedTasks = selectedProject.tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );

    // Play confetti if toggled to complete
    const targetTask = selectedProject.tasks.find(t => t.id === taskId);
    if (targetTask && !targetTask.completed) {
      confetti({
        particleCount: 30,
        spread: 40,
        origin: { y: 0.8 }
      });
    }

    try {
      await updateDoc(doc(db, 'collaborative_projects', selectedProject.id), {
        tasks: updatedTasks,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error toggling task", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selectedProject) return;

    const updatedTasks = selectedProject.tasks.filter(t => t.id !== taskId);

    try {
      await updateDoc(doc(db, 'collaborative_projects', selectedProject.id), {
        tasks: updatedTasks,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error deleting task", err);
    }
  };

  // Synced Group Chat actions
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedProject || !user) return;

    const msgId = 'msg_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5);
    const msgData = {
      id: msgId,
      projectId: selectedProject.id,
      senderId: user.uid,
      senderName: currentStudentName,
      text: chatInput.trim(),
      createdAt: serverTimestamp()
    };

    setChatInput('');

    try {
      await setDoc(doc(db, 'communicator_messages', msgId), msgData);
    } catch (err) {
      console.error("Error sending chat message", err);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] p-6 sm:p-10 rounded-[28px] sm:rounded-[36px] text-white shadow-xl relative overflow-hidden flex flex-col justify-end min-h-[180px] sm:min-h-[220px]">
        <div className="absolute top-0 right-0 p-6 opacity-10 hidden sm:block">
          <Users size={180} />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-bold text-yellow-300">
            <Sparkles size={14} className="animate-spin" /> Live Synced Lab
          </div>
          <h2 className="text-3xl sm:text-5xl font-hand tracking-wide leading-tight">Group Projects & Shared Workspaces</h2>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-xl font-medium">
            Connect with classmates in real time. Work on assignments, divide research activities, and track live teammate mouse movements instantly.
          </p>
        </div>
      </div>

      {/* Select Group & Projects Selection Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column: Study Groups List & Projects list */}
        <div className="space-y-6 lg:col-span-1">
          {/* Study Group Selector */}
          <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-5 rounded-[24px] shadow-sm`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#7c3aed] block mb-3">Select Study Group</span>
            {myGroups.length === 0 ? (
              <p className="text-xs text-slate-400 p-2 italic">You are not assigned to any active study groups yet.</p>
            ) : (
              <div className="space-y-2">
                {myGroups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setSelectedGroup(g);
                      setSelectedProject(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all outline-none cursor-pointer ${
                      selectedGroup?.id === g.id
                        ? 'border-indigo-500 bg-indigo-500/10 font-bold text-indigo-600 dark:text-indigo-400'
                        : (isDarkMode ? 'border-white/5 hover:bg-white/5 text-slate-300' : 'border-slate-100 hover:bg-slate-50 text-slate-700')
                    }`}
                  >
                    <span className="truncate text-xs">{g.name}</span>
                    <Users size={14} className="opacity-60" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Projects under Group */}
          <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-5 rounded-[24px] shadow-sm space-y-4`}>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#7c3aed]">Group Projects</span>
              {selectedGroup && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-1 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white border-0 cursor-pointer"
                  title="Create new shared project"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>

            {!selectedGroup ? (
              <p className="text-xs text-slate-400 italic">Please select a study group above first.</p>
            ) : projects.length === 0 ? (
              <div className="text-center py-6">
                <BookOpen className="mx-auto h-8 w-8 text-slate-300 mb-1" />
                <p className="text-xs text-slate-500">No projects yet!</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-2 text-[10px] font-bold text-indigo-500 hover:underline bg-transparent border-0 cursor-pointer"
                >
                  Start Group Project +
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => setSelectedProject(proj)}
                    className={`w-full text-left p-3 rounded-xl border flex flex-col gap-1 transition-all outline-none cursor-pointer ${
                      selectedProject?.id === proj.id
                        ? 'border-indigo-500 bg-indigo-500/5 font-bold text-indigo-600 dark:text-indigo-400'
                        : (isDarkMode ? 'border-white/5 hover:bg-white/5 text-slate-300' : 'border-slate-100 hover:bg-slate-50 text-slate-700')
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-bold truncate">{proj.title}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-500 scale-90">{proj.subject}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 line-clamp-1">{proj.description || 'No description added.'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Main active project workspace */}
        <div className="lg:col-span-3">
          {!selectedProject ? (
            <div className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} p-12 rounded-[28px] text-center flex flex-col items-center justify-center min-h-[400px]`}>
              <Users size={48} className="text-slate-300 dark:text-slate-700 mb-3 animate-pulse" />
              <h3 className={`text-xl font-hand ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>No Active Project Workspace</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-sm">
                Select or create a collaborative group project from the sidebar list to enter the real-time syncing multiplayer workspace!
              </p>
            </div>
          ) : (
            <div 
              ref={workspaceAreaRef}
              onMouseMove={handleMouseMove}
              className={`${isDarkMode ? 'glass' : 'bg-white border border-slate-200'} rounded-[28px] overflow-hidden flex flex-col h-[750px] relative shadow-lg`}
            >
              {/* Floating Cursors Layer */}
              <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                {cursors.map((cursor) => (
                  <div
                    key={cursor.userId}
                    className="absolute transition-all duration-100 ease-out flex items-center gap-1.5"
                    style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
                  >
                    <MousePointer 
                      size={18} 
                      style={{ color: cursor.color, fill: cursor.color }}
                      className="rotate-[270deg] drop-shadow-md"
                    />
                    <span 
                      className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded-md shadow-md whitespace-nowrap"
                      style={{ backgroundColor: cursor.color }}
                    >
                      {cursor.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Workspace Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/40 relative z-10">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#7c3aed] bg-indigo-500/10 px-2.5 py-0.5 rounded-full">
                      {selectedProject.subject} Project
                    </span>
                    <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock size={10} className="animate-spin" /> Live Syncing
                    </span>
                  </div>
                  <h3 className={`text-lg font-black truncate max-w-md ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{selectedProject.title}</h3>
                </div>

                {/* active online list (Presence) */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold hidden sm:inline mr-1">Teammates here:</span>
                  <div className="flex -space-x-2">
                    <div 
                      className="w-7 h-7 rounded-full bg-indigo-600 text-white text-[9px] font-black border-2 border-white dark:border-slate-900 flex items-center justify-center cursor-default"
                      title={`${currentStudentName} (You)`}
                    >
                      YOU
                    </div>
                    {cursors.map((c, idx) => (
                      <div
                        key={c.userId}
                        className="w-7 h-7 rounded-full text-white text-[9px] font-black border-2 border-white dark:border-slate-900 flex items-center justify-center animate-pulse"
                        style={{ backgroundColor: c.color }}
                        title={c.name}
                      >
                        {c.name.substring(0, 2).toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Workspace Split Panels */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden relative z-10">
                
                {/* Left Panel: Shared Notes Board & Task List (8 cols) */}
                <div className="md:col-span-8 flex flex-col divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto">
                  
                  {/* Notes Editor */}
                  <div className="p-6 space-y-3 flex-1 flex flex-col min-h-[300px]">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <FileText size={14} /> Shared Project Draft & Research
                      </label>
                      <span className="text-[10px] text-slate-400 italic">Autosaved to cloud</span>
                    </div>
                    <textarea
                      value={selectedProject.notes || ''}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      placeholder="Collaborate and type your research or group project summary draft here in real-time together..."
                      className="w-full flex-1 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-xs font-bold leading-relaxed bg-white/50 dark:bg-slate-950/40 outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  {/* Task Board */}
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <ClipboardList size={14} /> Synced Group Task Checklist
                      </label>
                      <span className="text-[10px] font-bold text-indigo-500">
                        {selectedProject.tasks?.filter(t => t.completed).length || 0} / {selectedProject.tasks?.length || 0} Completed
                      </span>
                    </div>

                    {/* Task inputs */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Project sub-task (e.g. Gather chemistry formulas)"
                        className="flex-1 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-indigo-500 bg-white/50 dark:bg-slate-950/40"
                      />
                      <input
                        type="text"
                        value={newTaskAssignee}
                        onChange={(e) => setNewTaskAssignee(e.target.value)}
                        placeholder="Assignee name (optional)"
                        className="sm:w-[150px] border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-indigo-500 bg-white/50 dark:bg-slate-950/40"
                      />
                      <button
                        onClick={handleAddTask}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider border-0 cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Plus size={14} /> Add
                      </button>
                    </div>

                    {/* Task list list */}
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {(!selectedProject.tasks || selectedProject.tasks.length === 0) ? (
                        <p className="text-xs text-slate-400 italic py-2 text-center">No project tasks allocated. Add tasks above to sync workload!</p>
                      ) : (
                        selectedProject.tasks.map((task) => (
                          <div
                            key={task.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                              task.completed
                                ? 'bg-emerald-500/5 border-emerald-500/20'
                                : (isDarkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:bg-slate-100/50')
                            } transition-colors`}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleToggleTask(task.id)}
                                className="text-slate-400 hover:text-indigo-600 bg-transparent border-0 cursor-pointer"
                              >
                                {task.completed ? (
                                  <CheckCircle size={18} className="text-emerald-500" />
                                ) : (
                                  <Circle size={18} />
                                )}
                              </button>
                              <div>
                                <span className={`text-xs font-bold ${task.completed ? 'line-through text-slate-400' : (isDarkMode ? 'text-white' : 'text-slate-800')}`}>
                                  {task.title}
                                </span>
                                <span className="text-[9px] text-slate-400 ml-2 bg-slate-500/10 px-1.5 py-0.5 rounded">
                                  @{task.assignedTo || 'Anyone'}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-slate-400 hover:text-rose-500 hover:scale-105 bg-transparent border-0 cursor-pointer transition-transform"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* Right Panel: Project specific instant Group Chat (4 cols) */}
                <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 flex flex-col h-full bg-slate-50/30 dark:bg-slate-900/10 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex items-center gap-2">
                    <MessageSquare size={14} className="text-indigo-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Project Channel Chat</span>
                  </div>

                  {/* Message feed */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
                    {messages.length === 0 ? (
                      <div className="my-auto text-center p-4">
                        <MessageSquare className="mx-auto h-8 w-8 text-slate-300 mb-1" />
                        <p className="text-[11px] text-slate-400 italic">No project messages sent yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isSelf = msg.senderId === user?.uid;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col max-w-[85%] ${isSelf ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                          >
                            <span className="text-[9px] text-slate-400 mb-0.5 font-bold">{msg.senderName}</span>
                            <div className={`p-2.5 rounded-2xl text-xs font-bold leading-relaxed ${
                              isSelf
                                ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
                                : (isDarkMode ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-800') + ' rounded-tl-none'
                            }`}>
                              {msg.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Chat input form */}
                  <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex gap-1.5">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type a group message..."
                      className="flex-1 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-indigo-500 bg-white/50 dark:bg-slate-950/40"
                    />
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl border-0 cursor-pointer flex items-center justify-center shrink-0"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE PROJECT MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md p-6 rounded-2xl shadow-2xl space-y-4 ${
                isDarkMode ? 'bg-navy-dark border border-slate-800' : 'bg-white border border-slate-100'
              }`}
            >
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-lg font-black">Create Study Group Project</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Project Title</label>
                  <input
                    type="text"
                    value={newProjTitle}
                    onChange={(e) => setNewProjTitle(e.target.value)}
                    placeholder="e.g., Mathematics Algebra Assignment"
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold bg-transparent outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Subject</label>
                  <select
                    value={newProjSubject}
                    onChange={(e) => setNewProjSubject(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold bg-transparent outline-none focus:border-indigo-500"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physical Sciences">Physical Sciences</option>
                    <option value="English First Additional Language">English First Additional Language</option>
                    <option value="Life Skills">Life Skills</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Short Description</label>
                  <textarea
                    rows={3}
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                    placeholder="Briefly describe the objective of this project work..."
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold bg-transparent outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold cursor-pointer text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjTitle.trim()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2 text-xs font-black uppercase tracking-widest border-0 cursor-pointer disabled:opacity-50"
                >
                  Start Project!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
