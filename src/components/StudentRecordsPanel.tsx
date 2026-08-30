import React, { useState, useEffect } from 'react';
import { CalendarCheck, AlertTriangle, ShieldCheck, Plus, Trash2, Loader2 } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export type StudentRecordType = 'attendance' | 'behaviour' | 'welfare';

export interface StudentRecord {
  id?: string;
  studentId: string;
  studentName: string;
  teacherId?: string;
  grade?: string;
  recordType: StudentRecordType;
  // attendance
  status?: 'Present' | 'Late' | 'Absent';
  date?: string; // YYYY-MM-DD
  subject?: string;
  // behaviour
  behaviourType?: 'Positive' | 'Concern' | 'Incident';
  severity?: 'Low' | 'Medium' | 'High';
  behaviour?: string;
  // welfare
  welfareNote?: string;
  createdAt?: any;
}

const todayISO = () => {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
};

export default function StudentRecordsPanel({
  studentId,
  studentName,
  grade,
}: {
  studentId: string;
  studentName: string;
  grade?: string;
}) {
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Attendance form
  const [attendanceStatus, setAttendanceStatus] = useState<'Present' | 'Late' | 'Absent'>('Present');
  const [attendanceDate, setAttendanceDate] = useState(todayISO());
  const [attendanceSubject, setAttendanceSubject] = useState('');

  // Behaviour form
  const [behaviourType, setBehaviourType] = useState<'Positive' | 'Concern' | 'Incident'>('Positive');
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [behaviour, setBehaviour] = useState('');
  const [behaviourDate, setBehaviourDate] = useState(todayISO());

  // Welfare form
  const [welfareNote, setWelfareNote] = useState('');
  const [welfareDate, setWelfareDate] = useState(todayISO());

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  useEffect(() => {
    if (!studentId) return;
    const q = query(collection(db, 'student_records'), where('studentId', '==', studentId));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as StudentRecord[];
      list.sort((a, b) => {
        const ad = a.date || '';
        const bd = b.date || '';
        if (ad !== bd) return bd.localeCompare(ad);
        return new Date(b.createdAt?.toDate?.() || b.createdAt || 0).getTime() - new Date(a.createdAt?.toDate?.() || a.createdAt || 0).getTime();
      });
      setRecords(list);
      setLoading(false);
    }, (err) => {
      console.warn('Student records load err:', err);
      setLoading(false);
    });
    return () => unsub();
  }, [studentId]);

  const addRecord = async (record: StudentRecord) => {
    if (saving) return;
    setSaving(true);
    try {
      const user = auth.currentUser;
      const ref = doc(collection(db, 'student_records'));
      await setDoc(ref, {
        ...record,
        id: ref.id,
        teacherId: user?.uid || '',
        createdAt: serverTimestamp(),
      });
      flash('Record saved & synced to the learner + parent dashboards.');
    } catch (err) {
      console.warn('Save student record err:', err);
      flash('Could not save record — please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAttendance = () => {
    if (!attendanceDate) return;
    addRecord({
      studentId,
      studentName,
      grade,
      recordType: 'attendance',
      status: attendanceStatus,
      date: attendanceDate,
      subject: attendanceSubject || undefined,
    });
  };

  const handleBehaviour = () => {
    if (!behaviour.trim()) return;
    addRecord({
      studentId,
      studentName,
      grade,
      recordType: 'behaviour',
      behaviourType,
      severity,
      behaviour: behaviour.trim(),
      date: behaviourDate,
    });
    setBehaviour('');
  };

  const handleWelfare = () => {
    if (!welfareNote.trim()) return;
    addRecord({
      studentId,
      studentName,
      grade,
      recordType: 'welfare',
      welfareNote: welfareNote.trim(),
      date: welfareDate,
    });
    setWelfareNote('');
  };

  const removeRecord = async (id?: string) => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, 'student_records', id));
    } catch (err) {
      console.warn('Delete student record err:', err);
    }
  };

  const attendance = records.filter(r => r.recordType === 'attendance');
  const present = attendance.filter(r => r.status === 'Present').length;
  const late = attendance.filter(r => r.status === 'Late').length;
  const absent = attendance.filter(r => r.status === 'Absent').length;
  const attendanceRate = attendance.length > 0 ? Math.round(((present + late) / attendance.length) * 100) : 0;
  const behaviourRecords = records.filter(r => r.recordType === 'behaviour');
  const welfareRecords = records.filter(r => r.recordType === 'welfare');

  return (
    <div className="space-y-5 text-white">
      {toast && (
        <div className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">
          {toast}
        </div>
      )}

      {/* Attendance summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-emerald-400">{attendance.length}</p>
          <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Logged</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-brand-purple">{present}</p>
          <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Present</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-yellow-400">{late}</p>
          <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Late</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-rose-400">{absent}</p>
          <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Absent</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attendance Rate</span>
        <div className="h-2 rounded-full overflow-hidden bg-slate-800 grow border border-white/5">
          <div className="h-full bg-gradient-to-r from-emerald-400 to-brand-cyan rounded-full transition-all" style={{ width: `${attendanceRate}%` }} />
        </div>
        <span className="text-xs font-black text-brand-purple">{attendanceRate}%</span>
      </div>

      {/* Attendance entry */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
        <h4 className="text-[11px] font-black text-brand-cyan uppercase tracking-widest flex items-center gap-2">
          <CalendarCheck size={14} /> Log Attendance
        </h4>
        <div className="flex flex-wrap gap-2">
          {(['Present', 'Late', 'Absent'] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setAttendanceStatus(st)}
              className={cn(
                'px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer',
                attendanceStatus === st
                  ? st === 'Present' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : st === 'Late' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
              )}
            >
              {st}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={attendanceDate}
            onChange={e => setAttendanceDate(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan w-full"
          />
          <input
            type="text"
            placeholder="Subject / class (optional)"
            value={attendanceSubject}
            onChange={e => setAttendanceSubject(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan w-full"
          />
        </div>
        <button
          type="button"
          onClick={handleAttendance}
          disabled={saving}
          className="w-full bg-brand-cyan/20 hover:bg-brand-cyan/30 text-brand-cyan border border-brand-cyan/50 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          Save Attendance Mark
        </button>
      </div>

      {/* Behaviour / conduct entry */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
        <h4 className="text-[11px] font-black text-brand-pink uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck size={14} /> Log Behaviour / Conduct
        </h4>
        <div className="flex flex-wrap gap-2">
          {(['Positive', 'Concern', 'Incident'] as const).map(bt => (
            <button
              key={bt}
              type="button"
              onClick={() => setBehaviourType(bt)}
              className={cn(
                'px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer',
                behaviourType === bt
                  ? bt === 'Positive' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : bt === 'Concern' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
              )}
            >
              {bt}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={behaviourDate}
            onChange={e => setBehaviourDate(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan w-full"
          />
          <select
            value={severity}
            onChange={e => setSeverity(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan w-full cursor-pointer [&>option]:bg-slate-900"
          >
            <option value="Low">Low severity</option>
            <option value="Medium">Medium severity</option>
            <option value="High">High severity</option>
          </select>
        </div>
        <textarea
          placeholder="Describe the behaviour or conduct observed..."
          value={behaviour}
          onChange={e => setBehaviour(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-brand-cyan h-20 resize-none"
        />
        <button
          type="button"
          onClick={handleBehaviour}
          disabled={saving || !behaviour.trim()}
          className="w-full bg-brand-pink/20 hover:bg-brand-pink/30 text-brand-pink border border-brand-pink/50 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          Save Behaviour Record
        </button>
      </div>

      {/* Welfare entry */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
        <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
          <AlertTriangle size={14} /> Welfare Note
        </h4>
        <input
          type="date"
          value={welfareDate}
          onChange={e => setWelfareDate(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan w-full"
        />
        <textarea
          placeholder="Capture a welfare / pastoral note for this learner..."
          value={welfareNote}
          onChange={e => setWelfareNote(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-amber-400 h-20 resize-none"
        />
        <button
          type="button"
          onClick={handleWelfare}
          disabled={saving || !welfareNote.trim()}
          className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/50 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          Save Welfare Note
        </button>
      </div>

      {/* History */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Record History ({records.length})</h4>
        {loading ? (
          <div className="text-center py-8 text-slate-500 text-xs flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading records...
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 bg-white/5 border border-dashed border-white/10 rounded-2xl text-slate-400 text-xs">
            No attendance, behaviour or welfare records logged yet.
          </div>
        ) : (
          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
            {records.map((r) => (
              <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.recordType === 'attendance' && (
                      <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full',
                        r.status === 'Present' ? 'bg-emerald-500/15 text-emerald-300' : r.status === 'Late' ? 'bg-yellow-500/15 text-yellow-300' : 'bg-rose-500/15 text-rose-300')}>
                        {r.status}
                      </span>
                    )}
                    {r.recordType === 'behaviour' && (
                      <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full',
                        r.behaviourType === 'Positive' ? 'bg-emerald-500/15 text-emerald-300' : r.behaviourType === 'Concern' ? 'bg-yellow-500/15 text-yellow-300' : 'bg-rose-500/15 text-rose-300')}>
                        {r.behaviourType}
                      </span>
                    )}
                    {r.recordType === 'welfare' && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">
                        Welfare
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">{r.date || ''}</span>
                    {r.severity && <span className="text-[9px] text-slate-500 font-bold uppercase">{r.severity}</span>}
                    {r.subject && <span className="text-[10px] text-slate-400">{r.subject}</span>}
                  </div>
                  <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
                    {r.recordType === 'attendance' ? `Marked ${r.status}${r.subject ? ` (${r.subject})` : ''}` : r.behaviour || r.welfareNote}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeRecord(r.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                  title="Delete record"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
