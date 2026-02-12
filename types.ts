
export interface User {
  id: string;
  name: string;
  role: string;
  avatar: string;
  password?: string; // Senha individual do perfil
}

export interface Student {
  id: string;
  name: string;
  registration: string;
  grade: string;
  emails?: string[]; // E-mails específicos dos responsáveis deste aluno
}

export interface Absence {
  studentId: string;
  date: string; // ISO format YYYY-MM-DD
}

export interface NotificationThreshold {
  consecutiveDays: number;
  totalDays: number;
}

export interface NotificationAlert {
  studentId: string;
  studentName: string;
  reason: 'consecutive' | 'total';
  days: number;
}

export interface AppState {
  students: Student[];
  absences: Absence[];
  users: User[];
  currentUser: User | null;
}
