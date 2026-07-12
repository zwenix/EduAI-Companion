import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, User, Search, MessageSquare, Plus, Phone, Video, Smile, Paperclip, 
  ChevronLeft, ArrowLeft, Check, CheckCheck, AlertCircle, Clock, Trash2 
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { collection, query, onSnapshot, doc, getDoc, addDoc, orderBy, serverTimestamp, where } from 'firebase/firestore';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

interface Msg {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
  recipientId?: string;
  timestamp?: any;
  deliveryStatus?: 'sent' | 'delivered' | 'not_sent'; // Explicit delivery status
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  isOnline?: boolean;
  role?: string;
  status?: 'online' | 'inactive' | 'offline'; // Green, Orange, Grey
}

export default function Messenger() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [allMessages, setAllMessages] = useState<Msg[]>([]);
  const [currentUserName, setCurrentUserName] = useState('Educator');
  const [searchQuery, setSearchQuery] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const currentUserId = auth.currentUser?.uid;

  // Fetch own profile for senderName attribution
  useEffect(() => {
    if (!currentUserId) return;
    getDoc(doc(db, 'users', currentUserId)).then(snap => {
      if (snap.exists() && snap.data().name) {
        setCurrentUserName(snap.data().name);
      } else if (auth.currentUser?.displayName) {
        setCurrentUserName(auth.currentUser.displayName);
      }
    });
  }, [currentUserId]);

  // Fetch other registered users and apply mock status for realism
  useEffect(() => {
    const q = collection(db, 'users');
    const unsub = onSnapshot(q, (snapshot) => {
      const loadedUsers: UserProfile[] = [];
      snapshot.forEach(docSnap => {
        if (docSnap.id !== currentUserId) {
          const data = docSnap.data();
          // Generate a deterministic online/inactive/offline status based on user email or ID
          let userStatus: 'online' | 'inactive' | 'offline' = 'offline';
          const hashCode = docSnap.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          if (hashCode % 3 === 0) userStatus = 'online';
          else if (hashCode % 3 === 1) userStatus = 'inactive';

          loadedUsers.push({ 
            id: docSnap.id, 
            status: userStatus,
            ...data 
          } as UserProfile);
        }
      });
      setUsers(loadedUsers);
    }, (error) => {
      import('../lib/firestoreHelpers').then(({ handleFirestoreError, OperationType }) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      });
    });
    return () => unsub();
  }, [currentUserId]);

  // Fetch communicator messages involving the current user in real-time
  useEffect(() => {
    if (!currentUserId) return;

    let msgsFromMe: Record<string, Msg> = {};
    let msgsToMe: Record<string, Msg> = {};

    const updateCombined = () => {
      const merged = { ...msgsFromMe, ...msgsToMe };
      const loadedMsgs = Object.values(merged).sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
      });
      setAllMessages(loadedMsgs);
    };

    const q1 = query(
      collection(db, 'communicator_messages'),
      where('senderId', '==', currentUserId)
    );
    const q2 = query(
      collection(db, 'communicator_messages'),
      where('recipientId', '==', currentUserId)
    );

    const unsub1 = onSnapshot(q1, (snapshot) => {
      msgsFromMe = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        let delivery: 'sent' | 'delivered' | 'not_sent' = 'delivered';
        if (data.createdAt) {
          const ageSecs = (Date.now() - (data.createdAt.seconds * 1000)) / 1000;
          if (ageSecs < 10) {
            delivery = 'sent';
          }
        }
        msgsFromMe[docSnap.id] = {
          id: docSnap.id,
          deliveryStatus: data.deliveryStatus || delivery,
          ...data
        } as Msg;
      });
      updateCombined();
    }, (error) => {
      import('../lib/firestoreHelpers').then(({ handleFirestoreError, OperationType }) => {
        handleFirestoreError(error, OperationType.GET, 'communicator_messages (sent)');
      });
    });

    const unsub2 = onSnapshot(q2, (snapshot) => {
      msgsToMe = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        let delivery: 'sent' | 'delivered' | 'not_sent' = 'delivered';
        if (data.createdAt) {
          const ageSecs = (Date.now() - (data.createdAt.seconds * 1000)) / 1000;
          if (ageSecs < 10) {
            delivery = 'sent';
          }
        }
        msgsToMe[docSnap.id] = {
          id: docSnap.id,
          deliveryStatus: data.deliveryStatus || delivery,
          ...data
        } as Msg;
      });
      updateCombined();
    }, (error) => {
      import('../lib/firestoreHelpers').then(({ handleFirestoreError, OperationType }) => {
        handleFirestoreError(error, OperationType.GET, 'communicator_messages (received)');
      });
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [currentUserId]);

  // Get current active chat's message list
  const activeChatMessages = useMemo(() => {
    if (!activeChat || !currentUserId) return [];
    return allMessages.filter(m => 
      (m.senderId === currentUserId && m.recipientId === activeChat) ||
      (m.senderId === activeChat && m.recipientId === currentUserId)
    );
  }, [allMessages, activeChat, currentUserId]);

  // Grouping active messages by date separators
  const groupedMessages = useMemo(() => {
    const groups: Record<string, Msg[]> = {};
    activeChatMessages.forEach(m => {
      const msgTime = m.createdAt || m.timestamp;
      let dateKey = 'Today';
      if (msgTime) {
        const dateObj = typeof msgTime.toDate === 'function' 
          ? msgTime.toDate() 
          : new Date(msgTime.seconds * 1000 || msgTime);
        
        const now = new Date();
        const todayStr = now.toDateString();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();
        const msgDateStr = dateObj.toDateString();

        if (msgDateStr === todayStr) {
          dateKey = 'Today';
        } else if (msgDateStr === yesterdayStr) {
          dateKey = 'Yesterday';
        } else {
          dateKey = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        }
      }
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(m);
    });
    return groups;
  }, [activeChatMessages]);

  // Scroll smoothly when active messages or chats change
  useEffect(() => {
    if (activeChatMessages.length > 0) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [activeChatMessages.length, activeChat]);

  const handleSendMessage = async () => {
    if (!message.trim() || !activeChat || !currentUserId) return;
    const text = message;
    setMessage('');
    
    // Save new record to 'communicator_messages' collection
    await addDoc(collection(db, 'communicator_messages'), {
      senderId: currentUserId,
      senderName: currentUserName,
      text: text,
      createdAt: serverTimestamp(),
      recipientId: activeChat,
      deliveryStatus: 'sent' // Initialize with sent
    });
  };

  const getChatName = (uid: string) => {
    return users.find(u => u.id === uid)?.name || 'Unknown User';
  };
  
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n?.[0]).join('').substring(0,2).toUpperCase();
  };

  const filteredUsers = users.filter(u => u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Active chat calculation & sorting
  const lastMessageForUser = (userId: string) => {
    const userMsgs = allMessages.filter(m => 
      (m.senderId === currentUserId && m.recipientId === userId) ||
      (m.senderId === userId && m.recipientId === currentUserId)
    );
    if (userMsgs.length === 0) return null;
    return userMsgs[userMsgs.length - 1];
  };

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const lastA = lastMessageForUser(a.id);
      const lastB = lastMessageForUser(b.id);
      if (lastA && lastB) {
        const timeA = lastA.createdAt?.seconds || lastA.timestamp?.seconds || 0;
        const timeB = lastB.createdAt?.seconds || lastB.timestamp?.seconds || 0;
        return timeB - timeA;
      }
      if (lastA) return -1;
      if (lastB) return 1;
      return 0;
    });
  }, [filteredUsers, allMessages, currentUserId]);

  // 5 MOST RECENT CHATS - FOR HORIZONTAL AVATARS ROW
  const fiveMostRecentUsers = useMemo(() => {
    // Find all users who have at least 1 message exchange
    const chattedUsers = users.filter(u => lastMessageForUser(u.id) !== null);
    
    // Sort them by the absolute newest message timestamp
    const sorted = chattedUsers.sort((a, b) => {
      const lastA = lastMessageForUser(a.id)!;
      const lastB = lastMessageForUser(b.id)!;
      const timeA = lastA.createdAt?.seconds || lastA.timestamp?.seconds || 0;
      const timeB = lastB.createdAt?.seconds || lastB.timestamp?.seconds || 0;
      return timeB - timeA;
    });

    // Take top 5
    return sorted.slice(0, 5);
  }, [users, allMessages, currentUserId]);

  // Active status color helper
  const getStatusColor = (status?: 'online' | 'inactive' | 'offline') => {
    if (status === 'online') return 'bg-emerald-500';
    if (status === 'inactive') return 'bg-amber-500';
    return 'bg-slate-400';
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col lg:flex-row bg-[#070b19] rounded-[2rem] lg:rounded-[48px] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(34,211,238,0.08)] relative text-white">
      
      {/* SIDEBAR: CONTEXT ROW AND USER LIST */}
      <div className={cn(
        "w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col shrink-0 h-[320px] lg:h-full bg-[#070b19]/95 relative z-40",
        activeChat && "hidden lg:flex"
      )}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="text-brand-cyan icon-glow-cyan" size={18} />
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Communicator</h2>
            </div>
          </div>
          
          {/* Glass Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input 
              type="text" 
              placeholder="Search educators & parents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-cyan transition-all"
            />
          </div>
        </div>

        {/* 5 MOST RECENT CHATS ROW */}
        {fiveMostRecentUsers.length > 0 && (
          <div className="px-4 py-3 border-b border-white/10 bg-[#0B1122]/20">
            <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Recent Threads</span>
            <div className="flex items-center gap-3.5 overflow-x-auto py-1 scrollbar-none justify-start">
              {fiveMostRecentUsers.map(u => (
                <button 
                  key={u.id}
                  onClick={() => setActiveChat(u.id)}
                  className="flex flex-col items-center shrink-0 relative focus:outline-none hover:scale-105 transition-transform"
                >
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center text-xs font-black border border-white/10 overflow-hidden shadow-lg">
                      {u.photoUrl ? <img src={u.photoUrl} alt="" className="w-full h-full object-cover" /> : getInitials(u.name)}
                    </div>
                    {/* Live status dot */}
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#070b19] ${getStatusColor(u.status)}`} />
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold max-w-[50px] truncate mt-1">{u.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* SCROLLABLE CONTACTS TILES */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar text-left">
          <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500 px-1.5 py-1">All Connections</span>
          {sortedUsers.length === 0 && (
             <div className="p-6 text-center text-xs text-slate-500 font-bold">No active users found.</div>
          )}
          {sortedUsers.map((user) => {
            const lastMsg = lastMessageForUser(user.id);
            const isSelected = activeChat === user.id;
            return (
              <button
                key={user.id}
                onClick={() => setActiveChat(user.id)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 relative group/item",
                  isSelected 
                    ? 'bg-brand-cyan/10 border-brand-cyan/35 shadow-[0_2px_10px_rgba(34,211,238,0.05)]' 
                    : 'hover:bg-white/[0.03] border-transparent'
                )}
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs text-white font-black border border-white/5 overflow-hidden">
                    {user.photoUrl ? <img src={user.photoUrl} alt="" className="w-full h-full object-cover" /> : getInitials(user.name)}
                  </div>
                  {/* Status dot in master list too */}
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-[#070b19] ${getStatusColor(user.status)}`} />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className={cn(
                      "text-xs font-bold truncate block",
                      isSelected ? 'text-brand-cyan' : 'text-slate-200 group-hover/item:text-white'
                    )}>
                      {user.name}
                    </span>
                    {user.role && (
                      <span className={cn(
                        "shrink-0 text-[8px] font-black uppercase tracking-wider px-1 py-0.5 rounded-md",
                        user.role === 'teacher' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/15' :
                        user.role === 'parent' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/15' :
                        user.role === 'admin' ? 'bg-slate-500/20 text-slate-300 border border-slate-500/15' : 
                        'bg-indigo-500/20 text-indigo-300 border border-indigo-500/15'
                      )}>
                        {user.role}
                      </span>
                    )}
                  </div>
                  {lastMsg ? (
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="text-[10px] text-slate-400 truncate block flex-1 font-medium">
                        {lastMsg.senderId === currentUserId ? 'You: ' : ''}{lastMsg.text}
                      </p>
                      <span className="shrink-0 text-[8px] text-slate-500 font-mono">
                        {(() => {
                          const dateObj = lastMsg.createdAt?.toDate?.() || lastMsg.timestamp?.toDate?.() || null;
                          return dateObj ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                        })()}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 truncate block font-medium">{user.email}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CHAT MESSAGES PANEL AREA */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 bg-[#0a0f21]/45 backdrop-blur-3xl h-full",
        !activeChat && "hidden lg:flex"
      )}>
        {activeChat ? (
          <>
            {/* Header with detailed dynamic status of user */}
            <div className="h-16 lg:h-20 px-4 lg:px-6 bg-[#070b19]/60 border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveChat(null)}
                  className="lg:hidden p-2 -ml-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                  title="Return to conversations list"
                >
                  <ArrowLeft size={16} strokeWidth={2.5} />
                </button>
                <div className="relative shrink-0">
                  <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-slate-800 flex items-center justify-center text-brand-cyan font-black border border-white/10 shadow-lg overflow-hidden">
                    {users.find(u => u.id === activeChat)?.photoUrl ? <img src={users.find(u => u.id === activeChat)?.photoUrl} alt="" className="w-full h-full object-cover" /> : getInitials(getChatName(activeChat))}
                  </div>
                  {/* Status Indicator */}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#070b19] ${getStatusColor(users.find(u => u.id === activeChat)?.status)}`} />
                </div>
                <div className="text-left">
                  <h3 className="text-xs lg:text-sm font-black text-white truncate max-w-[140px] sm:max-w-[200px]">{getChatName(activeChat)}</h3>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-0.5 flex items-center gap-1.5">
                    {(() => {
                      const stat = users.find(u => u.id === activeChat)?.status;
                      if (stat === 'online') return <><span className="text-emerald-400 font-bold">Active now</span></>;
                      if (stat === 'inactive') return <><span className="text-amber-400 font-bold">Inactive</span></>;
                      return <><span className="text-slate-500 font-bold">Offline</span></>;
                    })()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-400 shrink-0">
                <button className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white rounded-xl transition-all" title="Call"><Phone size={14} /></button>
                <button className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white rounded-xl transition-all" title="Video call"><Video size={14} /></button>
              </div>
            </div>

            {/* CHAT MESSAGES MAIN AREA WITH CHRONOLOGICAL DATE GROUPINGS */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 custom-scrollbar text-left bg-gradient-to-b from-transparent to-[#070b19]/20">
              
              {Object.entries(groupedMessages).map(([dateSeparator, list]) => (
                <div key={dateSeparator} className="space-y-4">
                  {/* Floating glass date banner */}
                  <div className="flex justify-center my-4">
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest bg-white/5 border border-white/5 px-3 py-1 rounded-full shadow-sm">
                      {dateSeparator}
                    </span>
                  </div>

                  {list.map((m, idx) => {
                     const isMe = m.senderId === currentUserId;
                     const msgTime = m.createdAt || m.timestamp;
                     return (
                       <div 
                         key={m.id || `msg-${idx}`} 
                         className={`flex gap-3 max-w-[85%] lg:max-w-[75%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                       >
                         {!isMe && (
                           <div className="shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs text-brand-cyan font-black border border-white/5 shadow-md overflow-hidden self-end">
                             {users.find(u => u.id === activeChat)?.photoUrl ? <img src={users.find(u => u.id === activeChat)?.photoUrl} alt="" className="w-full h-full object-cover" /> : getInitials(getChatName(activeChat))}
                           </div>
                         )}
                         
                         <div className={`p-4 rounded-2xl text-xs lg:text-sm leading-relaxed shadow-lg relative ${
                           isMe 
                             ? 'bg-brand-cyan/20 border border-brand-cyan/40 shadow-[0_0_15px_rgba(34,211,238,0.12)] text-white rounded-br-[2px]' 
                             : 'bg-white/5 border border-white/10 text-slate-200 rounded-bl-[2px]'
                         }`}>
                            {!isMe && <p className="font-black text-brand-cyan text-[8px] uppercase tracking-wider mb-1">{m.senderName || getChatName(activeChat)}</p>}
                            <p className="whitespace-pre-wrap font-sans font-medium">{m.text}</p>
                            
                            {/* Time and delivery symbols details row */}
                            <div className="flex items-center justify-end gap-1 mt-2.5 opacity-50">
                               <span className="text-[8px] font-mono tracking-wide">
                                  {msgTime ? (typeof msgTime.toDate === 'function' ? msgTime.toDate() : new Date(msgTime.seconds * 1000 || msgTime)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                               </span>
                               
                               {/* Delivery Symbols requested (sent, delivered, not_sent) */}
                               {isMe && (
                                 <span className="ml-1 shrink-0" title={m.deliveryStatus || 'delivered'}>
                                   {m.deliveryStatus === 'not_sent' ? (
                                     <div className="flex items-center gap-0.5 text-red-400">
                                       <AlertCircle size={10} strokeWidth={3} />
                                       <span className="text-[7px] font-black uppercase tracking-widest font-sans">Failed</span>
                                     </div>
                                   ) : m.deliveryStatus === 'sent' ? (
                                     <div className="text-cyan-400">
                                       <Check size={10} strokeWidth={3.5} />
                                     </div>
                                   ) : (
                                     <div className="text-brand-cyan">
                                       <CheckCheck size={11} strokeWidth={3} />
                                     </div>
                                   )}
                                 </span>
                               )}
                            </div>
                         </div>
                       </div>
                     );
                  })}
                </div>
              ))}
              
              <div ref={chatEndRef} />
            </div>

            {/* CHAT INPUT AREA */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
              className="p-4 bg-[#070b19]/90 border-t border-white/10 shrink-0"
            >
              <div className="w-full max-w-3xl mx-auto flex items-center gap-2">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-full pl-3 pr-2 py-1.5 flex items-center gap-1.5 focus-within:border-brand-cyan/50 transition-all">
                  <button type="button" className="p-1.5 text-slate-400 hover:text-brand-cyan transition-colors" title="Emojis"><Smile size={16} /></button>
                  <button type="button" className="p-1.5 text-slate-400 hover:text-brand-cyan transition-colors" title="Attach file"><Paperclip size={16} /></button>
                  
                  <input 
                    type="text" 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a professional message..."
                    className="flex-1 bg-transparent border-none focus:outline-none text-white text-xs lg:text-sm px-2 placeholder:text-slate-500"
                  />
                  
                  <button 
                    type="submit" 
                    disabled={!message.trim()} 
                    className="bg-brand-cyan disabled:opacity-40 hover:bg-cyan-500 text-slate-950 p-2 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.25)] transition-all active:scale-95 shrink-0"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </form>
          </>
        ) : (
          /* Empty state */
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
             <div className="w-16 h-16 rounded-full bg-slate-800/40 border border-slate-700/50 flex items-center justify-center text-slate-500 mb-6 shadow-xl animate-pulse">
                <MessageSquare size={28} />
             </div>
             <h3 className="text-lg font-black text-white">Interactive Communicator Hub</h3>
             <p className="text-xs text-slate-400 max-w-xs mx-auto mt-2 leading-relaxed font-sans font-semibold">
                Select an active educator, administrator, or parent connection from the list to launch a safe, real-time message stream.
             </p>
          </div>
        )}
      </div>
    </div>
  );
}
