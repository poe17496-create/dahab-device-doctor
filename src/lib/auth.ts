import fs from 'fs';
import path from 'path';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'technician';
  specialty?: string;
  password?: string;
  active: boolean;
  diagnosesCount: number;
  createdAt: string;
}

const BASE_DIR = process.env.VERCEL ? '/tmp' : process.cwd();
const DATA_DIR = path.join(BASE_DIR, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'user_admin',
    username: 'dahab',
    name: 'المهندس إسلام دهب (المشرف العام)',
    email: 'dahab@doctor.com',
    role: 'admin',
    specialty: 'كبير مهندسي صيانة الإلكترونيات والميكروسولديرنج',
    password: 'dahab2026',
    active: true,
    diagnosesCount: 142,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user_tech1',
    username: 'tech_ahmed',
    name: 'م. أحمد مصطفى',
    email: 'ahmed@doctor.com',
    role: 'technician',
    specialty: 'صيانة الآيفون وسواب المعالجات A12-A17',
    password: '123456',
    active: true,
    diagnosesCount: 58,
    createdAt: '2026-02-15T00:00:00.000Z',
  },
  {
    id: 'user_tech2',
    username: 'tech_mohamed',
    name: 'م. محمد كمال',
    email: 'mohamed@doctor.com',
    role: 'technician',
    specialty: 'صيانة اللابتوب والماك بوك وكروت الشاشة',
    password: '123456',
    active: true,
    diagnosesCount: 39,
    createdAt: '2026-03-01T00:00:00.000Z',
  },
];

function ensureUsersFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2), 'utf-8');
    }
  } catch (e) {
    console.error('Error ensuring users file:', e);
  }
}

export function getAllUsers(): UserAccount[] {
  ensureUsersFile();
  try {
    if (!fs.existsSync(USERS_FILE)) return DEFAULT_USERS;
    const content = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading users file:', err);
    return DEFAULT_USERS;
  }
}

export function saveAllUsers(users: UserAccount[]): boolean {
  ensureUsersFile();
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing users file:', err);
    return false;
  }
}

export function addUser(user: Omit<UserAccount, 'id' | 'createdAt' | 'diagnosesCount'>): UserAccount {
  const users = getAllUsers();
  const newUser: UserAccount = {
    ...user,
    id: `user_${Date.now()}`,
    diagnosesCount: 0,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveAllUsers(users);
  return newUser;
}

export function deleteUser(id: string): boolean {
  let users = getAllUsers();
  const initialLength = users.length;
  users = users.filter((u) => u.id !== id);
  if (users.length !== initialLength) {
    saveAllUsers(users);
    return true;
  }
  return false;
}

export function toggleUserStatus(id: string): UserAccount | null {
  const users = getAllUsers();
  const user = users.find((u) => u.id === id);
  if (user) {
    user.active = !user.active;
    saveAllUsers(users);
    return user;
  }
  return null;
}

export function verifyLogin(username: string, password?: string): UserAccount | null {
  const users = getAllUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase().trim() && u.active
  );
  if (!user) return null;
  if (user.password && password && user.password !== password) {
    return null;
  }
  return user;
}
