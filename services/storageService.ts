
import { Skill, User, Announcement, AuditLog } from '../types';

// --- TOGGLE THIS TO TRUE WHEN BACKEND IS RUNNING ---
const USE_BACKEND_API = true;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const USERS_COLLECTION_KEY = 'skillflow_users_v2';
const SESSION_KEY = 'skillflow_session_v2';
const ANNOUNCEMENTS_KEY = 'skillflow_announcements';
const AUDIT_LOGS_KEY = 'skillflow_audit_logs';

// Helper for API calls
const apiCall = async (endpoint: string, method: string, body?: any) => {
  const session = getSession();
  const headers: any = { 'Content-Type': 'application/json' };
  // Simple token assumption - in real app, store token separately
  if (session && (session as any).token) {
    headers['x-auth-token'] = (session as any).token;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error('API Call Failed');
  return res.json();
};

// --- Data Persistence ---

const getUserDataKey = (userId: string) => `skillflow_data_${userId}`;

export const loadSkills = async (userId: string): Promise<Skill[]> => {
  if (USE_BACKEND_API) {
    try {
      return await apiCall('/skills', 'GET');
    } catch (e) {
      console.error("API Load Failed", e);
      return [];
    }
  } else {
    // Local Storage Fallback
    try {
      const serialized = localStorage.getItem(getUserDataKey(userId));
      if (!serialized) return [];
      return JSON.parse(serialized);
    } catch (e) {
      console.error("Failed to load skills from storage", e);
      return [];
    }
  }
};

export const saveSkills = async (userId: string, skills: Skill[]): Promise<void> => {
  if (USE_BACKEND_API) {
    try {
      await apiCall('/skills/sync', 'POST', { skills });
    } catch (e) {
      console.error("API Save Failed", e);
    }
  } else {
    // Local Storage Fallback
    try {
      localStorage.setItem(getUserDataKey(userId), JSON.stringify(skills));
    } catch (e) {
      console.error("Failed to save skills to storage", e);
    }
  }
};

export const clearUserData = (userId: string): void => {
  localStorage.removeItem(getUserDataKey(userId));
};

// --- Audit Logging System (Local Only for Demo, needs API endpoint for Prod) ---

export const logActivity = (action: string, details: string, performedBy: string = 'System') => {
  try {
    const logsStr = localStorage.getItem(AUDIT_LOGS_KEY);
    const logs: AuditLog[] = logsStr ? JSON.parse(logsStr) : [];

    const newLog: AuditLog = {
      id: crypto.randomUUID(),
      action,
      details,
      performedBy,
      timestamp: new Date().toISOString()
    };

    // Keep only last 500 logs
    const updatedLogs = [newLog, ...logs].slice(0, 500);
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updatedLogs));
  } catch (e) {
    console.error("Failed to log activity", e);
  }
};

export const getAuditLogs = (): AuditLog[] => {
  const logsStr = localStorage.getItem(AUDIT_LOGS_KEY);
  return logsStr ? JSON.parse(logsStr) : [];
};

// --- Announcements System (Local Only for Demo) ---

export const createAnnouncement = (message: string, type: 'info' | 'warning' | 'success', createdBy: string) => {
  const str = localStorage.getItem(ANNOUNCEMENTS_KEY);
  const items: Announcement[] = str ? JSON.parse(str) : [];

  const newItem: Announcement = {
    id: crypto.randomUUID(),
    message,
    type,
    createdBy,
    createdAt: new Date().toISOString()
  };

  localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify([newItem, ...items]));
  logActivity('Create Announcement', `Posted: "${message.substring(0, 20)}..."`, createdBy);
};

export const getAnnouncements = (): Announcement[] => {
  const str = localStorage.getItem(ANNOUNCEMENTS_KEY);
  return str ? JSON.parse(str) : [];
};

export const deleteAnnouncement = (id: string, adminEmail: string) => {
  const str = localStorage.getItem(ANNOUNCEMENTS_KEY);
  let items: Announcement[] = str ? JSON.parse(str) : [];
  items = items.filter(i => i.id !== id);
  localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(items));
  logActivity('Delete Announcement', `Deleted announcement ID: ${id}`, adminEmail);
};

