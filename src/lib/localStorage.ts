// نظام تخزين محلي بسيط باستخدام localStorage
// للعمل بدون قاعدة بيانات خارجية

export interface LocalUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface LocalDiagnosis {
  id: string;
  userId: string;
  deviceModel: string;
  symptoms: string;
  specialty: string;
  readings: string;
  metrics: string;
  output: string;
  aiEngine: string;
  createdAt: string;
}

export interface LocalSupportTicket {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
}

// إدارة المستخدمين
export const localStorageUsers = {
  getUsers: (): LocalUser[] => {
    if (typeof window === 'undefined') return [];
    const users = localStorage.getItem('dahab_users');
    return users ? JSON.parse(users) : [];
  },

  addUser: (user: Omit<LocalUser, 'id' | 'createdAt'>): LocalUser => {
    const users = localStorageUsers.getUsers();
    const newUser: LocalUser = {
      ...user,
      id: `user_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem('dahab_users', JSON.stringify(users));
    return newUser;
  },

  getUserByEmail: (email: string): LocalUser | undefined => {
    const users = localStorageUsers.getUsers();
    return users.find(u => u.email === email);
  },
};

// إدارة التشخيصات
export const localStorageDiagnoses = {
  getDiagnoses: (): LocalDiagnosis[] => {
    if (typeof window === 'undefined') return [];
    const diagnoses = localStorage.getItem('dahab_diagnoses');
    return diagnoses ? JSON.parse(diagnoses) : [];
  },

  addDiagnosis: (diagnosis: Omit<LocalDiagnosis, 'id' | 'createdAt'>): LocalDiagnosis => {
    const diagnoses = localStorageDiagnoses.getDiagnoses();
    const newDiagnosis: LocalDiagnosis = {
      ...diagnosis,
      id: `diag_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    diagnoses.push(newDiagnosis);
    localStorage.setItem('dahab_diagnoses', JSON.stringify(diagnoses));
    return newDiagnosis;
  },

  getUserDiagnoses: (userId: string): LocalDiagnosis[] => {
    const diagnoses = localStorageDiagnoses.getDiagnoses();
    return diagnoses.filter(d => d.userId === userId);
  },
};

// إدارة تذاكر الدعم
export const localStorageTickets = {
  getTickets: (): LocalSupportTicket[] => {
    if (typeof window === 'undefined') return [];
    const tickets = localStorage.getItem('dahab_tickets');
    return tickets ? JSON.parse(tickets) : [];
  },

  addTicket: (ticket: Omit<LocalSupportTicket, 'id' | 'createdAt'>): LocalSupportTicket => {
    const tickets = localStorageTickets.getTickets();
    const newTicket: LocalSupportTicket = {
      ...ticket,
      id: `ticket_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    tickets.push(newTicket);
    localStorage.setItem('dahab_tickets', JSON.stringify(tickets));
    return newTicket;
  },

  getUserTickets: (userId: string): LocalSupportTicket[] => {
    const tickets = localStorageTickets.getTickets();
    return tickets.filter(t => t.userId === userId);
  },
};

// إحصائيات بسيطة
export const localStorageStats = {
  getStats: () => {
    const diagnoses = localStorageDiagnoses.getDiagnoses();
    const tickets = localStorageTickets.getTickets();
    const users = localStorageUsers.getUsers();

    const diagnosesByEngine = diagnoses.reduce((acc, d) => {
      acc[d.aiEngine] = (acc[d.aiEngine] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const diagnosesBySpecialty = diagnoses.reduce((acc, d) => {
      acc[d.specialty] = (acc[d.specialty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalDiagnoses: diagnoses.length,
      totalTickets: tickets.length,
      totalUsers: users.length,
      diagnosesByEngine,
      diagnosesBySpecialty,
      openTickets: tickets.filter(t => t.status === 'open').length,
    };
  },
};
