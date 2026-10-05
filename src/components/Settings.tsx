import { NotificationManager, type NotificationSupport } from '../lib/notifications/NotificationManager';
import React, { useState, useEffect } from 'react';
import { 
  Bell, Shield, Key, Moon, Sun, 
  Monitor, Save, AlertCircle, User, CreditCard, 
  Database, Activity, Lock, Mail, Phone, Globe,
  Trash2, Plus, Smartphone, Download, Palette, Link as LinkIcon, Edit2, Camera,
  RefreshCw, Copy, Cpu, HardDrive, Terminal
} from 'lucide-react';
import { IconSettings, IconLogout } from './LocalIcons';
import { useAi } from '../contexts/AiContext';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreHelpers';
import {
  isNativeApp, getPlatform, isAndroidDevice, isWebViewRuntime,
  supportsSystemPrint, isLowMemoryDevice,
} from '../lib/platform';
import { initDB, clearStudyNotes } from '../lib/offlineDB';
import ProfileSettings from './ProfileSettings';
import PasswordSecurity from './PasswordSecurity';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

/** Colour for a diagnostic reading: green good, amber degraded, red broken. */
const diagToneClass = (tone?: string) => {
  switch (tone) {
    case 'ok': return 'text-brand-green';
    case 'warn': return 'text-amber-400';
    case 'bad': return 'text-rose-400';
    default: return 'text-slate-300';
  }
};

/** Expert-only sections revealed by the sidebar's Advanced Mode toggle. */
const ADVANCED_ONLY_TABS = ['diagnostics', 'storage'];

/**
 * Where `/api/*` resolves from. Same-origin (an empty prefix) on web and PWA;
 * a native build needs `VITE_API_BASE_URL` because the APK's WebView serves the
 * bundled assets itself and has no Express server behind a relative path.
 * Mirrors `apiBase()` in src/lib/notifications/androidPush.ts.
 */
const apiBaseForProbes = (): string => {
  const fromEnv = (import.meta as any)?.env?.VITE_API_BASE_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) return fromEnv.replace(/\/+$/, '');
  return '';
};

interface SettingsProps {
  isDarkMode: boolean;
  setIsDarkMode: (dm: boolean) => void;
  onLogout?: () => void;
  onSwitchRole?: () => void;
  onSwitchUser?: () => void;
  isAppInstallable?: boolean;
  installPWAApp?: () => void;
  isAlreadyInstalled?: boolean;
  userRole?: string;
  /** Which subtab to open on mount / when the value changes (e.g. 'security'). */
  initialSection?: string;
}

