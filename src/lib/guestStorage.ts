import fs from 'fs';
import path from 'path';

export interface GuestRecord {
  id: string;
  createdAt: string;
  lastSeenAt: string;
  deviceInfo: string;
  diagnosesCount: number;
  remainingTrials: number;
  ip?: string;
}

const BASE_DIR = process.env.VERCEL ? '/tmp' : process.cwd();
const DATA_DIR = path.join(BASE_DIR, 'data');
const GUESTS_FILE = path.join(DATA_DIR, 'guests.json');

function ensureGuestsFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(GUESTS_FILE)) {
      fs.writeFileSync(GUESTS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (e) {
    console.error('Error ensuring guests file:', e);
  }
}

export function getAllGuests(): GuestRecord[] {
  ensureGuestsFile();
  try {
    if (!fs.existsSync(GUESTS_FILE)) return [];
    const content = fs.readFileSync(GUESTS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading guests file:', err);
    return [];
  }
}

export function saveAllGuests(guests: GuestRecord[]): boolean {
  ensureGuestsFile();
  try {
    fs.writeFileSync(GUESTS_FILE, JSON.stringify(guests, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing guests file:', err);
    return false;
  }
}

export function recordGuestActivity(
  guestId: string,
  action: 'enter' | 'diagnose' | 'heartbeat',
  deviceInfo?: string,
  remaining?: number
): GuestRecord {
  const guests = getAllGuests();
  let guest = guests.find((g) => g.id === guestId);
  const now = new Date().toISOString();

  if (!guest) {
    guest = {
      id: guestId,
      createdAt: now,
      lastSeenAt: now,
      deviceInfo: deviceInfo || 'Web Browser',
      diagnosesCount: action === 'diagnose' ? 1 : 0,
      remainingTrials: remaining !== undefined ? remaining : 5,
    };
    guests.unshift(guest);
  } else {
    guest.lastSeenAt = now;
    if (deviceInfo) guest.deviceInfo = deviceInfo;
    if (action === 'diagnose') {
      guest.diagnosesCount = (guest.diagnosesCount || 0) + 1;
      guest.remainingTrials = Math.max(0, 5 - guest.diagnosesCount);
    }
    if (remaining !== undefined) {
      guest.remainingTrials = remaining;
    }
  }

  // الاحتفاظ بآخر 100 زائر لتجنب زيادة حجم الملف
  if (guests.length > 100) {
    guests.splice(100);
  }

  saveAllGuests(guests);
  return guest;
}

export function deleteGuestRecord(guestId: string): boolean {
  let guests = getAllGuests();
  const initial = guests.length;
  guests = guests.filter((g) => g.id !== guestId);
  if (guests.length !== initial) {
    saveAllGuests(guests);
    return true;
  }
  return false;
}

export function clearAllGuests(): boolean {
  return saveAllGuests([]);
}
