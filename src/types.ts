export interface Assessment {
  title: string;
  score: number;
  type: string; // e.g., 'SBA' | 'Test' | 'Project' | 'Quiz' | 'Practical'
  date?: string;
}

export interface Subject {
  name: string;
  mark: number;
  termHistory: number[];
  assessments: Assessment[];
}

export interface MilestoneTask {
  task: string;
  milestone: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  completedAt?: string;
}

export interface IdpModel {
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  actionPlan: MilestoneTask[];
}

export interface StudentDoc {
  id: string;
  name: string;
  grade: string;
  email: string;
  status: string;
  teacherId?: string;
  lastActiveDate?: string;
  streak?: number;
  subjects?: Subject[];
  idp?: IdpModel;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  createdAt?: any;
}

export interface ActivityLog {
  id: string;
  studentId: string;
  activityType: 'login' | 'task_completed' | 'practice_attempt' | 'ai_chat';
  description: string;
  timestamp: string;
}
