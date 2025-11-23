
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { loadSkills, saveSkills, clearUserData, getSession, clearSession } from './services/storageService';
import { Skill, Entry, ProgressLevel, User } from './types';
import { Dashboard } from './pages/Dashboard';
import { SkillDetail } from './pages/SkillDetail';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Auth } from './pages/Auth';
import { AdminPanel } from './pages/AdminPanel';
import { Sidebar } from './components/layout/Sidebar';
import { Menu, LogOut, EyeOff } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

// Global Context Definition
interface AppContextType {
  skills: Skill[];
  user: User | null;
  addSkill: (name: string) => void;
  deleteSkill: (id: string) => void;
  updateSkill: (id: string, name: string) => void;
  addEntry: (skillId: string, entry: Omit<Entry, 'id'>) => void;
  addBulkEntries: (skillId: string, module: string, topics: string[]) => void;
  updateEntry: (skillId: string, entryId: string, entry: Omit<Entry, 'id'>) => void;
  deleteEntry: (skillId: string, entryId: string) => void;
  resetApp: () => void;
  logout: () => void;
  stopImpersonation?: () => void; 
  impersonatingAdmin?: User | null;
}

export const AppContext = React.createContext<AppContextType | null>(null);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [impersonatingAdmin, setImpersonatingAdmin] = useState<User | null>(null);

  // Initial Load
  useEffect(() => {
    const init = async () => {
        const sessionUser = getSession();
        const adminStr = sessionStorage.getItem('skillflow_admin_impersonator');
        if (adminStr && sessionUser) {
            setImpersonatingAdmin(JSON.parse(adminStr));
        }

        if (sessionUser) {
            setUser(sessionUser);
            const data = await loadSkills(sessionUser.id);
            setSkills(data);
        }
        setIsLoading(false);
    };
    init();
  }, []);

  // Save Skills on Change
  useEffect(() => {
    if (!isLoading && user) {
      saveSkills(user.id, skills);
    }
  }, [skills, isLoading, user]);

  const logout = () => {
    if (impersonatingAdmin) {
       stopImpersonation();
       return;
    }
    clearSession();
    setUser(null);
    setSkills([]);
    toast.success('Logged out successfully.');
  };

  const stopImpersonation = () => {
     if (impersonatingAdmin) {
        localStorage.setItem('skillflow_session_v2', JSON.stringify(impersonatingAdmin));
        sessionStorage.removeItem('skillflow_admin_impersonator');
        window.location.href = '/'; 
     }
  };

  const addSkill = (name: string) => {
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newSkill: Skill = {
      id: crypto.randomUUID(),
      name,
      entries: [],
      createdAt: new Date().toISOString(),
      themeColor: randomColor
    };
    setSkills(prev => [...prev, newSkill]);
    toast.success('Skill added successfully!');
  };

  const deleteSkill = (id: string) => {
    setSkills(prev => prev.filter(s => s.id !== id));
    toast.success('Skill deleted.');
  };

  const updateSkill = (id: string, name: string) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, name } : s));
    toast.success('Skill updated.');
  };

  const addEntry = (skillId: string, entryData: Omit<Entry, 'id'>) => {
    const newEntry: Entry = { ...entryData, id: crypto.randomUUID() };
    setSkills(prev => prev.map(skill => {
      if (skill.id === skillId) {
        return { ...skill, entries: [newEntry, ...skill.entries] };
      }
      return skill;
    }));
    toast.success('Entry saved!');
  };

  const addBulkEntries = (skillId: string, module: string, topics: string[]) => {
    const newEntries: Entry[] = topics.map(topic => ({
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      topic: topic.trim(),
      subject: '',
      module: module.trim(),
      progress: ProgressLevel.NotStarted,
      videoUrl: '',
      websiteUrl: '',
      otherUrl: '',
      docsUrl: ''
    }));

    setSkills(prev => prev.map(skill => {
      if (skill.id === skillId) {
        return { ...skill, entries: [...newEntries, ...skill.entries] };
      }
      return skill;
    }));
    toast.success(`${newEntries.length} entries added!`);
  };

  const updateEntry = (skillId: string, entryId: string, entryData: Omit<Entry, 'id'>) => {
    setSkills(prev => prev.map(skill => {
      if (skill.id === skillId) {
        return {
          ...skill,
          entries: skill.entries.map(e => e.id === entryId ? { ...entryData, id: entryId } : e)
        };
      }
      return skill;
    }));
    toast.success('Entry updated!');
  };

  const deleteEntry = (skillId: string, entryId: string) => {
    setSkills(prev => prev.map(skill => {
      if (skill.id === skillId) {
        return { ...skill, entries: skill.entries.filter(e => e.id !== entryId) };
      }
      return skill;
    }));
    toast.success('Entry deleted.');
  };

  const resetApp = () => {
    if (user) {
       clearUserData(user.id);
       setSkills([]);
       toast.success('All data reset.');
    }
  };

  const handleLogin = async (loggedInUser: User) => {
    setUser(loggedInUser);
    const data = await loadSkills(loggedInUser.id);
    setSkills(data);
  };

  if (isLoading) return null; 

  if (!user) {
    return (
      <>
        <Auth onLogin={handleLogin} />
        <Toaster position="top-center" />
      </>
    );
  }

  return (
    <AppContext.Provider value={{ skills, user, addSkill, deleteSkill, updateSkill, addEntry, addBulkEntries, updateEntry, deleteEntry, resetApp, logout, stopImpersonation, impersonatingAdmin }}>
      <Router>
        <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
          
          {impersonatingAdmin && (
             <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-1 text-xs font-bold text-center flex justify-center items-center gap-4">
                <span>VIEWING AS: {user.name} ({user.email})</span>
                <button 
                  onClick={stopImpersonation}
                  className="bg-white text-amber-600 px-2 py-0.5 rounded shadow-sm hover:bg-slate-100 flex items-center gap-1"
                >
                  <EyeOff size={12} />
                  Return to Admin
                </button>
             </div>
          )}

          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${impersonatingAdmin ? 'mt-6' : ''}`}>
            <Sidebar onCloseMobile={() => setIsSidebarOpen(false)} />
          </div>

          <div className={`flex-1 flex flex-col h-full overflow-hidden w-full ${impersonatingAdmin ? 'mt-6' : ''}`}>
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 flex-shrink-0">
              <div className="flex items-center">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="mr-4 p-2 rounded-md hover:bg-slate-100 lg:hidden text-slate-600"
                >
                  <Menu size={24} />
                </button>
                <HeaderTitle />
              </div>
              <div className="flex items-center gap-2">
                 <div className="flex flex-col items-end mr-2 hidden sm:block">
                    <span className="text-sm font-medium text-slate-700">{user.name}</span>
                    <span className="text-xs text-slate-500 capitalize">{user.role}</span>
                 </div>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
                    {user.name.charAt(0).toUpperCase()}
                 </div>
              </div>
            </header>

            <main className="flex-1 overflow-auto p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <Routes>
                  <Route path="/" element={
                      user.role === 'admin' && !impersonatingAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />
                  } />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/skill/:id" element={<SkillDetail />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/admin" element={
                     user.role === 'admin' && !impersonatingAdmin 
                     ? <AdminPanel /> 
                     : <Navigate to="/dashboard" replace />
                  } />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
        <Toaster position="top-right" />
      </Router>
    </AppContext.Provider>
  );
};

const HeaderTitle: React.FC = () => {
  const location = useLocation();
  const context = React.useContext(AppContext);
  const userRole = context?.user?.role;
  const isImpersonating = context?.impersonatingAdmin;
  
  if (location.pathname === '/admin') return <h1 className="text-xl font-semibold text-slate-800">Admin Panel</h1>;
  if (location.pathname === '/dashboard') return <h1 className="text-xl font-semibold text-slate-800">{isImpersonating || userRole !== 'admin' ? 'Dashboard' : 'My Learning'}</h1>;
  if (location.pathname === '/analytics') return <h1 className="text-xl font-semibold text-slate-800">Analytics</h1>;
  if (location.pathname === '/settings') return <h1 className="text-xl font-semibold text-slate-800">Settings</h1>;
  
  if (location.pathname.startsWith('/skill/')) {
    const id = location.pathname.split('/')[2];
    const skill = context?.skills.find(s => s.id === id);
    return <h1 className="text-xl font-semibold text-slate-800">{skill ? skill.name : 'Skill Details'}</h1>;
  }

  return <h1 className="text-xl font-semibold text-slate-800">SkillFlow</h1>;
};

export default App;
