import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';

export default function NotificationsDropdown({ isDarkMode }: { isDarkMode: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Fetch user notifications
    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', user.uid)
    );
    
    // orderBy('createdAt', 'desc') might require an index, we will sort in JS to avoid index errors for now.
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a: any, b: any) => {
         const tA = a.createdAt?.seconds || 0;
         const tB = b.createdAt?.seconds || 0;
         return tB - tA;
      });
      setNotifications(data);
    });

    return () => unsubscribe();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try { await updateDoc(doc(db, 'notifications', id), { read: true }); } catch (e) {}
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      for (const n of unread) {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      }
    } catch (e) {}
  };

  const deleteNotification = async (id: string) => {
    try { await deleteDoc(doc(db, 'notifications', id)); } catch (e) {}
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full relative ${isDarkMode ? 'bg-white/5 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'} transition-all`}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-[24px] shadow-2xl z-50 overflow-hidden border ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
          <div className={`flex justify-between items-center p-4 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
            <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Notifications</h4>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-brand-cyan hover:underline font-semibold">
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className={`p-8 text-center text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                No notifications yet.
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`p-4 border-b last:border-b-0 flex gap-3 ${!n.read ? (isDarkMode ? 'bg-brand-cyan/5' : 'bg-brand-cyan/5') : ''} ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                  <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${!n.read ? 'bg-brand-cyan' : 'bg-transparent'}`} />
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{n.title}</p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wide">
                      {n.createdAt ? new Date(n.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!n.read && (
                      <button onClick={() => markAsRead(n.id)} className="text-slate-400 hover:text-brand-cyan tooltip" title="Mark as Read">
                        <Check size={14} />
                      </button>
                    )}
                    <button onClick={() => deleteNotification(n.id)} className="text-slate-400 hover:text-rose-500 tooltip" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
