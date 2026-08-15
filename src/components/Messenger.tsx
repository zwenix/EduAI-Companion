import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, Send, Paperclip, Smile, Sparkles, 
  Users, FileText, Plus, MessageSquare, X, RefreshCw,
  ChevronDown, Trash2, ArrowLeft, PanelLeftClose, PanelLeftOpen, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, setDoc, doc, serverTimestamp, where, or, updateDoc, deleteDoc } from 'firebase/firestore';

// Users removed from the app & messenger (hidden from all contact/chat lists)
const BLOCKED_USER_NAMES = ['Raaiganah Abrams'];

interface ChatMessage {
  id: string;
  senderId?: string;
  senderEmail?: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: string;
  createdAt?: any;
  text: string;
  isSelf?: boolean;
  projectId?: string;
  threadId?: string;
  recipientId?: string;
  groupId?: string;
  collection?: string;
  attachment?: {
    name: string;
    size?: string;
    type: 'pdf' | 'doc' | 'image';
  };
}

interface ChatThread {
  id: string;
  title: string;
  subtitle: string;
  type: 'group' | 'direct';
  category?: 'chat' | 'collaboration';
  avatar?: string;
  unreadCount?: number;
  statusText?: string;
  statusType?: 'unread' | 'online' | 'offline' | 'inactive' | 'normal';
  members?: string;
  messages: ChatMessage[];
  typingUser?: string;
  recipientId?: string;
  recipientEmail?: string;
  lastActive?: number;
}

interface UserContact {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  role?: string;
  grade?: string;
  status?: string;         // presenceStatus (online/offline/inactive)
  lastActive?: number;     // ms epoch
  enrollmentStatus?: string; // 'Active' | 'Inactive' (students)
}

type Presence = 'online' | 'offline' | 'inactive';

const toMillis = (v: any): number => {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (v instanceof Date) return v.getTime();
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (typeof v === 'string') { const t = Date.parse(v); return isNaN(t) ? 0 : t; }
  return 0;
};

const computePresence = (c: { status?: string; lastActive?: number }): Presence => {
  const st = (c.status || '').toLowerCase();
  if (st === 'online') return 'online';
  if (st === 'inactive' || st === 'away') return 'inactive';
  if (st === 'offline') return 'offline';
  if (c.lastActive) {
    const mins = (Date.now() - c.lastActive) / 60000;
    if (mins < 5) return 'online';
    if (mins < 30) return 'inactive';
    return 'offline';
  }
  return 'offline';
};

const PRESENCE_META: Record<Presence, { color: string; dot: string; label: string }> = {
  online:   { color: 'text-emerald-400', dot: 'bg-emerald-500', label: 'online' },
  inactive: { color: 'text-amber-400',   dot: 'bg-amber-400',   label: 'inactive' },
  offline:  { color: 'text-slate-500',   dot: 'bg-slate-500',   label: 'offline' },
};

function PresenceBadge({ presence, showLabel = true }: { presence: Presence; showLabel?: boolean }) {
  const meta = PRESENCE_META[presence];
  return (
    <span className={`shrink-0 flex items-center gap-1.5 text-[10px] font-semibold ${meta.color}`}>
      <span className={`w-2 h-2 rounded-full ${meta.dot} ${presence === 'online' ? 'animate-pulse' : ''}`} />
      {showLabel && meta.label}
    </span>
  );
}

