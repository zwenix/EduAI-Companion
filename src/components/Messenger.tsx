import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, Send, Paperclip, Smile, Sparkles, MoreVertical, 
  Users, User, FileText, Check, CheckCheck, Circle, Clock,
  ArrowLeft, Plus, Image as ImageIcon, MessageSquare, X, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, setDoc, doc, serverTimestamp, where, or } from 'firebase/firestore';

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
  avatar?: string;
  unreadCount?: number;
  statusText?: string;
  statusType?: 'unread' | 'online' | 'normal';
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
}

export default function Messenger() {
  const [activeThreadId, setActiveThreadId] = useState<string>('general-hub');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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

  // 1. Sync real-time data from Firestore
  useEffect(() => {
    if (!db) return;

    // A. Listen to registered users (with Google profile pictures)
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const usersList: UserContact[] = [];
      snap.docs.forEach(d => {
        const data = d.data();
        if (d.id !== currentUserId && data.email !== currentUserEmail) {
          usersList.push({
            id: d.id,
            name: data.name || data.displayName || data.email?.split('@')[0] || 'User',
            email: data.email || '',
            photoUrl: data.photoUrl || data.photoURL || data.avatar || '',
            role: data.role || 'Member'
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
        if (d.id !== currentUserId && data.email !== currentUserEmail) {
          stuList.push({
            id: d.id,
            name: data.name || data.email?.split('@')[0] || 'Student',
            email: data.email || '',
            photoUrl: data.photoUrl || data.photoURL || data.avatar || '',
            role: 'Student',
            grade: data.grade || data.gradeLevel || ''
          });
        }
      });
      setDbUsers(prev => {
        const map = new Map(prev.map(u => [u.email || u.id, u]));
        stuList.forEach(u => {
          if (map.has(u.email || u.id)) {
            const existing = map.get(u.email || u.id)!;
            map.set(u.email || u.id, { ...existing, photoUrl: existing.photoUrl || u.photoUrl, grade: u.grade });
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
      (s) => handleMessagesSnap(s, 'communicator'),
      (err) => console.error("Error loading communicator messages:", err)
    );
    const unsubDirect = onSnapshot(collection(db, 'direct_messages'), (s) => handleMessagesSnap(s, 'direct'), (err) => console.error(err));
    const unsubGen = onSnapshot(collection(db, 'messages'), (s) => handleMessagesSnap(s, 'messages'), (err) => console.error(err));
    const unsubHub = onSnapshot(collection(db, 'messenger_messages'), (s) => handleMessagesSnap(s, 'hub'), (err) => console.error(err));

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

  // Helper to ensure every user has a clear profile picture
  const getAvatarUrl = (userContact?: { photoUrl?: string; email?: string; name?: string; id?: string }) => {
    if (userContact?.photoUrl && (userContact.photoUrl.startsWith('http') || userContact.photoUrl.startsWith('data:'))) {
      return userContact.photoUrl;
    }
    // Try checking if any message from this person had an avatar saved
    const msgWithAvatar = allMessages.find(m => 
      (m.senderId === userContact?.id || m.senderEmail === userContact?.email || m.senderName === userContact?.name) && 
      m.senderAvatar && m.senderAvatar.startsWith('http')
    );
    if (msgWithAvatar?.senderAvatar) {
      return msgWithAvatar.senderAvatar;
    }
    // Clean ui-avatar or dicebear fallback based on email/name
    const seed = userContact?.email || userContact?.name || userContact?.id || 'User';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1e293b`;
  };

  // 2. Build Chat Threads Dynamically (No placeholder dummy threads!)
  const threads = useMemo<ChatThread[]>(() => {
    const threadMap = new Map<string, ChatThread>();

    // A. Create General Classroom Hub (for broadcast / general messages)
    const generalMessages = allMessages.filter(m => !m.projectId && !m.threadId && !m.recipientId && !m.groupId);
    const lastGenMsg = generalMessages[generalMessages.length - 1];
    threadMap.set('general-hub', { recipientId: '', avatar: '', typingUser: '',
      id: 'general-hub',
      title: 'General Classroom Hub',
      subtitle: lastGenMsg ? `${lastGenMsg.senderName}: ${lastGenMsg.text}` : 'School broadcast & community discussion channel.',
      type: 'group',
      statusText: 'online',
      statusType: 'online',
      members: 'All Students & Faculty • EduAI Network',
      messages: generalMessages,
      lastActive: lastGenMsg?.createdAt || 0
    });

    // B. Create Group Threads from study groups & collaborative projects
    dbGroups.forEach(g => {
      const gMsgs = allMessages.filter(m => m.groupId === g.id || m.projectId === g.id || m.threadId === g.id);
      const lastMsg = gMsgs[gMsgs.length - 1];
      threadMap.set(g.id, {
        id: g.id,
        title: g.name || g.title || 'Study Group',
        subtitle: lastMsg ? `${lastMsg.senderName}: ${lastMsg.text}` : g.description || 'Active study group channel.',
        type: 'group',
        members: `${g.members?.length || 4} Members • Group Study`,
        messages: gMsgs,
        lastActive: lastMsg?.createdAt || 0
      });
    });

    dbProjects.forEach(p => {
      if (!threadMap.has(p.id)) {
        const pMsgs = allMessages.filter(m => m.projectId === p.id || m.threadId === p.id);
        const lastMsg = pMsgs[pMsgs.length - 1];
        threadMap.set(p.id, {
          id: p.id,
          title: p.title || p.name || 'Collaborative Project',
          subtitle: lastMsg ? `${lastMsg.senderName}: ${lastMsg.text}` : p.subject ? `${p.subject} workspace` : 'Live project collaboration.',
          type: 'group',
          members: `${p.collaborators?.length || 3} Collaborators`,
          messages: pMsgs,
          lastActive: lastMsg?.createdAt || 0
        });
      }
    });

    // C. Use DB users for comprehensive direct chat list
    const allContacts: UserContact[] = [...dbUsers];

    // Also include any conversation partner found in actual message history!
    allMessages.forEach(m => {
      if (!m.isSelf && m.senderId && m.senderId !== currentUserId) {
        if (!allContacts.some(c => c.id === m.senderId || (c.email && c.email === m.senderEmail))) {
          allContacts.push({
            id: m.senderId,
            name: m.senderName || 'Classmate',
            email: m.senderEmail || '',
            photoUrl: m.senderAvatar || ''
          });
        }
      }
    });

    // Build Direct Chat Threads with Google profile pictures
    allContacts.forEach(contact => {
      if (contact.id === currentUserId || contact.email === currentUserEmail) return;
      
      const directId = `direct_${[currentUserId, contact.id].sort().join('_')}`;
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
      const avatarUrl = getAvatarUrl(contact);

      threadMap.set(directId, {
        id: directId,
        title: contact.name,
        subtitle: lastMsg ? `${lastMsg.isSelf ? 'You: ' : ''}${lastMsg.text}` : `Start a conversation with ${contact.name}`,
        type: 'direct',
        avatar: avatarUrl,
        statusText: 'online',
        statusType: 'online',
        members: `${contact.role || 'Student'} ${contact.grade ? `• ${contact.grade}` : ''}`,
        messages: directMsgs,
        recipientId: contact.id,
        recipientEmail: contact.email,
        lastActive: lastMsg?.createdAt || (directMsgs.length > 0 ? Date.now() : 0)
      });
    });

    // Convert map to array and sort: active threads with messages first, then by last active timestamp
    const sorted = Array.from(threadMap.values()).sort((a, b) => {
      const aHasMsgs = a.messages.length > 0 ? 1 : 0;
      const bHasMsgs = b.messages.length > 0 ? 1 : 0;
      if (aHasMsgs !== bHasMsgs) return bHasMsgs - aHasMsgs;
      return (b.lastActive || 0) - (a.lastActive || 0);
    });

    return sorted;
  }, [allMessages, dbUsers, dbGroups, dbProjects, currentUserId, currentUserEmail]);

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

    const newMessage: ChatMessage = {
      id: msgId,
      senderId: currentUserId,
      senderEmail: currentUserEmail,
      senderName: currentUserName,
      senderAvatar: currentUserPhoto,
      timestamp: timeStr,
      createdAt: Date.now(),
      text: msgText,
      isSelf: true
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
        const collectionName = activeThread.type === 'group' 
          ? (activeThread.id === 'general-hub' ? 'messages' : 'communicator_messages')
          : 'direct_messages';
        
        await setDoc(doc(db, collectionName, msgId), {
          ...newMessage,
          createdAt: serverTimestamp()
        });
        // Trigger push notification
        try {
          await fetch('/api/notifications/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
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

  const handleRefreshChats = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const filteredThreads = threads.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full">
      <div className="w-full overflow-hidden bg-[#0c1024] rounded-2xl flex flex-col md:flex-row relative" style={{ height: 'calc(100dvh - 130px)' }}>
      
      {/* LEFT PANEL: Chats & Groups */}
      <div className="w-full md:w-80 xl:w-96 shrink-0 bg-[#141a2e] border-r border-cyan-500/10 p-5 flex flex-col shadow-xl relative overflow-hidden z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-display font-black tracking-tight text-white">
              Chats & Contacts
            </h2>
            <button
              type="button"
              onClick={handleRefreshChats}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`}
              title="Refresh chats"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          <button 
            type="button" 
            onClick={() => setShowNewChatModal(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer"
            title="Start New Conversation"
          >
            <Plus size={14} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search contacts & past chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#11162d] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all font-medium"
          />
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1 -mr-1">
          {filteredThreads.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
              <p>No conversations found.</p>
            </div>
          ) : (
            filteredThreads.map(thread => {
              const isActive = thread.id === activeThreadId;
              return (
                <button
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center gap-3.5 relative cursor-pointer group ${
                    isActive
                      ? 'bg-[#1a142c] border border-pink-500/30 shadow-[0_4px_20px_rgba(236,72,153,0.15)]'
                      : 'bg-transparent hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  {/* Left active accent line */}
                  {isActive && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-pink-500 to-purple-500 rounded-r-full" />
                  )}

                  {/* Avatar Icon with Google Profile Picture support */}
                  <div className="relative shrink-0">
                    {thread.type === 'group' ? (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-900/60 via-purple-900/60 to-slate-800 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-inner">
                        <Users size={20} />
                      </div>
                    ) : (
                      <img 
                        src={thread.avatar || getAvatarUrl({ name: thread.title })} 
                        alt={thread.title} 
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover border border-white/15 shadow-inner bg-slate-800"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(thread.title)}&backgroundColor=1e293b`;
                        }}
                      />
                    )}
                    {thread.statusType === 'online' && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0c1024]" />
                    )}
                  </div>

                  {/* Conversation Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                        {thread.title}
                      </h4>
                      
                      {/* Status Pill / Indicator */}
                      {thread.statusType === 'unread' && thread.unreadCount ? (
                        <span className="shrink-0 bg-pink-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">
                          {thread.unreadCount}
                        </span>
                      ) : thread.statusType === 'online' ? (
                        <span className="shrink-0 flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          online
                        </span>
                      ) : null}
                    </div>
                    
                    <p className={`text-xs truncate ${isActive ? 'text-slate-300 font-medium' : 'text-slate-400 font-normal'}`}>
                      {thread.subtitle}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Active Chat Stream */}
      <div className="flex-1 bg-[#0c1024] flex flex-col relative overflow-hidden h-full">
        
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-transparent backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="shrink-0">
              {activeThread.type === 'group' ? (
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-900/60 via-purple-900/60 to-slate-800 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                  <Users size={18} />
                </div>
              ) : (
                <img 
                  src={activeThread.avatar || getAvatarUrl({ name: activeThread.title })} 
                  alt={activeThread.title} 
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover border border-white/15 bg-slate-800"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(activeThread.title)}&backgroundColor=1e293b`;
                  }}
                />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-display font-bold text-white truncate">
                {activeThread.title}
              </h3>
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
                  {/* Sender Info */}
                  <div className="flex items-center gap-2.5 px-1">
                    <span className={`text-xs font-bold ${msg.isSelf ? 'text-pink-400 ml-auto' : 'text-white'}`}>
                      {msg.senderName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg ${
                      msg.isSelf
                        ? 'bg-gradient-to-br from-pink-600 to-purple-700 text-white rounded-tr-none border border-pink-400/20'
                        : 'bg-[#161a33] text-slate-200 rounded-tl-none border border-white/10'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Attachment Card (if any) */}
                    {msg.attachment && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-white/10 flex items-center gap-3 max-w-sm">
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

          {/* Typing Indicator */}
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
                {threads
                  .filter(t => t.title.toLowerCase().includes(newChatSearch.toLowerCase()))
                  .map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveThreadId(t.id);
                        setShowNewChatModal(false);
                      }}
                      className="w-full p-3 rounded-xl bg-transparent hover:bg-[#161a33] border border-white/5 hover:border-cyan-500/40 flex items-center gap-3 transition-all text-left cursor-pointer"
                    >
                      <img
                        src={t.avatar || getAvatarUrl({ name: t.title })}
                        alt={t.title}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-white/10 bg-slate-800"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(t.title)}&backgroundColor=1e293b`;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{t.title}</h4>
                        <p className="text-[11px] text-slate-400 truncate">{t.members}</p>
                      </div>
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-1 rounded-lg border border-cyan-500/30">
                        Chat
                      </span>
                    </button>
                  ))}
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