export default function Settings({ 
  isDarkMode, 
  setIsDarkMode, 
  onLogout, 
  onSwitchRole, 
  onSwitchUser,
  isAppInstallable = false,
  installPWAApp,
  isAlreadyInstalled = false,
  userRole,
  initialSection
}: SettingsProps) {
  const { provider, ocrProvider, ttsProvider, imageProvider, setProvider, setOcrProvider, setTtsProvider, setImageProvider } = useAi();
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  // ── Advanced Mode (progressive disclosure) ─────────────────────────────
  // This state existed from the start but nothing ever read it, so the
  // sidebar's "Advanced Mode" button re-rendered the same page and appeared
  // broken. It now gates two expert-only subtabs — System Diagnostics and
  // Local Data & Cache — and the choice is persisted across reloads.
  const [viewMode, setViewMode] = useState<'dashboard' | 'advanced'>(() => {
    try {
      return localStorage.getItem('eduai_settings_view_mode') === 'advanced' ? 'advanced' : 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  // ── Device notifications ─────────────────────────────────────────────────
  // Real status for the platform we are on: FCM + LocalNotifications inside the
  // Android APK, service-worker Web Push in the browser / installed PWA. The
  // `notifications` flag above is a local preference; this is what the OS will
  // actually let us do.
  const [notifSupport, setNotifSupport] = useState<NotificationSupport | null>(null);
  const [notifBusy, setNotifBusy] = useState(false);
  const [notifMessage, setNotifMessage] = useState<string | null>(null);

  const refreshNotifSupport = () => setNotifSupport(NotificationManager.getSupport());

  useEffect(() => {
    refreshNotifSupport();
    // Re-read after a tab regain focus: the user may have granted permission in
    // Android's system settings while the app was backgrounded.
    const onFocus = () => refreshNotifSupport();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const handleEnableNotifications = async () => {
    setNotifBusy(true);
    setNotifMessage(null);
    const granted = await NotificationManager.requestPermissionExplicitly(auth.currentUser?.uid);
    refreshNotifSupport();
    setNotifBusy(false);
    setNotifMessage(
      granted
        ? 'Notifications are enabled on this device.'
        : 'Permission was not granted. Open Android Settings → Apps → EduAI Companion → Notifications, allow them, then tap Enable again.'
    );
  };

  const handleTestNotification = async () => {
    setNotifBusy(true);
    setNotifMessage(null);
    const shown = await NotificationManager.showNotification(
      'EduAI Companion',
      'Notifications are working on this device. 🎉',
      { url: '/', tab: 'settings', type: 'test' }
    );
    refreshNotifSupport();
    setNotifBusy(false);
    setNotifMessage(
      shown
        ? 'Test notification sent — check your notification shade.'
        : 'Could not display the test notification. Grant permission first.'
    );
  };
  
  // ── System Diagnostics (Advanced Mode) ─────────────────────────────────
  // Everything below is read from the live runtime — platform helpers, the
  // service-worker registration, NotificationManager, the AI context and the
  // Express API. Nothing is mocked, so the panel doubles as the support
  // artifact for "notifications don't work on my device".
  interface DiagRow { label: string; value: string; tone?: 'ok' | 'warn' | 'bad' | 'muted' }
  interface DiagGroup { title: string; icon: any; rows: DiagRow[] }

  const [diagGroups, setDiagGroups] = useState<DiagGroup[] | null>(null);
  const [diagBusy, setDiagBusy] = useState(false);
  const [diagMessage, setDiagMessage] = useState<string | null>(null);

  /** Fetch with a hard timeout so one hung probe cannot stall the panel. */
  const probe = async (url: string, timeoutMs = 4000) => {
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      let json: any = null;
      try { json = await res.json(); } catch { /* non-JSON body */ }
      return { ok: res.ok, status: res.status as number | null, json, ms: Date.now() - started, error: null as string | null };
    } catch (err: any) {
      return {
        ok: false, status: null, json: null, ms: Date.now() - started,
        error: err?.name === 'AbortError' ? `timed out after ${timeoutMs}ms` : (err?.message || 'unreachable'),
      };
    } finally {
      clearTimeout(timer);
    }
  };

  const runDiagnostics = async () => {
    setDiagBusy(true);
    setDiagMessage(null);
    try {
      const support = NotificationManager.getSupport();
      const yesNo = (b: boolean) => (b ? 'Yes' : 'No');
      const native = isNativeApp();

      // Service worker + push subscription (only meaningful on web runtimes).
      let swScript = 'not available';
      let swScope = '—';
      let swState = '—';
      let pushEndpoint = '—';
      if (!native && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          const active = regs.map((r) => r.active).find(Boolean);
          swScript = active
            ? active.scriptURL.replace(location.origin, '') || active.scriptURL
            : regs.length
              ? 'registered, still installing'
              : 'no registration';
          swScope = regs[0]?.scope ? regs[0].scope.replace(location.origin, '') || regs[0].scope : '—';
          swState = active?.state || (regs[0]?.installing ? 'installing' : regs[0]?.waiting ? 'waiting' : 'none');
          if (regs[0]?.pushManager) {
            const sub = await regs[0].pushManager.getSubscription().catch(() => null);
            pushEndpoint = sub?.endpoint ? new URL(sub.endpoint).host : 'no subscription';
          }
        } catch {
          swScript = 'could not read registrations';
        }
      } else if (native) {
        swScript = 'n/a — the APK uses FCM, not a service worker';
        pushEndpoint = 'n/a — FCM token instead';
      }

      // Backend probes. Inside the APK these normally fail (the WebView serves
      // its own bundle), which is itself the useful diagnostic.
      const [health, vapid, fcm] = await Promise.all([
        probe(`${apiBaseForProbes()}/api/health`),
        probe(`${apiBaseForProbes()}/api/notifications/vapid-public-key`),
        probe(`${apiBaseForProbes()}/api/notifications/fcm/status`),
      ]);

      const groups: DiagGroup[] = [
        {
          title: 'Runtime & device',
          icon: Monitor,
          rows: [
            { label: 'Platform', value: native ? `Native app (${getPlatform()})` : 'Web browser', tone: 'ok' },
            { label: 'Android device', value: yesNo(isAndroidDevice()) },
            { label: 'WebView runtime', value: yesNo(isWebViewRuntime()) },
            { label: 'Low-memory profile', value: yesNo(isLowMemoryDevice()), tone: isLowMemoryDevice() ? 'warn' : 'muted' },
            { label: 'System print available', value: yesNo(supportsSystemPrint()), tone: supportsSystemPrint() ? 'ok' : 'muted' },
            { label: 'Network', value: navigator.onLine ? 'Online' : 'Offline', tone: navigator.onLine ? 'ok' : 'bad' },
            {
              label: 'Viewport',
              value: `${Math.round(window.innerWidth)}×${Math.round(window.innerHeight)} @${(window.devicePixelRatio || 1).toFixed(2)}x`,
            },
            {
              label: 'Hardware',
              value: `${navigator.hardwareConcurrency || '?'} cores · ${(navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'memory n/a'}`,
            },
            { label: 'User agent', value: (navigator.userAgent || '').slice(0, 96), tone: 'muted' },
          ],
        },
        {
          title: 'Service worker & push',
          icon: Bell,
          rows: [
            { label: 'Worker script', value: swScript, tone: native ? 'muted' : (swScript === 'no registration' ? 'warn' : 'ok') },
            { label: 'Worker scope', value: swScope, tone: 'muted' },
            { label: 'Worker state', value: swState, tone: swState === 'activated' ? 'ok' : 'muted' },
            { label: 'Push subscription', value: pushEndpoint, tone: pushEndpoint === 'no subscription' ? 'warn' : 'muted' },
            {
              label: 'Notification permission',
              value: support.permission,
              tone: support.permission === 'granted' ? 'ok' : support.permission === 'denied' ? 'bad' : 'warn',
            },
            {
              label: native ? 'FCM registration' : 'Push API available',
              value: native ? (support.fcmRegistered ? 'Token registered' : 'Not registered') : yesNo(support.pushSupported),
              tone: (native ? support.fcmRegistered : support.pushSupported) ? 'ok' : 'warn',
            },
            {
              label: 'Web Push (VAPID)',
              value: vapid.ok
                ? (vapid.json?.enabled ? 'Configured on server' : 'Server has no VAPID keys')
                : `Unreachable${vapid.error ? ` — ${vapid.error}` : ''}`,
              tone: vapid.ok && vapid.json?.enabled ? 'ok' : 'warn',
            },
            {
              label: 'FCM delivery',
              value: fcm.ok
                ? (fcm.json?.enabled
                    ? `Enabled · ${fcm.json?.registeredDevices ?? 0} device(s) · db ${fcm.json?.firestoreDatabaseId || '(default)'}`
                    : 'Server has no Firebase service account')
                : `Unreachable${fcm.error ? ` — ${fcm.error}` : ''}`,
              tone: fcm.ok && fcm.json?.enabled ? 'ok' : 'warn',
            },
          ],
        },
        {
          title: 'AI engines',
          icon: Activity,
          rows: [
            { label: 'Text generation', value: provider || 'unset', tone: 'ok' },
            { label: 'OCR / grading', value: ocrProvider || 'unset' },
            { label: 'Speech (TTS)', value: ttsProvider || 'unset' },
            { label: 'Image generation', value: imageProvider || 'unset' },
          ],
        },
        {
          title: 'Backend API',
          icon: Globe,
          rows: [
            {
              label: 'Resolved base',
              value: apiBaseForProbes() || `${location.origin} (same-origin)`,
              tone: 'muted',
            },
            {
              label: '/api/health',
              value: health.ok ? `ok · ${health.status} · ${health.ms}ms` : `failed${health.error ? ` — ${health.error}` : ` — HTTP ${health.status}`}`,
              tone: health.ok ? 'ok' : 'bad',
            },
            {
              label: 'Reachability',
              value: health.ok
                ? 'Express API reachable from this runtime'
                : native
                  ? 'Expected in the APK — set VITE_API_BASE_URL to reach the hosted API'
                  : 'The API is not reachable; server-backed features will fail',
              tone: health.ok ? 'ok' : native ? 'warn' : 'bad',
            },
          ],
        },
      ];

      setDiagGroups(groups);
      setDiagMessage(null);
    } catch (err: any) {
      setDiagMessage(`Diagnostics failed: ${err?.message || err}`);
    } finally {
      setDiagBusy(false);
    }
  };

  /** Flatten the current report so it can be pasted into a support ticket. */
  const copyDiagnostics = async () => {
    if (!diagGroups) return;
    const lines: string[] = [`EduAI Companion diagnostics — ${new Date().toISOString()}`];
    for (const group of diagGroups) {
      lines.push('', `## ${group.title}`);
      for (const row of group.rows) lines.push(`  ${row.label}: ${row.value}`);
    }
    const text = lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setDiagMessage('Diagnostics copied to the clipboard.');
      return;
    } catch {
      /* Clipboard API is blocked in some WebViews and insecure contexts. */
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setDiagMessage('Diagnostics copied to the clipboard.');
    } catch {
      setDiagMessage('The clipboard is blocked here — select the rows manually instead.');
    }
  };

  // ── Local Data & Cache (Advanced Mode) ─────────────────────────────────
  interface StorageInfo {
    local: { key: string; bytes: number }[];
    localTotalBytes: number;
    caches: { name: string; entries: number }[];
    idbStores: { name: string; count: number }[];
    idbError: string | null;
  }

  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [storageBusy, setStorageBusy] = useState(false);
  const [storageMessage, setStorageMessage] = useState<string | null>(null);

  const scanStorage = async () => {
    setStorageBusy(true);
    setStorageMessage(null);

    const local: { key: string; bytes: number }[] = [];
    try {
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (!key) continue;
        const value = window.localStorage.getItem(key) || '';
        // UTF-16 code units are 2 bytes each — close enough for a maintenance view.
        local.push({ key, bytes: (key.length + value.length) * 2 });
      }
    } catch {
      /* storage is blocked in private mode / some WebViews */
    }
    local.sort((a, b) => b.bytes - a.bytes);

    const cacheList: { name: string; entries: number }[] = [];
    try {
      if ('caches' in window) {
        for (const name of await caches.keys()) {
          const cache = await caches.open(name);
          cacheList.push({ name, entries: (await cache.keys()).length });
        }
      }
    } catch {
      /* Cache Storage unavailable */
    }

    const idbStores: { name: string; count: number }[] = [];
    let idbError: string | null = null;
    try {
      const idb = await initDB();
      for (const store of Array.from(idb.objectStoreNames)) {
        idbStores.push({ name: store, count: await idb.count(store as any) });
      }
    } catch (err: any) {
      idbError = err?.message || 'IndexedDB unavailable';
    }

    setStorageInfo({
      local,
      localTotalBytes: local.reduce((sum, item) => sum + item.bytes, 0),
      caches: cacheList,
      idbStores,
      idbError,
    });
    setStorageBusy(false);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const clearWebCaches = async () => {
    if (!storageInfo?.caches.length) {
      setStorageMessage('There are no service-worker caches to clear.');
      return;
    }
    setStorageBusy(true);
    let removed = 0;
    for (const cache of storageInfo.caches) {
      try { if (await caches.delete(cache.name)) removed += 1; } catch { /* ignore */ }
    }
    await scanStorage();
    setStorageBusy(false);
    setStorageMessage(`Cleared ${removed} cache${removed === 1 ? '' : 's'}. Assets re-download on next use.`);
  };

  const clearOfflineNotes = async () => {
    if (!window.confirm('Delete every offline study note stored on this device? This cannot be undone.')) return;
    setStorageBusy(true);
    try {
      await clearStudyNotes();
      setStorageMessage('Offline study notes cleared.');
    } catch (err: any) {
      setStorageMessage(`Could not clear study notes: ${err?.message || err}`);
    }
    await scanStorage();
    setStorageBusy(false);
  };

  const removeLocalKey = async (key: string) => {
    if (!window.confirm(`Remove "${key}" from this device's local storage?`)) return;
    try {
      window.localStorage.removeItem(key);
      setStorageMessage(`Removed ${key}.`);
    } catch (err: any) {
      setStorageMessage(`Could not remove ${key}: ${err?.message || err}`);
    }
    await scanStorage();
  };

  const updateServiceWorker = async () => {
    if (isNativeApp()) {
      setStorageMessage('Service workers do not run inside the APK.');
      return;
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        setStorageMessage('No service worker is registered yet.');
        return;
      }
      await reg.update();
      setStorageMessage('Asked the browser to check for a newer service worker.');
    } catch (err: any) {
      setStorageMessage(`Update failed: ${err?.message || err}`);
    }
  };

  const [fullName, setFullName] = useState(() => localStorage.getItem('eduai_user_name') || 'Dr. Sarah Mkize');
  const [school, setSchool] = useState(() => localStorage.getItem('eduai_user_school') || 'Houghton Academy');
  const [className, setClassName] = useState(() => localStorage.getItem('eduai_user_class') || '');
  const [phone, setPhone] = useState(() => localStorage.getItem('eduai_user_phone') || '+27 72 000 0000');
  const [jobTitle, setJobTitle] = useState(() => localStorage.getItem('eduai_user_job') || 'Professional Educator');
  const [photoUrl, setPhotoUrl] = useState(() => localStorage.getItem('eduai_user_photo') || '');
  const [profileEmail, setProfileEmail] = useState('');
  
  // Adaptive Learning & Grade Settings
  const [gradeLevel, setGradeLevel] = useState('Grade 10');
  const [learningPreference, setLearningPreference] = useState('Visual');

  // Parents Link child forms
  const [childEmailToLink, setChildEmailToLink] = useState('');
  const [linkMessage, setLinkMessage] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkedChildrenList, setLinkedChildrenList] = useState<any[]>([]);
  
  // Children accessibility preferences controls
  const [dyslexiaTheme, setDyslexiaTheme] = useState(() => localStorage.getItem('eduai_dyslexia') === 'true');
  const [readSpeed, setReadSpeed] = useState(() => Number(localStorage.getItem('eduai_read_speed') || '1.0'));
  const [dyscalculiaHelp, setDyscalculiaHelp] = useState(() => localStorage.getItem('eduai_dyscalculia') === 'true');
  
  const [activeSubTab, setActiveSubTab] = useState(initialSection || 'personal');
  const [isLoading, setIsLoading] = useState(true);

  // Deep-link support: when the app shell asks for a section (e.g. the
  // header profile menu's "Password & Security"), switch to it even if
  // Settings is already mounted.
  useEffect(() => {
    if (!initialSection) return;
    setActiveSubTab(initialSection);
    // Deep-linking to an expert section implies Advanced Mode — otherwise the
    // subtab is not in the menu and the content pane would render nothing.
    if (ADVANCED_ONLY_TABS.includes(initialSection)) {
      setViewMode('advanced');
      try { localStorage.setItem('eduai_settings_view_mode', 'advanced'); } catch { /* ignore */ }
    }
  }, [initialSection]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        setProfileEmail(auth.currentUser.email || '');
        let currentName = auth.currentUser.displayName || fullName;
        let currentPhoto = auth.currentUser.photoURL || photoUrl;
        
        try {
          const docRef = doc(db, 'users', auth.currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.name) currentName = data.name;
            if (data.school) setSchool(data.school);
            if (data.className) setClassName(data.className);
            if (data.phone) setPhone(data.phone);
            if (data.jobTitle) setJobTitle(data.jobTitle);
            if (data.photoUrl) currentPhoto = data.photoUrl;
            if (data.gradeLevel) setGradeLevel(data.gradeLevel);
            if (data.learningPreference) setLearningPreference(data.learningPreference);
            
            // Sync accessibility from DB if keys present
            if (data.dyslexiaTheme !== undefined) {
              setDyslexiaTheme(data.dyslexiaTheme);
              localStorage.setItem('eduai_dyslexia', String(data.dyslexiaTheme));
            }
            if (data.readSpeed !== undefined) {
              setReadSpeed(data.readSpeed);
              localStorage.setItem('eduai_read_speed', String(data.readSpeed));
            }
            if (data.dyscalculiaHelp !== undefined) {
              setDyscalculiaHelp(data.dyscalculiaHelp);
              localStorage.setItem('eduai_dyscalculia', String(data.dyscalculiaHelp));
            }
          }

          // If current role is parent, let's load linked children
          if (userRole === 'parent' || userRole === 'Parent') {
            const childrenQuery = query(
              collection(db, 'students'), 
              where('parentEmail', '==', auth.currentUser.email?.toLowerCase().trim())
            );
            const childrenSnap = await getDocs(childrenQuery);
            const list = childrenSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLinkedChildrenList(list);
          }
        } catch (error) {
          console.error("Error fetching profile", error);
          handleFirestoreError(error, OperationType.GET, 'users/' + auth.currentUser.uid);
        }
        
        setFullName(currentName);
        setPhotoUrl(currentPhoto);
        
        localStorage.setItem('eduai_user_name', currentName || '');
        localStorage.setItem('eduai_user_photo', currentPhoto || '');
      }
      setIsLoading(false);
    }
    fetchProfile();
  }, [userRole]);

  const handleSavePersonal = async () => {
    if (!auth.currentUser) return;
    
    // Optimistic UI updates
    localStorage.setItem('eduai_user_name', fullName);
    localStorage.setItem('eduai_user_school', school);
    localStorage.setItem('eduai_user_class', className);
    localStorage.setItem('eduai_user_phone', phone);
    localStorage.setItem('eduai_user_job', jobTitle);
    localStorage.setItem('eduai_user_photo', photoUrl);
    
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      const userPayload = {
        name: fullName,
        email: profileEmail || auth.currentUser.email || '',
        school: school,
        className: className,
        jobTitle: jobTitle,
        phone: phone,
        photoUrl: photoUrl,
        gradeLevel: gradeLevel,
        learningPreference: learningPreference,
        dyslexiaTheme: dyslexiaTheme,
        readSpeed: readSpeed,
        dyscalculiaHelp: dyscalculiaHelp,
        updatedAt: serverTimestamp()
      };

      if (docSnap.exists()) {
        await updateDoc(docRef, userPayload);
      } else {
        await setDoc(docRef, {
          ...userPayload,
          role: userRole || 'teacher', // fallback role
          createdAt: serverTimestamp()
        });
      }

      // If user is a student/learner, search for their record in 'students' and align it too
      if (userRole === 'student' || userRole === 'learner') {
        const sQuery = query(collection(db, 'students'), where('email', '==', auth.currentUser.email?.toLowerCase().trim()));
        const sSnap = await getDocs(sQuery);
        if (!sSnap.empty) {
          const studentDocId = sSnap.docs[0].id;
          await updateDoc(doc(db, 'students', studentDocId), {
            name: fullName,
            grade: gradeLevel,
            updatedAt: serverTimestamp()
          });
        }
      }

      alert('Personal and Adaptive Profile details saved successfully to Firebase.');
    } catch (error) {
       console.error("Firebase update failed", error);
       alert('Personal details failed to save to Firebase.');
       handleFirestoreError(error, OperationType.WRITE, 'users/' + auth.currentUser.uid);
    }
  };

  const handleLinkChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childEmailToLink.trim() || !auth.currentUser?.email) return;
    setIsLinking(true);
    setLinkMessage('');
    try {
      const emailSearch = childEmailToLink.trim().toLowerCase();
      const q = query(collection(db, 'students'), where('email', '==', emailSearch));
      const sSnap = await getDocs(q);
      
      if (sSnap.empty) {
        // Create an empty template student record linked to key parent so it activates
        const docId = `student_${Date.now()}`;
        await setDoc(doc(db, 'students', docId), {
          id: docId,
          name: childEmailToLink.split('@')[0],
          grade: 'Grade 10',
          email: emailSearch,
          status: 'Active',
          teacherId: 'unassigned',
          parentName: fullName,
          parentEmail: auth.currentUser.email.toLowerCase().trim(),
          parentPhone: phone,
          createdAt: serverTimestamp(),
          subjects: [
            { name: 'Mathematics', mark: 65, termHistory: [55, 60, 65], assessments: [] },
            { name: 'Physical Sciences', mark: 70, termHistory: [60, 65, 70], assessments: [] },
            { name: 'English First Additional Language', mark: 72, termHistory: [68, 70, 72], assessments: [] }
          ]
        });
        setLinkMessage(`A new profile template was created and linked to your parent account for: ${emailSearch}`);
      } else {
        const studentDocId = sSnap.docs[0].id;
        await updateDoc(doc(db, 'students', studentDocId), {
          parentEmail: auth.currentUser.email.toLowerCase().trim(),
          parentName: fullName,
          parentPhone: phone,
          updatedAt: serverTimestamp()
        });
        setLinkMessage(`Successfully linked student profile for: ${emailSearch}!`);
      }
      setChildEmailToLink('');
      // Update list
      const q2 = query(collection(db, 'students'), where('parentEmail', '==', auth.currentUser.email.toLowerCase().trim()));
      const cSnap = await getDocs(q2);
      setLinkedChildrenList(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err: any) {
      console.error("Linking failed", err);
      setLinkMessage(`Failed to link: ${err.message || String(err)}`);
    } finally {
      setIsLinking(false);
    }
  };

  const triggerImageUpload = () => {
    const url = prompt('Enter image URL for profile picture (or leave blank for initials):', photoUrl);
    if (url !== null) {
      setPhotoUrl(url);
    }
  };

  const coreSubTabs = [
    { id: 'personal', label: 'Profile Settings', icon: User },
    { id: 'accessibility', label: 'Accessibility', icon: Palette },
    { id: 'security', label: 'Password & Security', icon: Lock },
    { id: 'ai', label: 'AI Configuration', icon: Activity },
    { id: 'pwa', label: 'Install & Notifications', icon: Bell },
    { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
    { id: 'codebase', label: 'Codebase Spec', icon: Database },
  ];

  const advancedSubTabs = [
    { id: 'diagnostics', label: 'System Diagnostics', icon: Terminal },
    { id: 'storage', label: 'Local Data & Cache', icon: HardDrive },
  ];

  const toggleViewMode = () => {
    const next = viewMode === 'dashboard' ? 'advanced' : 'dashboard';
    setViewMode(next);
    try { localStorage.setItem('eduai_settings_view_mode', next); } catch { /* ignore */ }
    // Leaving Advanced Mode while an expert tab is open would drop it from the
    // menu and blank the content pane, so fall back to the profile section.
    if (next === 'dashboard' && ADVANCED_ONLY_TABS.includes(activeSubTab)) {
      setActiveSubTab('personal');
    }
  };

  // Open an expert tab → read the device once. Manual refresh stays available.
  useEffect(() => {
    if (activeSubTab === 'diagnostics' && !diagGroups && !diagBusy) void runDiagnostics();
    if (activeSubTab === 'storage' && !storageInfo && !storageBusy) void scanStorage();
    // Deliberately keyed on the tab only: re-running on every state change
    // would loop (each scan sets the state this effect reads).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubTab]);

  if (isLoading) {
    return <div className="p-12 text-center text-slate-500">Loading settings...</div>;
  }
  return (
    <div className="full-bleed-page w-full h-full min-h-0 font-sans p-1 sm:p-1 lg:p-2">
      <div className="w-full h-full min-h-0 overflow-hidden bg-[#0c1024] rounded-2xl flex flex-col md:flex-row relative">
        
        {/* LEFT PANEL: Menu */}
        <div className="w-full md:w-64 bg-[#141a2e] border-r border-cyan-500/10 flex flex-col pt-6 pb-6 shadow-xl shrink-0 z-10 text-white">
          <div className="px-6 mb-8 flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-cyan-900/40 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <IconSettings size={20} className="text-cyan-400" />
             </div>
             <div>
                <h2 className="text-cyan-400 font-black tracking-widest text-xs leading-tight uppercase">Settings</h2>
                <p className="text-slate-400 font-bold text-[10px] uppercase">Commander</p>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
            {(() => {
              const renderTab = (tab: { id: string; label: string; icon: any }) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  aria-current={activeSubTab === tab.id ? 'page' : undefined}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-left",
                    activeSubTab === tab.id
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                      : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
                  )}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              );
              return (
                <>
                  {coreSubTabs.map(renderTab)}
                  {viewMode === 'advanced' && (
                    <>
                      <p className="px-4 pt-4 pb-1 text-[9px] font-black uppercase tracking-[0.2em] text-cyan-500/70">
                        Advanced
                      </p>
                      {advancedSubTabs.map(renderTab)}
                    </>
                  )}
                </>
              );
            })()}
          </div>

          <div className="mt-auto px-4 pt-6 space-y-2">
             <button
               type="button"
               onClick={toggleViewMode}
               aria-pressed={viewMode === 'advanced'}
               className={cn(
                 "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border",
                 viewMode === 'advanced'
                   ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300"
                   : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
               )}
             >
                {viewMode === 'advanced' ? <Monitor size={12} /> : <Cpu size={12} />}
                {viewMode === 'dashboard' ? 'Advanced Mode' : 'Dashboard View'}
             </button>
             <p className="text-center text-[9px] font-bold uppercase tracking-wider text-slate-600 leading-relaxed">
                {viewMode === 'advanced' ? 'Diagnostics & local data visible' : 'Expert tools hidden'}
             </p>
          </div>
        </div>

        {/* RIGHT PANEL: Content */}
        <div className="flex-1 bg-[#0c1024] flex flex-col relative overflow-hidden text-slate-100">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar bg-[radial-gradient(ellipse_at_top,rgba(20,25,50,0.4)_0%,rgba(12,16,36,0)_100%)]">
             {activeSubTab === 'personal' && (
                <div id="section-profile" className="space-y-8 animate-in fade-in duration-500">
                   {/* Profile content - keeping original logic but wrapped */}
                   <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                      <div className="relative group">
                         <div className="w-32 h-32 rounded-[40px] overflow-hidden border-2 border-brand-cyan/30 shadow-2xl relative">
                            {photoUrl ? (
                               <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                               <div className="w-full h-full bg-gradient-to-br from-navy-dark to-slate-900 flex items-center justify-center text-4xl font-black text-brand-cyan">
                                  {fullName.split(' ').map(n => n[0]).join('')}
                               </div>
                            )}
                            <button onClick={triggerImageUpload} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold uppercase tracking-widest">
                               Change
                            </button>
                         </div>
                         <div className="absolute -bottom-2 -right-2 bg-brand-cyan text-navy-dark p-2 rounded-xl shadow-lg border border-white/20">
                            <Camera size={16} />
                         </div>
                      </div>
                      <div>
                         <h3 className="text-3xl font-black text-white mb-2">{fullName}</h3>
                         <p className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {userRole} Account • South Africa
                         </p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Full Name</label>
                         <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-brand-cyan transition-all" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">School Name</label>
                         <input type="text" value={school} onChange={(e) => setSchool(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-brand-cyan transition-all" placeholder="e.g. Houghton Primary School" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Class / Grade Taught</label>
                         <input type="text" value={className} onChange={(e) => setClassName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-brand-cyan transition-all" placeholder="e.g. Grade 5B" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Communication Link</label>
                         <input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-brand-cyan transition-all" />
                      </div>
                   </div>

                   <div className="flex justify-end pt-4">
                      <button onClick={handleSavePersonal} className="px-8 py-3 rounded-2xl bg-brand-cyan text-navy-dark font-black text-xs uppercase tracking-widest shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
                         <Save size={14} /> Save Teacher Profile
                      </button>
                   </div>
                </div>
             )}

             {activeSubTab === 'accessibility' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <h2 className="text-3xl font-black text-white">Visual & Accessibility</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="glass p-6 rounded-[32px] border border-white/5 space-y-4">
                         <div className="flex justify-between items-center">
                            <div>
                               <h4 className="font-bold text-white">Environment Theme</h4>
                               <p className="text-xs text-slate-500">Toggle high-contrast dark mode interface.</p>
                            </div>
                            <button onClick={() => setIsDarkMode(!isDarkMode)} className={cn("w-14 h-8 rounded-full relative transition-all duration-300", isDarkMode ? "bg-brand-cyan" : "bg-slate-700")}>
                               <div className={cn("absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300 shadow-md", isDarkMode ? "left-7" : "left-1")} />
                            </button>
                         </div>
                      </div>
                      <div className="glass p-6 rounded-[32px] border border-white/5 space-y-4 opacity-60">
                         <div className="flex justify-between items-center">
                            <div>
                               <h4 className="font-bold text-white">Screen Reader Support</h4>
                               <p className="text-xs text-slate-500">Enable optimized ARIA labels.</p>
                            </div>
                            <button className="w-14 h-8 rounded-full bg-slate-700 relative">
                               <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white/20" />
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
             )}

             {/* Keeping other tabs simpler for now or mapping them if I can find them */}
             {activeSubTab === 'security' && (
                <PasswordSecurity isDarkMode={isDarkMode} />
             )}

             {activeSubTab === 'ai' && (
                <div className="space-y-6">
                   <h2 className="text-3xl font-black text-white">AI Configuration</h2>
                   <div className="p-8 rounded-[40px] border border-white/5 bg-white/5 space-y-6">
                      <div>
                         <h4 className="text-white font-bold text-base mb-1">Text Generation Engine</h4>
                         <p className="text-slate-400 text-xs mb-4">Primary reasoning and lesson authoring engine. Alternative models fall back to Gemini automatically.</p>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-4 rounded-2xl border border-brand-cyan/40 bg-brand-cyan/10 flex items-start gap-3">
                               <div className="w-8 h-8 rounded-xl bg-brand-cyan/20 flex items-center justify-center text-brand-cyan font-black text-xs shrink-0">1</div>
                               <div>
                                  <div className="flex items-center gap-2">
                                     <span className="text-white font-bold text-xs">Gemini 3.8 Flash</span>
                                     <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase">Primary</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-1">Latest GA Flash model · CAPS Lesson Planning, Auto-Grading & Voice Tutor</p>
                               </div>
                            </div>
                            <div className="p-4 rounded-2xl border border-white/10 bg-navy-dark/40 flex items-start gap-3">
                               <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-xs shrink-0">2</div>
                               <div>
                                  <span className="text-white font-bold text-xs">Qwen 3.8 Max</span>
                                  <p className="text-[10px] text-slate-400 mt-1">Alibaba Model Studio (qwen3.8-max) • Fallback: Gemini</p>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="pt-4 border-t border-white/5">
                         <h4 className="text-white font-bold text-base mb-1">Creative Image Generator</h4>
                         <p className="text-slate-400 text-xs mb-4">Pick your preferred image engine. The selected model is tried first; the others form an automatic fallback chain so a blocked provider never leaves blank placeholders.</p>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                              { id: 'perchance', name: 'Perchance AI', tag: 'Primary', dotBg: 'bg-amber-500/20', dotText: 'text-amber-400', activeBorder: 'border-amber-500/40 bg-amber-500/10', desc: 'Fast stylised images · Pollinations / Qwen fallback' },
                              { id: 'qwen', name: 'Qwen-Image (NVIDIA NIM)', tag: 'Premium SA', dotBg: 'bg-orange-500/20', dotText: 'text-orange-400', activeBorder: 'border-orange-500/40 bg-orange-500/10', desc: 'Qwen-Image via NVIDIA NIM · SA-context, superior text rendering' },
                              { id: 'gemini-imagen', name: 'Google Imagen 3', tag: 'Secondary', dotBg: 'bg-sky-500/20', dotText: 'text-sky-400', activeBorder: 'border-sky-500/40 bg-sky-500/10', desc: 'Google Imagen / Gemini · Pollinations fallback' },
                              { id: 'pollinations', name: 'Pollinations AI', tag: 'Fallback', dotBg: 'bg-pink-500/20', dotText: 'text-pink-400', activeBorder: 'border-pink-500/40 bg-pink-500/10', desc: 'Free open-source flux/turbo models' },
                            ].map((opt: any) => {
                              const isSel = imageProvider === opt.id || (opt.id === 'qwen' && imageProvider === 'qwen-image');
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => setImageProvider(opt.id)}
                                  className={`p-4 rounded-2xl border flex items-start gap-3 text-left transition-all cursor-pointer ${isSel ? opt.activeBorder : 'border-white/10 bg-[#0a1226]/60 hover:border-white/25'}`}
                                >
                                   <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${isSel ? opt.dotBg : 'bg-white/5'} ${isSel ? opt.dotText : 'text-slate-500'}`}>
                                      {isSel ? '✓' : '○'}
                                   </div>
                                   <div className="flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                         <span className="text-white font-bold text-xs">{opt.name}</span>
                                         <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase ${isSel ? `${opt.dotBg} ${opt.dotText}` : 'bg-white/10 text-slate-400'}`}>{opt.tag}</span>
                                      </div>
                                      <p className="text-[10px] text-slate-400 mt-1">{opt.desc}</p>
                                   </div>
                                </button>
                              );
                            })}
                         </div>
                         <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
                            <strong className="text-cyan-400">Qwen-Image (NVIDIA NIM)</strong> uses <code className="font-mono text-cyan-300">qwen/qwen-image</code> on NVIDIA's hosted inference endpoint and produces premium SA-context enhanced educational illustrations with better text rendering and cultural accuracy.
                         </p>
                      </div>
                   </div>
                </div>
             )}

             {activeSubTab === 'pwa' && (
                <div id="section-notifications" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <h2 className="text-3xl font-black text-white">Install &amp; Device Notifications</h2>

                   {/* Notification status */}
                   <div className="glass p-6 rounded-[32px] border border-white/5 space-y-5">
                      <div className="flex items-start justify-between gap-4">
                         <div className="min-w-0">
                            <h4 className="font-bold text-white flex items-center gap-2">
                               <Bell size={16} className="text-brand-cyan" />
                               Push notifications
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                               {notifSupport?.platform === 'native'
                                  ? 'Android app — delivered through Firebase Cloud Messaging and shown in the system notification shade.'
                                  : 'Browser / installed PWA — delivered through a service worker subscription.'}
                            </p>
                         </div>
                         <span className={cn(
                            "shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border",
                            notifSupport?.canNotify
                               ? "bg-brand-green/15 border-brand-green/40 text-brand-green"
                               : "bg-amber-500/10 border-amber-500/40 text-amber-400"
                         )}>
                            {notifSupport?.canNotify ? 'Enabled' : (notifSupport?.permission || 'Unknown')}
                         </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                         <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Platform: <span className="text-white normal-case tracking-normal">{notifSupport?.platform === 'native' ? `Native (${NotificationManager.getPlatform()})` : 'Web'}</span>
                         </div>
                         <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {notifSupport?.platform === 'native' ? 'FCM token' : 'Push API'}:{' '}
                            <span className="text-white normal-case tracking-normal">
                               {notifSupport?.platform === 'native'
                                  ? (notifSupport?.fcmRegistered ? 'Registered' : 'Not registered')
                                  : (notifSupport?.pushSupported ? 'Supported' : 'Unavailable')}
                            </span>
                         </div>
                         <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Server delivery:{' '}
                            <span className="text-white normal-case tracking-normal">
                               {notifSupport?.platform === 'native' || notifSupport?.serverPushEnabled === null
                                  ? 'See ANDROID_PUSH_SETUP.md'
                                  : (notifSupport?.serverPushEnabled ? 'Configured' : 'VAPID keys missing')}
                            </span>
                         </div>
                      </div>

                      {notifSupport?.detail && (
                         <p className="text-xs text-slate-400 leading-relaxed border-l-2 border-brand-cyan/40 pl-3">
                            {notifSupport.detail}
                         </p>
                      )}

                      {notifMessage && (
                         <div className="flex items-start gap-2 rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 p-3 text-xs font-medium text-slate-200">
                            <AlertCircle size={14} className="mt-0.5 shrink-0 text-brand-cyan" />
                            <span>{notifMessage}</span>
                         </div>
                      )}

                      <div className="flex flex-wrap gap-3 pt-1">
                         <button
                            type="button"
                            onClick={handleEnableNotifications}
                            disabled={notifBusy}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-cyan hover:bg-brand-cyan/80 text-slate-950 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                         >
                            <Bell size={14} />
                            {notifBusy ? 'Working…' : 'Enable notifications'}
                         </button>
                         <button
                            type="button"
                            onClick={handleTestNotification}
                            disabled={notifBusy}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                         >
                            <Activity size={14} className="text-brand-cyan" />
                            Send test notification
                         </button>
                         <button
                            type="button"
                            onClick={refreshNotifSupport}
                            disabled={notifBusy}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                         >
                            Refresh status
                         </button>
                      </div>
                   </div>

                   {/* PWA install */}
                   <div className="glass p-6 rounded-[32px] border border-white/5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                         <div className="min-w-0">
                            <h4 className="font-bold text-white flex items-center gap-2">
                               <Smartphone size={16} className="text-brand-cyan" />
                               Install as an app
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                               Add EduAI Companion to your home screen for full-screen access and offline worksheets.
                               On Android the dedicated APK already ships with native push support.
                            </p>
                         </div>
                         {isAlreadyInstalled ? (
                            <span className="shrink-0 rounded-full border border-brand-green/40 bg-brand-green/15 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-brand-green">
                               Installed
                            </span>
                         ) : (
                            <button
                               type="button"
                               onClick={() => installPWAApp?.()}
                               disabled={!isAppInstallable}
                               className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
                            >
                               <Download size={14} className="text-brand-cyan" />
                               Install app
                            </button>
                         )}
                      </div>
                   </div>
                </div>
             )}

             {/* ── Advanced Mode: System Diagnostics ─────────────────────── */}
             {activeSubTab === 'diagnostics' && (
                <div id="section-diagnostics" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="flex flex-wrap items-end justify-between gap-4">
                      <div className="min-w-0">
                         <h2 className="text-3xl font-black text-white">System Diagnostics</h2>
                         <p className="text-xs text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
                            Live readings from this device — runtime, service worker, push transport, AI engines and
                            API reachability. Copy the report into a support ticket when something misbehaves.
                         </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                         <button
                            type="button"
                            onClick={runDiagnostics}
                            disabled={diagBusy}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-cyan hover:bg-brand-cyan/80 text-slate-950 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 cursor-pointer"
                         >
                            <RefreshCw size={13} className={diagBusy ? 'animate-spin' : ''} />
                            {diagBusy ? 'Scanning…' : 'Run diagnostics'}
                         </button>
                         <button
                            type="button"
                            onClick={copyDiagnostics}
                            disabled={!diagGroups || diagBusy}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 cursor-pointer"
                         >
                            <Copy size={13} className="text-brand-cyan" />
                            Copy report
                         </button>
                      </div>
                   </div>

                   {diagMessage && (
                      <div className="flex items-start gap-2 rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 p-3 text-xs font-medium text-slate-200">
                         <AlertCircle size={14} className="mt-0.5 shrink-0 text-brand-cyan" />
                         <span>{diagMessage}</span>
                      </div>
                   )}

                   {!diagGroups && !diagBusy ? (
                      <div className="glass p-12 rounded-[32px] border border-white/5 text-center">
                         <Terminal size={30} className="mx-auto text-slate-600 mb-3" />
                         <p className="text-sm text-slate-400 font-medium">Run diagnostics to read this device's live state.</p>
                      </div>
                   ) : (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                         {(diagGroups || []).map(group => (
                            <div key={group.title} className="glass p-5 rounded-[28px] border border-white/5">
                               <h4 className="flex items-center gap-2.5 font-bold text-white text-sm mb-3 pb-2.5 border-b border-white/5">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                                     <group.icon size={14} />
                                  </span>
                                  {group.title}
                               </h4>
                               <dl className="space-y-2.5">
                                  {group.rows.map(row => (
                                     <div key={row.label} className="flex items-start justify-between gap-4">
                                        <dt className="shrink-0 pt-0.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                           {row.label}
                                        </dt>
                                        <dd className={cn("min-w-0 break-words text-right text-xs font-medium", diagToneClass(row.tone))}>
                                           {row.value}
                                        </dd>
                                     </div>
                                  ))}
                               </dl>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             )}

             {/* ── Advanced Mode: Local Data & Cache ─────────────────────── */}
             {activeSubTab === 'storage' && (
                <div id="section-storage" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="flex flex-wrap items-end justify-between gap-4">
                      <div className="min-w-0">
                         <h2 className="text-3xl font-black text-white">Local Data &amp; Cache</h2>
                         <p className="text-xs text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
                            Everything this device stores on its own: preferences in local storage, the service-worker
                            cache, and the offline IndexedDB vault. Clearing a cache never touches Firestore — your
                            classes, learners and reports are server-side.
                         </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                         <button
                            type="button"
                            onClick={scanStorage}
                            disabled={storageBusy}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-cyan hover:bg-brand-cyan/80 text-slate-950 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 cursor-pointer"
                         >
                            <RefreshCw size={13} className={storageBusy ? 'animate-spin' : ''} />
                            {storageBusy ? 'Scanning…' : 'Rescan'}
                         </button>
                         <button
                            type="button"
                            onClick={clearWebCaches}
                            disabled={storageBusy || !storageInfo?.caches.length}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 cursor-pointer"
                         >
                            <Trash2 size={13} className="text-brand-cyan" />
                            Clear caches
                         </button>
                         <button
                            type="button"
                            onClick={updateServiceWorker}
                            disabled={storageBusy}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-40 cursor-pointer"
                         >
                            <Download size={13} className="text-brand-cyan" />
                            Update service worker
                         </button>
                      </div>
                   </div>

                   {storageMessage && (
                      <div className="flex items-start gap-2 rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 p-3 text-xs font-medium text-slate-200">
                         <AlertCircle size={14} className="mt-0.5 shrink-0 text-brand-cyan" />
                         <span>{storageMessage}</span>
                      </div>
                   )}

                   {!storageInfo && !storageBusy ? (
                      <div className="glass p-12 rounded-[32px] border border-white/5 text-center">
                         <HardDrive size={30} className="mx-auto text-slate-600 mb-3" />
                         <p className="text-sm text-slate-400 font-medium">Scanning this device's local storage…</p>
                      </div>
                   ) : (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                         {/* Local storage */}
                         <div className="glass p-5 rounded-[28px] border border-white/5 space-y-3">
                            <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-white/5">
                               <h4 className="flex items-center gap-2.5 font-bold text-white text-sm">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                                     <Cpu size={14} />
                                  </span>
                                  Local preferences
                               </h4>
                               <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-slate-400">
                                  {storageInfo?.local.length ?? 0} keys · {formatBytes(storageInfo?.localTotalBytes ?? 0)}
                               </span>
                            </div>
                            {storageInfo?.local.length ? (
                               <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
                                  {storageInfo.local.map(item => (
                                     <div key={item.key} className="group flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                                        <span className="min-w-0 truncate font-mono text-[11px] text-slate-300" title={item.key}>
                                           {item.key}
                                        </span>
                                        <span className="flex shrink-0 items-center gap-2">
                                           <span className="font-mono text-[10px] text-slate-500">{formatBytes(item.bytes)}</span>
                                           <button
                                              type="button"
                                              onClick={() => removeLocalKey(item.key)}
                                              title={`Remove ${item.key}`}
                                              aria-label={`Remove ${item.key}`}
                                              className="rounded-md p-1 text-slate-600 opacity-60 transition-all hover:bg-rose-500/15 hover:text-rose-400 hover:opacity-100 cursor-pointer"
                                           >
                                              <Trash2 size={12} />
                                           </button>
                                        </span>
                                     </div>
                                  ))}
                               </div>
                            ) : (
                               <p className="py-6 text-center text-xs text-slate-500 italic">
                                  Local storage is empty (or blocked in this runtime).
                               </p>
                            )}
                         </div>

                         {/* Caches + IndexedDB */}
                         <div className="space-y-5">
                            <div className="glass p-5 rounded-[28px] border border-white/5 space-y-3">
                               <h4 className="flex items-center gap-2.5 font-bold text-white text-sm pb-2.5 border-b border-white/5">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                                     <Database size={14} />
                                  </span>
                                  Service-worker caches
                               </h4>
                               {storageInfo?.caches.length ? (
                                  <div className="space-y-1.5">
                                     {storageInfo.caches.map(cache => (
                                        <div key={cache.name} className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                                           <span className="min-w-0 truncate font-mono text-[11px] text-slate-300" title={cache.name}>{cache.name}</span>
                                           <span className="shrink-0 font-mono text-[10px] text-slate-500">{cache.entries} entries</span>
                                        </div>
                                     ))}
                                  </div>
                               ) : (
                                  <p className="py-4 text-center text-xs text-slate-500 italic">
                                     No caches — the service worker has not stored anything yet.
                                  </p>
                               )}
                            </div>

                            <div className="glass p-5 rounded-[28px] border border-white/5 space-y-3">
                               <h4 className="flex items-center gap-2.5 font-bold text-white text-sm pb-2.5 border-b border-white/5">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                                     <HardDrive size={14} />
                                  </span>
                                  Offline vault <span className="font-mono text-[10px] font-bold text-slate-500">eduai-companion-db</span>
                               </h4>
                               {storageInfo?.idbError ? (
                                  <p className="py-2 text-xs text-amber-400">{storageInfo.idbError}</p>
                               ) : storageInfo?.idbStores.length ? (
                                  <div className="space-y-1.5">
                                     {storageInfo.idbStores.map(store => (
                                        <div key={store.name} className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                                           <span className="font-mono text-[11px] text-slate-300">{store.name}</span>
                                           <span className="shrink-0 font-mono text-[10px] text-slate-500">{store.count} records</span>
                                        </div>
                                     ))}
                                  </div>
                               ) : (
                                  <p className="py-4 text-center text-xs text-slate-500 italic">No object stores found.</p>
                               )}
                               <button
                                  type="button"
                                  onClick={clearOfflineNotes}
                                  disabled={storageBusy}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 cursor-pointer"
                               >
                                  <Trash2 size={13} />
                                  Delete offline study notes
                               </button>
                            </div>
                         </div>
                      </div>
                   )}
                </div>
             )}

             {activeSubTab === 'billing' && (
                <div className="space-y-6">
                   <h2 className="text-3xl font-black text-white">Neural Link Subscription</h2>
                   <div className="p-8 rounded-[40px] border border-white/5 bg-white/5 flex justify-between items-center">
                      <div>
                         <p className="text-slate-400 text-xs uppercase font-black tracking-widest mb-1">Active Tier</p>
                         <p className="text-2xl font-black text-white uppercase">Premium Scholar</p>
                      </div>
                      <div className="text-right">
                         <p className="text-brand-cyan font-black text-xl">R249 / month</p>
                         <p className="text-slate-500 text-[10px] font-bold uppercase">Next billing: Oct 12, 2026</p>
                      </div>
                   </div>
                </div>
             )}

             {activeSubTab === 'codebase' && (
                <div className="space-y-6">
                   <h2 className="text-3xl font-black text-white">Core Specifications</h2>
                   <div className="p-8 rounded-[40px] border border-white/5 bg-white/5 space-y-4">
                      <p className="text-slate-400 text-sm leading-relaxed">
                         EduAI Companion is a high-fidelity learning management system built with React, Vite, and Tailwind CSS. 
                         It utilizes Gemini models for advanced CAPS content generation and auto-grading.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                         <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[10px] font-bold text-slate-400">Framework: React 18+</div>
                         <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[10px] font-bold text-slate-400">Styling: Tailwind CSS</div>
                      </div>
                   </div>
                </div>
             )}
          </div>
          
          <div className="p-6 border-t border-white/5 flex justify-end gap-4 bg-[#0c1024]/50 backdrop-blur-md">
             <button className="px-6 py-3 rounded-2xl bg-white/5 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-white transition-all">Discard</button>
             <button className="px-8 py-3 rounded-2xl bg-brand-cyan text-navy-dark font-black text-xs uppercase tracking-widest shadow-lg shadow-cyan-500/20 active:scale-95 transition-all">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}
