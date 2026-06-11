import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Search, MessageSquare, Plus, MoreVertical, Phone, Video, Smile, Paperclip } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { collection, query, onSnapshot, doc, getDoc, addDoc, orderBy, serverTimestamp } from 'firebase/firestore';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

interface Msg {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
  recipientId?: string;
  timestamp?: any;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  isOnline?: boolean;
  role?: string;
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

  // Fetch other registered users
  useEffect(() => {
    const q = collection(db, 'users');
    const unsub = onSnapshot(q, (snapshot) => {
      const loadedUsers: UserProfile[] = [];
      snapshot.forEach(docSnap => {
        if (docSnap.id !== currentUserId) {
           loadedUsers.push({ id: docSnap.id, ...docSnap.data() } as UserProfile);
        }
      });
      setUsers(loadedUsers);
    });
    return () => unsub();
  }, [currentUserId]);

  // Fetch communicator messages involving the current user in real-time
  useEffect(() => {
    if (!currentUserId) return;

    const q = query(
      collection(db, 'communicator_messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const loadedMsgs: Msg[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.senderId === currentUserId || data.recipientId === currentUserId) {
          loadedMsgs.push({ id: docSnap.id, ...data } as Msg);
        }
      });
      setAllMessages(loadedMsgs);
    }, (error) => {
      console.error("Error loading chat messages:", error);
    });

    return () => unsub();
  }, [currentUserId]);

  // Get current active chat's message list
  const activeChatMessages = useMemo(() => {
    if (!activeChat || !currentUserId) return [];
    return allMessages.filter(m => 
      (m.senderId === currentUserId && m.recipientId === activeChat) ||
      (m.senderId === activeChat && m.recipientId === currentUserId)
    );
  }, [allMessages, activeChat, currentUserId]);

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
    // Keys matched with security rule constraints:
    // senderId, senderName, text, createdAt, and recipientId is our 5th key.
    await addDoc(collection(db, 'communicator_messages'), {
      senderId: currentUserId,
      senderName: currentUserName,
      text: text,
      createdAt: serverTimestamp(),
      recipientId: activeChat
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

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#0B1122] rounded-[2rem] lg:rounded-[48px] overflow-hidden border border-white/5 shadow-2xl relative">
      {/* Sidebar */}
      <div className={cn(
        "w-full md:w-80 border-r border-white/5 flex flex-col shrink-0 transition-transform h-full",
        activeChat && "hidden md:flex"
      )}>
        <div className="p-4 lg:p-6 border-b border-white/5">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="text-xl lg:text-2xl font-hand text-white">Communicator</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search educators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-brand-cyan transition-colors"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {sortedUsers.length === 0 && (
             <div className="p-4 text-center text-xs text-slate-500">No connections yet.</div>
          )}
          {sortedUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => setActiveChat(user.id)}
              className={`w-full text-left p-4 rounded-2xl lg:rounded-3xl transition-all flex items-center gap-4 group ${
                activeChat === user.id 
                ? 'bg-brand-cyan/20 border border-brand-cyan/30' 
                : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="shrink-0 w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs text-white font-black border border-white/5 overflow-hidden">
                {user.photoUrl ? <img src={user.photoUrl} alt="" className="w-full h-full object-cover" /> : getInitials(user.name)}
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-bold truncate block ${activeChat === user.id ? 'text-brand-cyan' : 'text-white'}`}>
                    {user.name}
                  </span>
                  {user.role && (
                    <span className={`shrink-0 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                      user.role === 'teacher' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      user.role === 'parent' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      user.role === 'admin' ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30' : 
                      'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {user.role}
                    </span>
                  )}
                </div>
                {(() => {
                  const lastMsg = lastMessageForUser(user.id);
                  if (lastMsg) {
                    const isMe = lastMsg.senderId === currentUserId;
                    return (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-brand-cyan truncate block flex-1">
                          {isMe ? 'You: ' : ''}{lastMsg.text}
                        </span>
                        <span className="shrink-0 text-[8px] text-slate-500 font-mono">
                          {(() => {
                            const dateObj = lastMsg.createdAt?.toDate?.() || lastMsg.timestamp?.toDate?.() || null;
                            return dateObj ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                          })()}
                        </span>
                      </div>
                    );
                  }
                  return <span className="text-[10px] text-slate-500 truncate block">{user.email}</span>;
                })()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 bg-[#0F172A]/50 backdrop-blur-3xl h-full",
        !activeChat && "hidden md:flex"
      )}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 lg:h-20 px-4 lg:px-8 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 lg:gap-4">
                <button 
                  onClick={() => setActiveChat(null)}
                  className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-slate-800 flex items-center justify-center text-brand-cyan font-black border border-white/5 shadow-xl shrink-0 overflow-hidden">
                  {users.find(u => u.id === activeChat)?.photoUrl ? <img src={users.find(u => u.id === activeChat)?.photoUrl} alt="" className="w-full h-full object-cover" /> : getInitials(getChatName(activeChat))}
                </div>
                <div>
                  <h3 className="text-xs lg:text-sm font-bold text-white truncate max-w-[120px] sm:max-w-[180px]">{getChatName(activeChat)}</h3>
                </div>
              </div>
              <div className="flex items-center gap-1 lg:gap-4 text-slate-400 shrink-0">
                <button className="p-2 hover:bg-white/5 rounded-xl hover:text-white transition-all"><Phone size={16} className="lg:w-[18px] lg:h-[18px]" /></button>
                <button className="p-2 hover:bg-white/5 rounded-xl hover:text-white transition-all"><Video size={16} className="lg:w-[18px] lg:h-[18px]" /></button>
                <button className="p-2 hover:bg-white/5 rounded-xl hover:text-white transition-all"><MoreVertical size={16} className="lg:w-[18px] lg:h-[18px]" /></button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              <div className="flex justify-center mb-8">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] bg-white/5 px-4 py-2 rounded-full border border-white/5">
                  Safe Neural Stream Established
                </span>
              </div>
              
              <AnimatePresence>
                {activeChatMessages.map((m, idx) => {
                   const isMe = m.senderId === currentUserId;
                   const msgTime = m.createdAt || m.timestamp;
                   return (
                     <motion.div 
                       key={m.id || `msg-${idx}`} 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className={`flex gap-4 max-w-lg mb-6 ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                     >
                       {!isMe && (
                         <div className="shrink-0 w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-xs text-brand-cyan font-black border border-white/5 shadow-lg overflow-hidden">
                           {users.find(u => u.id === activeChat)?.photoUrl ? <img src={users.find(u => u.id === activeChat)?.photoUrl} alt="" className="w-full h-full object-cover" /> : getInitials(getChatName(activeChat))}
                         </div>
                       )}
                       
                       <div className={`p-5 rounded-3xl text-sm leading-relaxed shadow-xl backdrop-blur-md ${isMe ? 'bg-brand-cyan text-navy-dark font-bold shadow-cyan-500/20 rounded-tr-none' : 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-none'}`}>
                          {!isMe && <p className="font-bold text-slate-400 text-[10px] uppercase mb-1">{m.senderName || getChatName(activeChat)}</p>}
                          {m.text}
                          <p className={`text-[9px] mt-2 opacity-50 ${isMe ? 'text-right' : 'text-left'}`}>
                             {msgTime ? (typeof msgTime.toDate === 'function' ? msgTime.toDate() : new Date(msgTime.seconds * 1000 || msgTime)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                          </p>
                       </div>
                     </motion.div>
                   );
                })}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-6 shrink-0 bg-[#0B1122]">
              <div className="relative glass p-2 rounded-[32px] border border-white/10 shadow-2xl flex items-center gap-2">
                <button type="button" className="p-3 text-slate-500 hover:text-brand-cyan transition-all"><Smile size={20} /></button>
                <button type="button" className="p-3 text-slate-500 hover:text-brand-cyan transition-all"><Paperclip size={20} /></button>
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent border-none focus:outline-none text-white text-sm px-2"
                />
                <button type="submit" disabled={!message.trim()} className="bg-brand-cyan disabled:opacity-50 hover:bg-cyan-500 text-navy-dark p-4 rounded-3xl shadow-lg shadow-cyan-500/20 transition-all active:scale-90">
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20">
             <MessageSquare size={80} className="text-slate-600 mb-6" />
             <h3 className="text-3xl font-hand text-slate-800">Select a connection</h3>
             <p className="text-slate-700 max-w-xs mx-auto font-medium">Start a secure neural stream with another South African educator.</p>
          </div>
        )}
      </div>
    </div>
  );
}
