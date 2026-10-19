import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  // Let the SDK pick the transport: WebSocket first, long-polling only when
  // the network actually needs it. Forcing long-polling meant every live
  // listener was an XMLHttpRequest that restrictive school proxies and ad
  // blockers killed ("ERR_TIMED_OUT" / "ERR_BLOCKED_BY_CLIENT" on the
  // Firestore Listen channel), which tore down the live sync on every
  // dashboard. Auto-detection keeps the WebSocket path where it works and
  // still falls back to long-polling where it does not.
  experimentalAutoDetectLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
