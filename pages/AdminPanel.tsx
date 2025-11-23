
import React, { useEffect, useState, useContext } from 'react';
import { 
  getAdminStats, 
  adminCreateUser, 
  deleteUser, 
  updateUser, 
  adminResetPassword,
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  getAuditLogs,
  exportSystemData,
  importSystemData
} from '../services/storageService';
import { User, Announcement, AuditLog } from '../types';
import { Button } from '../components/ui/Button';
import { Users, BookOpen, List, Shield, Calendar, Search, UserPlus, X, Edit2, Trash2, Key, Bell, Activity, Database, AlertCircle, LayoutList, Eye, Download, Upload, HardDrive, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'react-hot-toast';
import { AppContext } from '../App';
import { useNavigate } from 'react-router-dom';

interface UserWithStats extends User {
  stats: {
    skills: number;
    entries: number;
  }
}

interface AdminData {
  totalUsers: number;
  totalSkills: number;
  totalEntries: number;
  users: UserWithStats[];
  system: {
    storageUsedKB: number;
    storageLimitKB: number;
  }
}

export const AdminPanel: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const [data, setData] = useState<AdminData | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'announcements' | 'logs' | 'maintenance'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Announcements State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnounceMsg, setNewAnnounceMsg] = useState('');
  const [newAnnounceType, setNewAnnounceType] = useState<'info' | 'warning' | 'success'>('info');

  // Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [logSearchTerm, setLogSearchTerm] = useState('');

  // Modals State
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isConfirmCreateOpen, setConfirmCreateOpen] = useState(false); // New Confirmation State
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  // Selection State
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);

  // Form States
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'user' | 'admin' | 'editor'>('user');

  const [resetPassword, setResetPassword] = useState('');

  const loadData = () => {
    setData(getAdminStats());
    setAnnouncements(getAnnouncements());
    setAuditLogs(getAuditLogs());
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Handlers ---

  const validateEmail = (email: string): boolean => {
    // Stricter Regex: Must have chars, then @, then chars, then dot, then 2+ chars
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(email);
  };

  // Step 1: Trigger Confirmation
  const handleCreateUserClick = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(newEmail)) {
       toast.error("Invalid email format. Please check for typos.");
       return;
    }
    
    // Open Confirmation Modal instead of creating immediately
    setCreateModalOpen(false);
    setConfirmCreateOpen(true);
  };

  // Step 2: Actual Creation
  const confirmCreateUser = () => {
    const success = adminCreateUser(
      { name: newName, email: newEmail, role: newRole }, 
      newPassword
    );

    if (success) {
      toast.success(`New ${newRole} created successfully!`);
      setConfirmCreateOpen(false); // Close confirm
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
      loadData();
    } else {
      toast.error('User with this email already exists.');
      setConfirmCreateOpen(false);
      setCreateModalOpen(true); // Re-open form if failed
    }
  };

  const openEditModal = (user: UserWithStats) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditModalOpen(true);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!validateEmail(editEmail)) {
       toast.error("Please enter a valid email address.");
       return;
    }

    const success = updateUser(selectedUser.id, {
      name: editName,
      email: editEmail,
      role: editRole
    });

    if (success) {
      toast.success('User updated successfully.');
      setEditModalOpen(false);
      loadData();
    } else {
      toast.error('Failed to update user. Email might be taken.');
    }
  };

  const openResetPasswordModal = (user: UserWithStats) => {
    setSelectedUser(user);
    setResetPassword('');
    setResetPasswordModalOpen(true);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (resetPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    const success = adminResetPassword(selectedUser.id, resetPassword);
    if (success) {
      toast.success(`Password for ${selectedUser.name} has been reset.`);
      setResetPasswordModalOpen(false);
    } else {
      toast.error('Failed to reset password.');
    }
  };

  const openDeleteModal = (user: UserWithStats) => {
    if (user.id === context?.user?.id) {
      toast.error("You cannot delete your own account.");
      return;
    }
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    
    const success = deleteUser(selectedUser.id);
    if (success) {
      toast.success(`User ${selectedUser.name} deleted.`);
      setDeleteModalOpen(false);
      loadData();
    } else {
      toast.error('Failed to delete user.');
    }
  };

  const handleImpersonate = (user: User) => {
    if (user.id === context?.user?.id) {
       toast.error("You are already logged in as yourself.");
       return;
    }
    
    const adminUser = context?.user;
    if(adminUser) {
       sessionStorage.setItem('skillflow_admin_impersonator', JSON.stringify(adminUser));
       localStorage.setItem('skillflow_session_v2', JSON.stringify(user));
       window.location.href = '/'; // Reload to take effect
    }
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnounceMsg.trim()) return;
    
    createAnnouncement(newAnnounceMsg, newAnnounceType, context?.user?.email || 'Admin');
    toast.success('Announcement posted.');
    setNewAnnounceMsg('');
    loadData();
  };

  const handleDeleteAnnouncement = (id: string) => {
    deleteAnnouncement(id, context?.user?.email || 'Admin');
    toast.success('Announcement removed.');
    loadData();
  };

  const handleSystemExport = () => {
     const json = exportSystemData();
     const blob = new Blob([json], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.href = url;
     link.download = `SKILLFLOW_FULL_SYSTEM_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     toast.success('System backup downloaded.');
  };

  const handleSystemImport = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;

     if (!window.confirm("CRITICAL WARNING: This will OVERWRITE the entire database (All users, All skills). Are you sure?")) {
        return;
     }

     const reader = new FileReader();
     reader.onload = (ev) => {
        const content = ev.target?.result as string;
        if(importSystemData(content)) {
           toast.success('System restored successfully. Reloading...');
           setTimeout(() => window.location.reload(), 1500);
        } else {
           toast.error('Invalid system backup file.');
        }
     };
     reader.readAsText(file);
  };

  if (!data) return <div className="p-8">Loading Admin Data...</div>;

  const filteredUsers = data.users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = auditLogs.filter(log => 
    log.performedBy.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(logSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Shield className="text-indigo-600 fill-indigo-100" />
            Admin Dashboard
          </h1>
          <p className="text-slate-500 mt-1">System usage and advanced user control.</p>
        </div>
        {activeTab === 'users' && (
          <Button onClick={() => setCreateModalOpen(true)} icon={<UserPlus size={18} />}>
            Create User
          </Button>
        )}
      </div>

      {/* Stats Cards with System Health */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Total Users</p>
            <p className="text-2xl font-bold text-slate-900">{data.totalUsers}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Skills</p>
            <p className="text-2xl font-bold text-slate-900">{data.totalSkills}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <List size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Entries</p>
            <p className="text-2xl font-bold text-slate-900">{data.totalEntries}</p>
          </div>
        </div>
        {/* System Health Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center gap-1">
          <div className="flex justify-between items-center mb-1">
             <div className="flex items-center gap-2">
                <Database size={16} className="text-slate-400"/>
                <span className="text-xs font-medium text-slate-500 uppercase">Storage</span>
             </div>
             <span className="text-xs font-bold text-slate-700">
                {Math.round((data.system.storageUsedKB / data.system.storageLimitKB) * 100)}%
             </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
             <div 
               className="bg-indigo-500 h-2 rounded-full" 
               style={{ width: `${(data.system.storageUsedKB / data.system.storageLimitKB) * 100}%` }}
             ></div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
             {data.system.storageUsedKB} KB used of ~5MB
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="flex gap-6 min-w-max" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'users'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Users size={16} />
            User Management
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'announcements'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Bell size={16} />
            Announcements
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'logs'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Activity size={16} />
            Activity Logs
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'maintenance'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <HardDrive size={16} />
            System Maintenance
          </button>
        </nav>
      </div>

      {/* --- TAB CONTENT: USERS --- */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in duration-300">
           {/* Chart */}
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="text-lg font-bold text-slate-900 mb-6">User Activity</h3>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.users}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="stats.entries" name="Entries" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="stats.skills" name="Skills" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
           </div>

           {/* Table */}
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
               <h3 className="text-lg font-bold text-slate-900">Registered Users</h3>
               <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                     type="text" 
                     placeholder="Search users..." 
                     className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                     <th className="px-6 py-4">User</th>
                     <th className="px-6 py-4">Role</th>
                     <th className="px-6 py-4">Joined</th>
                     <th className="px-6 py-4 text-center">Skills</th>
                     <th className="px-6 py-4 text-center">Entries</th>
                     <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {filteredUsers.map(user => (
                     <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                       <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                             {user.name.charAt(0).toUpperCase()}
                           </div>
                           <div>
                             <p className="font-medium text-slate-900">{user.name}</p>
                             <p className="text-xs text-slate-500">{user.email}</p>
                           </div>
                         </div>
                       </td>
                       <td className="px-6 py-4">
                         <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                           user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                           user.role === 'editor' ? 'bg-blue-100 text-blue-800' : 
                           'bg-slate-100 text-slate-800'
                         }`}>
                           {user.role}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-sm text-slate-500">
                         <div className="flex items-center gap-2">
                           <Calendar size={14} />
                           {new Date(user.joinedAt).toLocaleDateString()}
                         </div>
                       </td>
                       <td className="px-6 py-4 text-center text-sm font-medium text-slate-700">
                         {user.stats.skills}
                       </td>
                       <td className="px-6 py-4 text-center text-sm font-medium text-slate-700">
                         {user.stats.entries}
                       </td>
                       <td className="px-6 py-4 text-right">
                         <div className="flex items-center justify-end gap-1">
                           <button 
                             onClick={() => handleImpersonate(user)}
                             className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                             title="View As User (Impersonate)"
                             disabled={user.id === context?.user?.id}
                           >
                             <Eye size={16} />
                           </button>
                           <button 
                             onClick={() => openEditModal(user)}
                             className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                             title="Edit User"
                           >
                             <Edit2 size={16} />
                           </button>
                           <button 
                             onClick={() => openResetPasswordModal(user)}
                             className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                             title="Reset Password"
                           >
                             <Key size={16} />
                           </button>
                           <button 
                             onClick={() => openDeleteModal(user)}
                             className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                             title="Delete User"
                             disabled={user.id === context?.user?.id}
                           >
                             <Trash2 size={16} />
                           </button>
                         </div>
                       </td>
                     </tr>
                   ))}
                   {filteredUsers.length === 0 && (
                     <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No users found matching "{searchTerm}"</td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
           </div>
        </div>
      )}

      {/* --- TAB CONTENT: ANNOUNCEMENTS --- */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
           {/* Create Form */}
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Post Announcement</h3>
              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                    <textarea 
                       className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                       rows={4}
                       placeholder="Write a message for all users..."
                       value={newAnnounceMsg}
                       onChange={e => setNewAnnounceMsg(e.target.value)}
                    ></textarea>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                    <div className="flex gap-2">
                       {(['info', 'warning', 'success'] as const).map(type => (
                          <button
                             key={type}
                             type="button"
                             onClick={() => setNewAnnounceType(type)}
                             className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border ${
                                newAnnounceType === type 
                                ? type === 'info' ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : type === 'warning' ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-white text-slate-600 border-slate-200'
                             }`}
                          >
                             {type}
                          </button>
                       ))}
                    </div>
                 </div>
                 <Button type="submit" className="w-full">Post Message</Button>
              </form>
           </div>

           {/* List */}
           <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                 <h3 className="text-lg font-bold text-slate-900">Active Announcements</h3>
              </div>
              <div className="divide-y divide-slate-100">
                 {announcements.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No active announcements.</div>
                 ) : (
                    announcements.map(ann => (
                       <div key={ann.id} className="p-6 flex items-start justify-between group">
                          <div className="flex gap-4">
                             <div className={`p-2 rounded-lg h-fit ${
                                ann.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                                ann.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                                'bg-blue-50 text-blue-600'
                             }`}>
                                <Bell size={20} />
                             </div>
                             <div>
                                <p className="text-slate-900 font-medium mb-1">{ann.message}</p>
                                <p className="text-xs text-slate-500">
                                   Posted by {ann.createdBy} • {new Date(ann.createdAt).toLocaleString()}
                                </p>
                             </div>
                          </div>
                          <button 
                             onClick={() => handleDeleteAnnouncement(ann.id)}
                             className="text-slate-300 hover:text-rose-500 transition-colors"
                          >
                             <Trash2 size={18} />
                          </button>
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      )}

      {/* --- TAB CONTENT: ACTIVITY LOGS --- */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
           <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                 <h3 className="text-lg font-bold text-slate-900">System Activity Logs</h3>
                 <p className="text-sm text-slate-500">Recent actions performed by users and admins.</p>
              </div>
              <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                     type="text" 
                     placeholder="Search by email or action..." 
                     className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                     value={logSearchTerm}
                     onChange={(e) => setLogSearchTerm(e.target.value)}
                  />
               </div>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                       <th className="px-6 py-4">Timestamp</th>
                       <th className="px-6 py-4">Action</th>
                       <th className="px-6 py-4">Details</th>
                       <th className="px-6 py-4">Performed By</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {filteredLogs.length === 0 ? (
                       <tr><td colSpan={4} className="p-8 text-center text-slate-500">No logs found matching "{logSearchTerm}".</td></tr>
                    ) : (
                       filteredLogs.map(log => (
                          <tr key={log.id} className="hover:bg-slate-50">
                             <td className="px-6 py-3 text-sm text-slate-500 font-mono">
                                {new Date(log.timestamp).toLocaleString()}
                             </td>
                             <td className="px-6 py-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                                   {log.action}
                                </span>
                             </td>
                             <td className="px-6 py-3 text-sm text-slate-700">
                                {log.details}
                             </td>
                             <td className="px-6 py-3 text-sm text-slate-500">
                                {log.performedBy}
                             </td>
                          </tr>
                       ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* --- TAB CONTENT: MAINTENANCE --- */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                   <HardDrive size={20} className="text-indigo-600" />
                   System-Wide Backup & Restore
                </h3>
                <p className="text-slate-500 text-sm mb-6">
                   These tools allow you to backup the entire application database (Users + Skills + Logs) or restore it on a new device.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                                <Download size={20} />
                            </div>
                            <h4 className="font-semibold text-slate-800">Export System Data</h4>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">
                            Download a full JSON dump of the entire system. Includes user credentials, skills, logs, and settings.
                        </p>
                        <Button onClick={handleSystemExport} className="w-full">
                           Download Full Backup
                        </Button>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-3">
                             <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                                <Upload size={20} />
                            </div>
                            <h4 className="font-semibold text-slate-800">Restore System Data</h4>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">
                            Restore the system from a previous backup file. <span className="text-rose-600 font-bold">Warning: This overwrites everything.</span>
                        </p>
                        <div className="relative">
                            <input 
                                type="file" 
                                accept=".json"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleSystemImport}
                            />
                            <Button variant="secondary" className="w-full">
                                Upload Backup File
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Create User Input Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Create New User</h2>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUserClick} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@domain.com"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as any)}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
                <Button type="submit">Continue</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmCreateOpen && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-300 border-l-4 border-indigo-500">
               <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle size={20} className="text-indigo-600"/>
                  Verify Email Address
               </h3>
               <p className="text-slate-600 text-sm mb-4">
                  Please confirm this email is correct. Typos can prevent the user from logging in.
               </p>
               <div className="bg-slate-100 p-4 rounded-lg mb-6 text-center">
                  <span className="block text-xl font-bold text-slate-800 break-all">
                     {newEmail}
                  </span>
               </div>
               <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => { setConfirmCreateOpen(false); setCreateModalOpen(true); }}>
                     Go Back & Edit
                  </Button>
                  <Button onClick={confirmCreateUser}>
                     Yes, Create Account
                  </Button>
               </div>
            </div>
         </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Edit User</h2>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as any)}
                >
                  <option value="user">User</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => setEditModalOpen(false)}>Cancel</Button>
                <Button type="submit">Update User</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Reset Password</h2>
            <p className="text-slate-500 text-sm mb-4">
              Enter a new password for <strong>{selectedUser.name}</strong>.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input 
                  type="text" 
                  required
                  minLength={6}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={resetPassword}
                  onChange={e => setResetPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setResetPasswordModalOpen(false)}>Cancel</Button>
                <Button type="submit">Set Password</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200 border-l-4 border-rose-500">
            <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Trash2 className="text-rose-600" size={20} />
              Delete User?
            </h2>
            <p className="text-slate-600 text-sm mb-6">
              Are you sure you want to delete <strong>{selectedUser.name}</strong> ({selectedUser.email})? 
              <br/><br/>
              This will permanently remove their account and all their learning data. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
              <Button type="button" variant="danger" onClick={handleDeleteUser}>Yes, Delete User</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