// --- Authentication ---

interface StoredUser extends User {
  password?: string;
}

const getAllUsers = (): StoredUser[] => {
  const stored = localStorage.getItem(USERS_COLLECTION_KEY);
  return stored ? JSON.parse(stored) : [];
};

const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const registerUser = async (user: Omit<User, 'id' | 'role' | 'joinedAt'>, password: string): Promise<boolean> => {
  if (USE_BACKEND_API) {
    try {
      const res = await apiCall('/auth/register', 'POST', { ...user, password });
      if (res.token) {
        const sessionUser = { ...res.user, token: res.token };
        createSession(sessionUser);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  } else {
    if (!validateEmail(user.email)) return false;
    const users = getAllUsers();
    if (users.find(u => u.email === user.email)) return false;

    const isAdmin = user.email === 'hamidulhaquetitas@gmail.com';
    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      name: user.name,
      email: user.email,
      password: password,
      role: isAdmin ? 'admin' : 'user',
      joinedAt: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem(USERS_COLLECTION_KEY, JSON.stringify(users));
    logActivity('User Registered', `New user registered: ${user.email}`, user.email);
    return true;
  }
};

export const seedSuperAdmin = (): void => {
  if (USE_BACKEND_API) return; // Backend handles seeding
  const users = getAllUsers();
  const superAdminEmail = 'hamidulhaquetitas@gmail.com';
  if (!users.find(u => u.email === superAdminEmail)) {
    const adminUser: StoredUser = {
      id: crypto.randomUUID(),
      name: 'Super Admin',
      email: superAdminEmail,
      password: 'admin123',
      role: 'admin',
      joinedAt: new Date().toISOString()
    };
    users.push(adminUser);
    localStorage.setItem(USERS_COLLECTION_KEY, JSON.stringify(users));
  }
};

export const adminCreateUser = (newUser: { name: string, email: string, role: 'user' | 'admin' | 'editor' }, password: string): boolean => {
  if (USE_BACKEND_API) return false; // Not implemented in API client for this demo

  if (!validateEmail(newUser.email)) return false;
  const users = getAllUsers();
  if (users.find(u => u.email === newUser.email)) return false;

  const userEntry: StoredUser = {
    id: crypto.randomUUID(),
    name: newUser.name,
    email: newUser.email,
    password: password,
    role: newUser.role,
    joinedAt: new Date().toISOString()
  };
  users.push(userEntry);
  localStorage.setItem(USERS_COLLECTION_KEY, JSON.stringify(users));
  const session = getSession();
  logActivity('Admin Create User', `Created ${newUser.role}: ${newUser.email}`, session?.email);
  return true;
};

export const updateUser = (userId: string, updates: Partial<User>): boolean => {
  const users = getAllUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) return false;
  const oldEmail = users[index].email;
  if (updates.email && updates.email !== users[index].email) {
    if (!validateEmail(updates.email)) return false;
    if (users.find(u => u.email === updates.email)) return false;
  }
  const updatedUser = { ...users[index], ...updates };
  users[index] = updatedUser;
  localStorage.setItem(USERS_COLLECTION_KEY, JSON.stringify(users));
  const session = getSession();
  logActivity('Update User', `Updated info for ${oldEmail}`, session?.email);
  return true;
};

export const adminResetPassword = (userId: string, newPassword: string): boolean => {
  const users = getAllUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) return false;
  users[index].password = newPassword;
  localStorage.setItem(USERS_COLLECTION_KEY, JSON.stringify(users));
  const session = getSession();
  logActivity('Reset Password', `Forced password reset for ${users[index].email}`, session?.email);
  return true;
};

export const deleteUser = (userId: string): boolean => {
  const users = getAllUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) return false;
  const deletedEmail = users[index].email;
  users.splice(index, 1);
  localStorage.setItem(USERS_COLLECTION_KEY, JSON.stringify(users));
  localStorage.removeItem(getUserDataKey(userId));
  const session = getSession();
  logActivity('Delete User', `Permanently deleted user: ${deletedEmail}`, session?.email);
  return true;
};