function SidebarSection({ title, count, open, onToggle, children }: {
  title: string; count: number; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all cursor-pointer group"
      >
        <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors">
          {title}
          <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-2 py-0.5">
            {count}
          </span>
        </span>
        <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 pt-2 px-0.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Messenger() {
  const [activeThreadId, setActiveThreadId] = useState<string>('general-hub');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ chats: true, collaborations: false, contacts: false });
  const [deletedThreadIds, setDeletedThreadIds] = useState<Set<string>>(new Set());
  const [mobileShowChat, setMobileShowChat] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  
  // Real data state
  const [dbUsers, setDbUsers] = useState<UserContact[]>([]);
  const [dbGroups, setDbGroups] = useState<any[]>([]);
  const [dbProjects, setDbProjects] = useState<any[]>([]);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>(() => {
    try {
      const cached = localStorage.getItem('eduai_all_messages');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid || 'local-user';
  const currentUserEmail = currentUser?.email || localStorage.getItem('eduai_user_email') || 'user@eduai.app';
  const currentUserName = currentUser?.displayName || localStorage.getItem('eduai_user_name') || currentUserEmail.split('@')[0] || 'You';
  const currentUserPhoto = currentUser?.photoURL || localStorage.getItem('eduai_user_photo') || '';

  const isBlockedName = (name?: string) => !!name && BLOCKED_USER_NAMES.some(n => n.toLowerCase() === name.toLowerCase());

  // 1. Sync real-time data from Firestore
  useEffect(() => {
    if (!db) return;

    // A. Listen to registered users (with Google profile pictures + presence)
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const usersList: UserContact[] = [];
      snap.docs.forEach(d => {
        const data = d.data();
        if (d.id !== currentUserId && data.email !== currentUserEmail && !isBlockedName(data.name || data.displayName)) {
          usersList.push({
            id: d.id,
            name: data.name || data.displayName || data.email?.split('@')[0] || 'User',
            email: data.email || '',
            photoUrl: data.photoUrl || data.photoURL || data.avatar || '',
            role: data.role || 'Member',
            status: data.presenceStatus || '',
            lastActive: toMillis(data.lastActive)
          });
        }
      });
      setDbUsers(prev => {
        const map = new Map(prev.map(u => [u.id || u.email, u]));
        usersList.forEach(u => map.set(u.id || u.email, u));
        return Array.from(map.values());
      });
    }, (err) => console.error("Error loading users for Messenger:", err));

    // B. Listen to enrolled students
    const userRole = localStorage.getItem('eduai_user_role')?.toLowerCase();
    let stuQuery = collection(db, 'students') as any;
    if (userRole === 'parent') {
      stuQuery = query(collection(db, 'students'), where('parentEmail', '==', currentUserEmail));
    } else {
      stuQuery = query(collection(db, 'students'), where('teacherId', '==', currentUserId));
    }
    const unsubStudents = onSnapshot(stuQuery, (snap) => {
      const stuList: UserContact[] = [];
      snap.docs.forEach(d => {
        const data = d.data();
        if (d.id !== currentUserId && data.email !== currentUserEmail && !isBlockedName(data.name)) {
          stuList.push({
            id: d.id,
            name: data.name || data.email?.split('@')[0] || 'Student',
            email: data.email || '',
            photoUrl: data.photoUrl || data.photoURL || data.avatar || '',
            role: 'Student',
            grade: data.grade || data.gradeLevel || '',
            status: data.presenceStatus || '',
            lastActive: toMillis(data.lastActiveDate),
            enrollmentStatus: data.status || ''
          });
        }
      });
      setDbUsers(prev => {
        const map = new Map(prev.map(u => [u.email || u.id, u]));
        stuList.forEach(u => {
          if (map.has(u.email || u.id)) {
            const existing = map.get(u.email || u.id)!;
            map.set(u.email || u.id, { ...existing, photoUrl: existing.photoUrl || u.photoUrl, grade: u.grade, status: existing.status || u.status, lastActive: existing.lastActive || u.lastActive, enrollmentStatus: u.enrollmentStatus });
          } else {
            map.set(u.email || u.id, u);
          }
        });
        return Array.from(map.values());
      });
    }, (err) => console.error("Error loading students for Messenger:", err));

    // C. Listen to study groups
    const unsubGroups = onSnapshot(collection(db, 'study_groups'), (snap) => {
      const gList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDbGroups(gList);
    }, (err) => console.error("Error loading study groups:", err));

    // D. Listen to collaborative projects
    const unsubProjects = onSnapshot(collection(db, 'collaborative_projects'), (snap) => {
      const pList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDbProjects(pList);
    }, (err) => console.error("Error loading projects:", err));

    // E. Listen to all message collections to restore past chats
    const handleMessagesSnap = (snap: any, collectionType: string) => {
      const incoming: ChatMessage[] = [];
      snap.docs.forEach((docSnap: any) => {
        const data = docSnap.data();
        const timestampStr = data.createdAt?.toDate 
          ? data.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : data.timestamp || 'Recent';
        
        incoming.push({
          id: docSnap.id,
          senderId: data.senderId || '',
          senderEmail: data.senderEmail || '',
          senderName: data.senderName || 'Anonymous',
          senderAvatar: data.senderAvatar || data.senderPhotoUrl || '',
          timestamp: timestampStr,
          createdAt: data.createdAt?.seconds ? data.createdAt.seconds * 1000 : Date.now(),
          text: data.text || '',
          projectId: data.projectId || '',
          threadId: data.threadId || '',
          recipientId: data.recipientId || '',
          groupId: data.groupId || '',
          collection: collectionType,
          isSelf: data.senderId === currentUserId || data.senderEmail === currentUserEmail || data.senderName === currentUserName,
          attachment: data.attachment
        });
      });

      setAllMessages(prev => {
        const map = new Map(prev.map(m => [m.id, m]));
        incoming.forEach(m => map.set(m.id, m));
        const merged = Array.from(map.values()).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        try {
          localStorage.setItem('eduai_all_messages', JSON.stringify(merged));
        } catch (e) {}
        return merged;
      });
    };

    const unsubComm = onSnapshot(
      query(collection(db, 'communicator_messages'), or(where('senderId', '==', currentUserId), where('recipientId', '==', currentUserId))),
      (s) => handleMessagesSnap(s, 'communicator_messages'),
      (err) => console.error("Error loading communicator messages:", err)
    );
    const unsubDirect = onSnapshot(collection(db, 'direct_messages'), (s) => handleMessagesSnap(s, 'direct_messages'), (err) => console.error(err));
    const unsubGen = onSnapshot(collection(db, 'messages'), (s) => handleMessagesSnap(s, 'messages'), (err) => console.error(err));
    const unsubHub = onSnapshot(collection(db, 'messenger_messages'), (s) => handleMessagesSnap(s, 'messenger_messages'), (err) => console.error(err));

    return () => {
      unsubUsers();
      unsubStudents();
      unsubGroups();
      unsubProjects();
      unsubComm();
      unsubDirect();
      unsubGen();
      unsubHub();
    };
  }, [currentUserId, currentUserEmail, currentUserName]);

  // 1b. Share the signed-in user's own presence (heartbeat) so other users see a real online status
  useEffect(() => {
    if (!db || !currentUserId || currentUserId === 'local-user') return;

    const setPresence = async (presenceStatus: Presence) => {
      try {
        await updateDoc(doc(db, 'users', currentUserId), {
          presenceStatus,
          lastActive: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        // ignore: user doc may not exist yet, or rules may not permit
      }
    };

    setPresence('online');
    const interval = window.setInterval(() => setPresence('online'), 45000);
    const onVis = () => {
      if (document.visibilityState === 'hidden') setPresence('offline');
      else setPresence('online');
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('beforeunload', () => setPresence('offline'));

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVis);
      setPresence('offline');
    };
  }, [db, currentUserId]);

  // Helper to ensure every user has a clear profile picture
  const getAvatarUrl = (userContact?: { photoUrl?: string; email?: string; name?: string; id?: string }) => {
    if (userContact?.photoUrl && (userContact.photoUrl.startsWith('http') || userContact.photoUrl.startsWith('data:'))) {
      return userContact.photoUrl;
    }
    const msgWithAvatar = allMessages.find(m => 
      (m.senderId === userContact?.id || m.senderEmail === userContact?.email || m.senderName === userContact?.name) && 
      m.senderAvatar && m.senderAvatar.startsWith('http')
    );
    if (msgWithAvatar?.senderAvatar) {
      return msgWithAvatar.senderAvatar;
    }
    const seed = userContact?.email || userContact?.name || userContact?.id || 'User';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1e293b`;
  };

  // 2a. Contacts list (people, for the Contacts section + direct chat building)
  const contacts = useMemo<UserContact[]>(() => {
    const map = new Map<string, UserContact>();
    dbUsers.forEach(u => map.set(u.id || u.email, u));
    allMessages.forEach(m => {
      if (!m.isSelf && m.senderId && m.senderId !== currentUserId && !isBlockedName(m.senderName)) {
        const key = m.senderId;
        if (!map.has(key)) {
          map.set(key, {
            id: m.senderId,
            name: m.senderName || 'Classmate',
            email: m.senderEmail || '',
            photoUrl: m.senderAvatar || ''
          });
        }
      }
    });
    return Array.from(map.values())
      .filter(c => c.id !== currentUserId && c.email !== currentUserEmail && !isBlockedName(c.name))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [dbUsers, allMessages, currentUserId, currentUserEmail]);

  const directIdFor = (contactId: string) => `direct_${[currentUserId, contactId].sort().join('_')}`;

  // 2b. Build Chat Threads Dynamically (No placeholder dummy threads!)
  const threads = useMemo<ChatThread[]>(() => {
    const threadMap = new Map<string, ChatThread>();

    // A. General Classroom Hub (broadcast / general messages)
    const generalMessages = allMessages.filter(m => !m.projectId && !m.threadId && !m.recipientId && !m.groupId);
    const lastGenMsg = generalMessages[generalMessages.length - 1];
    threadMap.set('general-hub', { recipientId: '', avatar: '', typingUser: '',
      id: 'general-hub',
      title: 'General Classroom Hub',
      subtitle: lastGenMsg ? `${lastGenMsg.senderName}: ${lastGenMsg.text}` : 'School broadcast & community discussion channel.',
      type: 'group',
      category: 'chat',
      members: 'All Students & Faculty • EduAI Network',
      messages: generalMessages,
      lastActive: lastGenMsg?.createdAt || 0
    });

    // B. Group Threads from study groups
    dbGroups.forEach(g => {
      const gMsgs = allMessages.filter(m => m.groupId === g.id || m.projectId === g.id || m.threadId === g.id);
      const lastMsg = gMsgs[gMsgs.length - 1];
      threadMap.set(g.id, {
        id: g.id,
        title: g.name || g.title || 'Study Group',
        subtitle: lastMsg ? `${lastMsg.senderName}: ${lastMsg.text}` : g.description || 'Active study group channel.',
        type: 'group',
        category: 'chat',
        members: `${g.members?.length || 4} Members • Group Study`,
        messages: gMsgs,
        lastActive: lastMsg?.createdAt || 0
      });
    });

    // C. Collaboration Threads from collaborative projects
    dbProjects.forEach(p => {
      if (!threadMap.has(p.id)) {
        const pMsgs = allMessages.filter(m => m.projectId === p.id || m.threadId === p.id);
        const lastMsg = pMsgs[pMsgs.length - 1];
        threadMap.set(p.id, {
          id: p.id,
          title: p.title || p.name || 'Collaborative Project',
          subtitle: lastMsg ? `${lastMsg.senderName}: ${lastMsg.text}` : p.subject ? `${p.subject} workspace` : 'Live project collaboration.',
          type: 'group',
          category: 'collaboration',
          members: `${p.collaborators?.length || 3} Collaborators`,
          messages: pMsgs,
          lastActive: lastMsg?.createdAt || 0
        });
      }
    });

    // D. Direct chat threads (one per contact)
    contacts.forEach(contact => {
      if (contact.id === currentUserId || contact.email === currentUserEmail) return;
      
      const directId = directIdFor(contact.id);
      const directMsgs = allMessages.filter(m => 
        (m.threadId === directId) ||
        (m.senderId === currentUserId && m.recipientId === contact.id) ||
        (m.senderId === contact.id && m.recipientId === currentUserId) ||
        (m.senderEmail && contact.email && (
          (m.senderEmail === currentUserEmail && m.recipientId === contact.email) ||
          (m.senderEmail === contact.email && m.recipientId === currentUserEmail)
        )) ||
        (!m.isSelf && (m.senderId === contact.id || m.senderName === contact.name) && (m.threadId?.startsWith('direct_') || !m.projectId))
      );

      const lastMsg = directMsgs[directMsgs.length - 1];
      const presence = computePresence(contact);

      threadMap.set(directId, {
        id: directId,
        title: contact.name,
        subtitle: lastMsg ? `${lastMsg.isSelf ? 'You: ' : ''}${lastMsg.text}` : `Start a conversation with ${contact.name}`,
        type: 'direct',
        category: 'chat',
        avatar: getAvatarUrl(contact),
        statusText: presence,
        statusType: presence,
        members: `${contact.role || 'Student'} ${contact.grade ? `• ${contact.grade}` : ''}`,
        messages: directMsgs,
        recipientId: contact.id,
        recipientEmail: contact.email,
        lastActive: lastMsg?.createdAt || (directMsgs.length > 0 ? Date.now() : 0)
      });
    });

    const sorted = Array.from(threadMap.values()).sort((a, b) => {
      const aHasMsgs = a.messages.length > 0 ? 1 : 0;
      const bHasMsgs = b.messages.length > 0 ? 1 : 0;
      if (aHasMsgs !== bHasMsgs) return bHasMsgs - aHasMsgs;
      return (b.lastActive || 0) - (a.lastActive || 0);
    });

    return sorted;
  }, [allMessages, dbGroups, dbProjects, contacts, currentUserId, currentUserEmail]);

  const activeThread = useMemo(() => {
    return threads.find(t => t.id === activeThreadId) || threads[0] || {
      id: 'general-hub',
      title: 'General Classroom Hub',
      subtitle: 'No conversations yet.',
      type: 'group',
      messages: []
    } as ChatThread;
  }, [threads, activeThreadId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeThread?.messages?.length, activeThreadId]);

  // Send real message to Firestore and local state
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const msgText = inputText.trim();
    setInputText('');

    const msgId = 'msg_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const collectionName = activeThread.type === 'group' 
      ? (activeThread.id === 'general-hub' ? 'messages' : 'communicator_messages')
      : 'direct_messages';

    const newMessage: ChatMessage = {
      id: msgId,
      senderId: currentUserId,
      senderEmail: currentUserEmail,
      senderName: currentUserName,
      senderAvatar: currentUserPhoto,
      timestamp: timeStr,
      createdAt: Date.now(),
      text: msgText,
      isSelf: true,
      collection: collectionName
    };

    if (activeThread.type === 'group') {
      newMessage.projectId = activeThread.id;
    } else {
      newMessage.threadId = activeThread.id;
      newMessage.recipientId = activeThread.recipientId || '';
    }

    // Immediate local optimistic update
    setAllMessages(prev => {
      const updated = [...prev, newMessage];
      try {
        localStorage.setItem('eduai_all_messages', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Write to Firestore
    if (db) {
      try {
        await setDoc(doc(db, collectionName, msgId), {
          ...newMessage,
          createdAt: serverTimestamp()
        });
        try {
          await fetch('/api/notifications/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `New message from ${currentUserName}`,
              body: msgText,
              url: '/messenger',
              userId: activeThread.recipientId || ''
            })
          });
        } catch (e) {
          console.error('Failed to trigger push notification', e);
        }
      } catch (err) {
        console.error("Error sending message to database:", err);
      }
    }
  };

  // Delete a chat / collaboration thread and its messages
  const handleDeleteThread = async (thread: ChatThread) => {
    if (thread.id === 'general-hub') {
      window.alert('The General Classroom Hub is a shared channel and cannot be deleted.');
      return;
    }
    const ok = window.confirm(`Delete "${thread.title}"? This permanently removes the conversation and its messages.`);
    if (!ok) return;

    // Local optimistic removal
    setDeletedThreadIds(prev => new Set(prev).add(thread.id));

    const ids = new Set(thread.messages.map(m => m.id));
    setAllMessages(prev => {
      const updated = prev.filter(m => !ids.has(m.id));
      try { localStorage.setItem('eduai_all_messages', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    if (activeThreadId === thread.id) {
      setActiveThreadId('general-hub');
    }

    // Best-effort Firestore cleanup
    if (db) {
      for (const m of thread.messages) {
        const coll = m.collection || (thread.type === 'group' ? 'communicator_messages' : 'direct_messages');
        try { await deleteDoc(doc(db, coll, m.id)); } catch (e) { /* ignore */ }
      }
      if (thread.type === 'group' && thread.category === 'chat') {
        try { await deleteDoc(doc(db, 'study_groups', thread.id)); } catch (e) { /* ignore */ }
      }
      if (thread.category === 'collaboration') {
        try { await deleteDoc(doc(db, 'collaborative_projects', thread.id)); } catch (e) { /* ignore */ }
      }
    }
  };

  const handleRefreshChats = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const matchesSearch = (s: string) => !searchQuery || s.toLowerCase().includes(searchQuery.toLowerCase());

  // Section lists
  const generalThread = threads.find(t => t.id === 'general-hub');
  const chatThreads = threads.filter(t =>
    t.category !== 'collaboration' &&
    t.id !== 'general-hub' &&
    t.messages.length > 0 &&
    !deletedThreadIds.has(t.id)
  );
  const collabThreads = threads.filter(t => t.category === 'collaboration' && !deletedThreadIds.has(t.id));
  const visibleContacts = contacts.filter(c => !deletedThreadIds.has(directIdFor(c.id)));

  // Filtered by search within each section
  const filteredChats = chatThreads.filter(t => matchesSearch(t.title) || matchesSearch(t.subtitle));
  const filteredCollabs = collabThreads.filter(t => matchesSearch(t.title) || matchesSearch(t.subtitle));
  const filteredContacts = visibleContacts.filter(c => matchesSearch(c.name) || matchesSearch(c.email));

  const renderThreadItem = (thread: ChatThread) => {
    const isActive = thread.id === activeThreadId;
    const presence: Presence | null =
      thread.type === 'direct' && thread.statusType && ['online', 'inactive', 'offline'].includes(thread.statusType)
        ? (thread.statusType as Presence)
        : null;
    return (
      <button
        key={thread.id}
        onClick={() => { setActiveThreadId(thread.id); setMobileShowChat(true); }}
        className={`w-full text-left p-3 rounded-2xl transition-all flex items-center gap-3 relative cursor-pointer group ${
          isActive
            ? 'bg-[#1a142c] border border-pink-500/30 shadow-[0_4px_20px_rgba(236,72,153,0.15)]'
            : 'bg-transparent hover:bg-white/[0.04] border border-transparent'
        }`}
      >
        {isActive && (
          <div className="absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-pink-500 to-purple-500 rounded-r-full" />
        )}

        <div className="relative shrink-0">
          {thread.type === 'group' ? (
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-900/60 via-purple-900/60 to-slate-800 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-inner">
              <Users size={18} />
            </div>
          ) : (
            <img 
              src={thread.avatar || getAvatarUrl({ name: thread.title })} 
              alt={thread.title} 
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-white/15 shadow-inner bg-slate-800"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(thread.title)}&backgroundColor=1e293b`;
              }}
            />
          )}
          {presence && (
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${PRESENCE_META[presence].dot} border-2 border-[#0c1024]`} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h4 className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
              {thread.title}
            </h4>
            {thread.statusType === 'unread' && thread.unreadCount ? (
              <span className="shrink-0 bg-pink-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">
                {thread.unreadCount}
              </span>
            ) : presence ? (
              <PresenceBadge presence={presence} />
            ) : null}
          </div>
          <p className={`text-xs truncate ${isActive ? 'text-slate-300 font-medium' : 'text-slate-400 font-normal'}`}>
            {thread.subtitle}
          </p>
        </div>

        {/* Delete button (revealed on hover) */}
        <span
          role="button"
          tabIndex={0}
          title="Delete chat"
          onClick={(e) => { e.stopPropagation(); handleDeleteThread(thread); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleDeleteThread(thread); } }}
          className="shrink-0 p-1.5 rounded-lg text-slate-500 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
        >
          <Trash2 size={15} />
        </span>
      </button>
    );
  };

  const renderContactItem = (contact: UserContact) => {
    const presence = computePresence(contact);
    const directId = directIdFor(contact.id);
    const isActive = activeThreadId === directId;
    return (
      <button
        key={contact.id}
        onClick={() => { setActiveThreadId(directId); setMobileShowChat(true); }}
        className={`w-full text-left p-3 rounded-2xl transition-all flex items-center gap-3 relative cursor-pointer group ${
          isActive
            ? 'bg-[#1a142c] border border-pink-500/30'
            : 'bg-transparent hover:bg-white/[0.04] border border-transparent'
        }`}
      >
        <div className="relative shrink-0">
          <img
            src={contact.photoUrl || getAvatarUrl(contact)}
            alt={contact.name}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full object-cover border border-white/15 shadow-inner bg-slate-800"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(contact.name)}&backgroundColor=1e293b`;
            }}
          />
          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${PRESENCE_META[presence].dot} border-2 border-[#0c1024]`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h4 className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
              {contact.name}
            </h4>
            <PresenceBadge presence={presence} />
          </div>
          <p className="text-xs text-slate-400 truncate">
            {contact.role || 'Member'} {contact.grade ? `• ${contact.grade}` : ''}
          </p>
        </div>
      </button>
    );
  };

  const activeThreadPresence: Presence | null =
    activeThread.type === 'direct' && activeThread.statusType && ['online', 'inactive', 'offline'].includes(activeThread.statusType)
      ? (activeThread.statusType as Presence)
      : null;

  return (
    <div className="full-bleed-page w-full h-full min-h-0 p-1 sm:p-1 lg:p-2">
      <div className="w-full h-full min-h-0 overflow-hidden bg-[#0c1024] rounded-2xl flex flex-col md:flex-row relative">
      
      {/* LEFT PANEL: Chats / Collaborations / Contacts */}
      <div className={`w-full ${isSidebarCollapsed ? 'md:w-20' : 'md:w-80 xl:w-96'} shrink-0 bg-[#141a2e] border-r border-cyan-500/10 p-3 sm:p-4 flex flex-col shadow-xl relative overflow-hidden z-10 min-h-0 h-full transition-all duration-300 ${
        mobileShowChat ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {!isSidebarCollapsed && <h2 className="text-lg font-display font-black tracking-tight text-white">Messenger</h2>}
            <button
              type="button"
              onClick={handleRefreshChats}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`}
              title="Refresh chats"
            >
              <RefreshCw size={14} />
            </button>
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all ml-1"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>
          {!isSidebarCollapsed && (
            <button 
              type="button" 
              onClick={() => setShowNewChatModal(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer"
              title="Start New Conversation"
            >
              <Plus size={14} />
              <span>New Chat</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        {!isSidebarCollapsed && (
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search chats, collaborations & contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#11162d] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all font-medium"
            />
          </div>
        )}

        {/* Sections */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1">
          {/* Chats (expanded by default) */}
          <SidebarSection
            title={isSidebarCollapsed ? "Chat" : "Chats"}
            count={filteredChats.length + (generalThread && matchesSearch(generalThread.title) ? 1 : 0)}
            open={expandedSections.chats}
            onToggle={() => setExpandedSections(s => ({ ...s, chats: !s.chats }))}
          >
            {generalThread && matchesSearch(generalThread.title) && !deletedThreadIds.has(generalThread.id) && renderThreadItem(generalThread)}
            {filteredChats.length === 0 ? (
              <p className="text-center py-4 text-slate-500 text-[11px]">No chat history yet.</p>
            ) : (
              filteredChats.map(renderThreadItem)
            )}
          </SidebarSection>

          {/* Collaborations (collapsed by default) */}
          <SidebarSection
            title={isSidebarCollapsed ? "Collab" : "Collaborations"}
            count={filteredCollabs.length}
            open={expandedSections.collaborations}
            onToggle={() => setExpandedSections(s => ({ ...s, collaborations: !s.collaborations }))}
          >
            {filteredCollabs.length === 0 ? (
              <p className="text-center py-4 text-slate-500 text-[11px]">No collaborations yet.</p>
            ) : (
              filteredCollabs.map(renderThreadItem)
            )}
          </SidebarSection>

          {/* Contacts (collapsed by default) */}
          <SidebarSection
            title={isSidebarCollapsed ? "Contacts" : "Contacts"}
            count={filteredContacts.length}
            open={expandedSections.contacts}
            onToggle={() => setExpandedSections(s => ({ ...s, contacts: !s.contacts }))}
          >
            {filteredContacts.length === 0 ? (
              <p className="text-center py-4 text-slate-500 text-[11px]">No contacts found.</p>
            ) : (
              filteredContacts.map(renderContactItem)
            )}
          </SidebarSection>
        </div>
      </div>

      {/* RIGHT PANEL: Active Chat Stream */}
      <div className={`flex-1 bg-[#0c1024] flex flex-col relative overflow-hidden h-full ${
        !mobileShowChat ? 'hidden md:flex' : 'flex'
      }`}>
        
        {/* Top Header Bar */}
        <div className="p-3 sm:p-5 border-b border-white/10 bg-transparent backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {/* Mobile Back Button */}
            <button
              type="button"
              onClick={() => setMobileShowChat(false)}
              className="md:hidden p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:text-white flex items-center gap-1 text-xs font-bold transition-all shrink-0 cursor-pointer"
              title="Back to Conversations"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Chats</span>
            </button>

            <div className="shrink-0">
              {activeThread.type === 'group' ? (
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-cyan-900/60 via-purple-900/60 to-slate-800 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                  <Users size={18} />
                </div>
              ) : (
                <img 
                  src={activeThread.avatar || getAvatarUrl({ name: activeThread.title })} 
                  alt={activeThread.title} 
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-white/15 bg-slate-800"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(activeThread.title)}&backgroundColor=1e293b`;
                  }}
                />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-display font-bold text-white truncate">
                  {activeThread.title}
                </h3>
                {activeThreadPresence && <PresenceBadge presence={activeThreadPresence} />}
              </div>
              <p className="text-xs text-slate-400 truncate font-medium">
                {activeThread.members || 'Active conversation channel'}
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                alert(`Starting collaborative workspace session for ${activeThread.title}...`);
              }}
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:opacity-90 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold tracking-wide shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles size={14} className="animate-pulse" />
              <span className="hidden sm:inline">Collaborate on Lesson</span>
              <span className="sm:hidden">Collaborate</span>
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-[radial-gradient(ellipse_at_top,rgba(20,25,50,0.4)_0%,rgba(12,16,36,0)_100%)]">
          {activeThread.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-3 py-16">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mx-auto">
                <MessageSquare size={28} />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-300">No messages yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  You are now connected with {activeThread.title}. Send a message below to begin your conversation!
                </p>
              </div>
            </div>
          ) : (
            activeThread.messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-3.5 max-w-2xl ${msg.isSelf ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {!msg.isSelf && (
                  <img
                    src={msg.senderAvatar || getAvatarUrl({ name: msg.senderName, email: msg.senderEmail, id: msg.senderId })}
                    alt={msg.senderName}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0 shadow-md bg-slate-800"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(msg.senderName)}&backgroundColor=1e293b`;
                    }}
                  />
                )}

                <div className={`space-y-1.5 ${msg.isSelf ? 'text-right' : 'text-left'}`}>
                  <div className="flex items-center gap-2.5 px-1">
                    <span className={`text-xs font-bold ${msg.isSelf ? 'text-pink-400 ml-auto' : 'text-white'}`}>
                      {msg.senderName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {msg.timestamp}
                    </span>
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg ${
                      msg.isSelf
                        ? 'bg-gradient-to-br from-pink-600 to-purple-700 text-white rounded-tr-none border border-pink-400/20'
                        : 'bg-[#161a33] text-slate-200 rounded-tl-none border border-white/10'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {msg.attachment && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-white/10 flex items-center gap-3 max-w-sm">
                        <div className="w-10 h-10 rounded-lg bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 shrink-0">
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <h5 className="text-xs font-bold text-white truncate hover:underline cursor-pointer">
                            {msg.attachment.name}
                          </h5>
                          {msg.attachment.size && (
                            <span className="text-[10px] text-slate-400 uppercase font-mono block">
                              Document • {msg.attachment.size}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}

          {activeThread.typingUser && (
            <div className="flex items-center gap-3 text-slate-400 text-xs italic pl-13 pt-2">
              <div className="flex gap-1 items-center bg-[#161a33] px-3 py-2 rounded-full border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
              </div>
              <span>{activeThread.typingUser}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area */}
        <form onSubmit={handleSendMessage} className="p-4 sm:p-5 border-t border-white/10 bg-transparent backdrop-blur-md">
          <div className="flex items-center gap-2 sm:gap-3 bg-[#13172e] border border-white/10 rounded-2xl px-4 py-2 focus-within:border-pink-500/50 transition-all shadow-inner">
            <button
              type="button"
              onClick={() => {
                const fileName = prompt("Enter file name to attach (e.g. Worksheet_Grade5.pdf):");
                if (fileName) {
                  setInputText(prev => prev ? `${prev} [Attached: ${fileName}]` : `[Attached: ${fileName}]`);
                }
              }}
              className="text-slate-400 hover:text-white transition-colors p-1"
              title="Attach File"
            >
              <Paperclip size={18} />
            </button>
            <button
              type="button"
              onClick={() => setInputText(prev => prev + " 😊")}
              className="text-slate-400 hover:text-white transition-colors p-1"
              title="Insert Emoji"
            >
              <Smile size={18} />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${activeThread.title}...`}
              className="flex-1 bg-transparent border-none text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none px-2 font-medium"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-gradient-to-r from-pink-500 to-purple-600 disabled:opacity-40 hover:opacity-90 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(236,72,153,0.3)] active:scale-95 cursor-pointer shrink-0"
            >
              Send
            </button>
          </div>
        </form>

      </div>

      {/* New Conversation Modal */}
      <AnimatePresence>
        {showNewChatModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0e132b] border border-white/20 rounded-[28px] max-w-lg w-full p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                  <Users className="text-cyan-400" size={20} />
                  <span>Start New Conversation</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-transparent transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Search educators, students, or groups..."
                  value={newChatSearch}
                  onChange={(e) => setNewChatSearch(e.target.value)}
                  className="w-full bg-[#161a33] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
                  autoFocus
                />
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 custom-scrollbar">
                {contacts
                  .filter(c => c.name.toLowerCase().includes(newChatSearch.toLowerCase()) || c.email.toLowerCase().includes(newChatSearch.toLowerCase()))
                  .map(c => {
                    const presence = computePresence(c);
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveThreadId(directIdFor(c.id));
                          setShowNewChatModal(false);
                        }}
                        className="w-full p-3 rounded-xl bg-transparent hover:bg-[#161a33] border border-white/5 hover:border-cyan-500/40 flex items-center gap-3 transition-all text-left cursor-pointer"
                      >
                        <img
                          src={c.photoUrl || getAvatarUrl(c)}
                          alt={c.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border border-white/10 bg-slate-800"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.name)}&backgroundColor=1e293b`;
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{c.name}</h4>
                          <p className="text-[11px] text-slate-400 truncate">
                            {c.role || 'Member'} {c.grade ? `• ${c.grade}` : ''}
                          </p>
                        </div>
                        <PresenceBadge presence={presence} />
                      </button>
                    );
                  })}
                {contacts.length === 0 && (
                  <p className="text-center py-6 text-slate-500 text-xs">No contacts available yet.</p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="px-5 py-2 rounded-xl bg-transparent hover:bg-transparent text-white text-xs font-bold transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div>
    </div>
  );
}
