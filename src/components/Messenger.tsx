import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Search, MessageSquare, Plus, MoreVertical, Phone, Video, Smile, Paperclip } from 'lucide-react';

const MESSAGES = [
  { id: 1, sender: 'Principal Mkhize', text: 'Good morning everyone, just a reminder about the staff meeting at 14:00.', time: '08:15', unread: false },
  { id: 2, sender: 'Mrs. Steyn (Grade 4)', text: 'Can anyone help with the projector in Room 12?', time: '09:30', unread: true },
  { id: 3, sender: 'Department of Education', text: 'New circular regarding CAPS alignment for Term 3. Please review.', time: 'Yesterday', unread: true },
  { id: 4, sender: 'Mr. Jacobs (Sport)', text: 'Great results from the under-13 rugby team today!', time: 'Yesterday', unread: false },
];

export default function Messenger() {
  const [activeChat, setActiveChat] = useState<number | null>(2);
  const [message, setMessage] = useState('');

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#0B1122] rounded-[48px] overflow-hidden border border-white/5 shadow-2xl">
      {/* Sidebar */}
      <div className="w-full md:w-80 border-r border-white/5 flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-hand text-white">Communicator</h2>
            <button className="p-2 hover:bg-white/5 rounded-xl text-brand-cyan transition-all">
              <Plus size={20} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search conversations..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-brand-cyan transition-colors"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {MESSAGES.map((msg) => (
            <button
              key={msg.id}
              onClick={() => setActiveChat(msg.id)}
              className={`w-full text-left p-4 rounded-3xl transition-all group ${
                activeChat === msg.id 
                ? 'bg-brand-cyan/20 border border-brand-cyan/30' 
                : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-sm font-bold ${activeChat === msg.id ? 'text-brand-cyan' : 'text-white'}`}>
                  {msg.sender}
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-black">{msg.time}</span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-1">{msg.text}</p>
              {msg.unread && (
                <div className="mt-2 w-2 h-2 bg-brand-cyan rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0F172A]/50 backdrop-blur-3xl">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="h-20 px-8 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-brand-cyan font-black border border-white/5 shadow-xl">
                  {MESSAGES.find(m => m.id === activeChat)?.sender[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{MESSAGES.find(m => m.id === activeChat)?.sender}</h3>
                  <p className="text-[10px] text-emerald-400 uppercase font-black tracking-widest">Active Now</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <button className="p-2 hover:bg-white/5 rounded-xl hover:text-white transition-all"><Phone size={18} /></button>
                <button className="p-2 hover:bg-white/5 rounded-xl hover:text-white transition-all"><Video size={18} /></button>
                <button className="p-2 hover:bg-white/5 rounded-xl hover:text-white transition-all"><MoreVertical size={18} /></button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              <div className="flex justify-center mb-8">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] bg-white/5 px-4 py-2 rounded-full border border-white/5">
                  Today
                </span>
              </div>
              
              <div className="flex gap-4 max-w-lg">
                <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-[10px] text-brand-cyan font-black border border-white/5">
                   {MESSAGES.find(m => m.id === activeChat)?.sender[0]}
                </div>
                <div className="p-4 rounded-3xl rounded-tl-none bg-white/5 border border-white/10 text-slate-300 text-sm leading-relaxed shadow-xl">
                  {MESSAGES.find(m => m.id === activeChat)?.text}
                </div>
              </div>

              <div className="flex gap-4 max-w-lg ml-auto flex-row-reverse">
                <div className="shrink-0 w-8 h-8 rounded-xl bg-brand-cyan flex items-center justify-center text-[10px] text-navy-dark font-black shadow-lg">
                   Y
                </div>
                <div className="p-4 rounded-3xl rounded-tr-none bg-brand-cyan text-navy-dark text-sm leading-relaxed font-medium shadow-xl shadow-cyan-500/20">
                  I'm on my way to help now. Give me 5 minutes!
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-6 shrink-0 bg-[#0B1122]">
              <div className="relative glass p-2 rounded-[32px] border border-white/10 shadow-2xl flex items-center gap-2">
                <button className="p-3 text-slate-500 hover:text-brand-cyan transition-all"><Smile size={20} /></button>
                <button className="p-3 text-slate-500 hover:text-brand-cyan transition-all"><Paperclip size={20} /></button>
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent border-none focus:outline-none text-white text-sm px-2"
                />
                <button className="bg-brand-cyan hover:bg-cyan-500 text-navy-dark p-4 rounded-3xl shadow-lg shadow-cyan-500/20 transition-all active:scale-90">
                  <Send size={20} />
                </button>
              </div>
            </div>
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