export const verifyLogin = async (email: string, password: string): Promise<User | null> => {
  if (USE_BACKEND_API) {
    try {
      const res = await apiCall('/auth/login', 'POST', { email, password });
      if (res.token) {
        // Combine user info with token for session storage
        return { ...res.user, token: res.token };
      }
      return null;
    } catch (e) {
      return null;
    }
  } else {
    const users = getAllUsers();
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...safeUser } = found;
      logActivity('User Login', 'Successful login', email);
      return safeUser;
    }
    return null;
  }
};

export const createSession = (user: User): void => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
};

export const getSession = (): User | null => {
  const session = localStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
};

export const clearSession = (): void => {
  const session = getSession();
  if (session) {
    logActivity('User Logout', 'Logged out', session.email);
  }
  localStorage.removeItem(SESSION_KEY);
};

export const getSystemHealth = () => {
  let totalUsage = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalUsage += (localStorage[key].length * 2) / 1024; // KB
    }
  }
  return {
    storageUsedKB: Math.round(totalUsage),
    storageLimitKB: 5120
  };
};

export const getAdminStats = async () => {
  if (USE_BACKEND_API) {
    try {
      const users = await apiCall('/admin/users', 'GET');

      // Calculate totals from backend users
      let totalEntries = 0;
      let totalSkills = 0;

      const usersWithStats = users.map((u: any) => {
        // Backend should return users with their stats
        // For now, we'll set default values since we don't have skill counts yet
        totalSkills += u.stats?.skills || 0;
        totalEntries += u.stats?.entries || 0;
        return {
          ...u,
          stats: u.stats || { skills: 0, entries: 0 }
        };
      });

      return {
        totalUsers: users.length,
        totalSkills,
        totalEntries,
        users: usersWithStats,
        system: getSystemHealth()
      };
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      // Fallback to empty data
      return {
        totalUsers: 0,
        totalSkills: 0,
        totalEntries: 0,
        users: [],
        system: getSystemHealth()
      };
    }
  } else {
    const users = getAllUsers();
    let totalEntries = 0;
    let totalSkills = 0;

    const usersWithStats = users.map(u => {
      const userSkills: Skill[] = JSON.parse(localStorage.getItem(getUserDataKey(u.id)) || '[]');
      const entriesCount = userSkills.reduce((acc, s) => acc + s.entries.length, 0);
      totalSkills += userSkills.length;
      totalEntries += entriesCount;
      return {
        ...u,
        stats: { skills: userSkills.length, entries: entriesCount }
      };
    });

    return {
      totalUsers: users.length,
      totalSkills,
      totalEntries,
      users: usersWithStats,
      system: getSystemHealth()
    };
  }
};

export const exportSystemData = (): string => {
  const users = getAllUsers();
  const announcements = getAnnouncements();
  const auditLogs = getAuditLogs();
  const allUserData: Record<string, Skill[]> = {};
  users.forEach(u => {
    // Note: This wrapper still returns Promise<Skill[]> but for local export we treat sync
    // In real API mode, this export function would need to be async
    const serialized = localStorage.getItem(getUserDataKey(u.id));
    if (serialized) allUserData[u.id] = JSON.parse(serialized);
  });

  const exportPayload = {
    version: '2.0',
    timestamp: new Date().toISOString(),
    users,
    allUserData,
    announcements,
    auditLogs
  };
  return JSON.stringify(exportPayload, null, 2);
};

export const importSystemData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (!data.users || !data.allUserData) return false;
    localStorage.setItem(USERS_COLLECTION_KEY, JSON.stringify(data.users));
    Object.keys(data.allUserData).forEach(userId => {
      localStorage.setItem(getUserDataKey(userId), JSON.stringify(data.allUserData[userId]));
    });
    if (data.announcements) localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(data.announcements));
    if (data.auditLogs) localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(data.auditLogs));
    logActivity('System Restore', 'Full system restoration performed', 'Admin');
    return true;
  } catch (e) {
    console.error("Import failed", e);
    return false;
  }
};
