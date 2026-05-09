import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  databaseId: firebaseConfig.firestoreDatabaseId,
  experimentalForceLongPolling: true
});
export const auth = getAuth(app);
