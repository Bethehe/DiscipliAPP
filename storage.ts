
import { openDB } from 'idb';
import { Student, Absence, User } from './types';

const DB_NAME = 'discipli-app-db';
const STORE_NAME = 'app-data';

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(STORE_NAME);
  },
});

export async function saveStudents(students: Student[]) {
  const db = await dbPromise;
  await db.put(STORE_NAME, students, 'students');
}

export async function loadStudents(): Promise<Student[] | undefined> {
  const db = await dbPromise;
  return await db.get(STORE_NAME, 'students');
}

export async function saveAbsences(absences: Absence[]) {
  const db = await dbPromise;
  await db.put(STORE_NAME, absences, 'absences');
}

export async function loadAbsences(): Promise<Absence[] | undefined> {
  const db = await dbPromise;
  return await db.get(STORE_NAME, 'absences');
}

export async function saveUsers(users: User[]) {
  const db = await dbPromise;
  await db.put(STORE_NAME, users, 'users');
}

export async function loadUsers(): Promise<User[] | undefined> {
  const db = await dbPromise;
  return await db.get(STORE_NAME, 'users');
}
