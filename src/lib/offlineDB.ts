import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface EduAIDB extends DBSchema {
  cache: {
    key: string;
    value: any;
  };
  studyNotes: {
    key: string;
    value: {
      id: string;
      title: string;
      subject: string;
      grade: string;
      contentType: string;
      content: string;
      createdAt: string;
      [key: string]: any;
    };
    indexes: { 'by-date': string };
  };
}

let dbPromise: Promise<IDBPDatabase<EduAIDB>> | null = null;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<EduAIDB>('eduai-companion-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache');
        }
        if (!db.objectStoreNames.contains('studyNotes')) {
          const store = db.createObjectStore('studyNotes', { keyPath: 'id' });
          store.createIndex('by-date', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
};

export const setCachedData = async (key: string, val: any) => {
  const db = await initDB();
  return db.put('cache', val, key);
};

export const getCachedData = async (key: string) => {
  const db = await initDB();
  return db.get('cache', key);
};

export const saveStudyNote = async (note: any) => {
  const db = await initDB();
  return db.put('studyNotes', note);
};

export const getStudyNotes = async () => {
  const db = await initDB();
  return db.getAllFromIndex('studyNotes', 'by-date');
};

export const getStudyNote = async (id: string) => {
  const db = await initDB();
  return db.get('studyNotes', id);
};

export const clearStudyNotes = async () => {
  const db = await initDB();
  return db.clear('studyNotes');
};
