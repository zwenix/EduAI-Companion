import { db } from './firebase';
import { collection, doc, setDoc, updateDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

export async function logStudentActivity(
  studentId: string, 
  activityType: 'login' | 'task_completed' | 'practice_attempt' | 'ai_chat', 
  description: string
) {
  if (!studentId) return;
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Add activity log to collection
    await setDoc(doc(db, 'activity_logs', logId), {
      id: logId,
      studentId,
      activityType,
      description,
      timestamp: todayStr,
      createdAt: serverTimestamp()
    });

    // Mirror last active date onto student document
    await updateDoc(doc(db, 'students', studentId), {
      lastActiveDate: todayStr
    });
  } catch (err) {
    console.warn("Failed recording live student activity:", err);
  }
}

export async function calculateStudentStreak(studentId: string): Promise<number> {
  if (!studentId) return 1;
  try {
    const q = query(collection(db, 'activity_logs'), where('studentId', '==', studentId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return 1;

    const uniqueDates = new Set<string>();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.timestamp) {
        uniqueDates.add(data.timestamp);
      }
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let streak = 0;
    const todayHasActivity = uniqueDates.has(todayStr);
    const yesterdayHasActivity = uniqueDates.has(yesterdayStr);

    if (todayHasActivity || yesterdayHasActivity) {
      let dateToCheck = todayHasActivity ? new Date() : yesterday;
      while (true) {
        const checkStr = dateToCheck.toISOString().split('T')[0];
        if (uniqueDates.has(checkStr)) {
          streak++;
          dateToCheck.setDate(dateToCheck.getDate() - 1);
        } else {
          break;
        }
      }
    } else {
      streak = 1; // Minimum active today
    }

    return Math.max(1, streak);
  } catch (err) {
    console.warn("Error calculating student streak from activity logs:", err);
    return 1;
  }
}
