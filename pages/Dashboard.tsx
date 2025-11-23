
import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { Button } from '../components/ui/Button';
import { ProgressLevel, Announcement } from '../types';
import { getAnnouncements } from '../services/storageService';
import { Plus, ArrowRight, Search, Activity, Book, Bell } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    // Load announcements
    setAnnouncements(getAnnouncements());
  }, []);

  if (!context) return null;
  const { skills, addSkill } = context;

  const totalEntries = skills.reduce((acc, skill) => acc + skill.entries.length, 0);
  const completedEntries = skills.reduce((acc, skill) => 
    acc + skill.entries.filter(e => e.progress === ProgressLevel.Complete).length, 0
  );
  
  const completionRate = totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0;

  const filteredSkills = skills.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkillName.trim()) {
      addSkill(newSkillName.trim());
      setNewSkillName('');
      setAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="space-y-2">
           {announcements.map(ann => (
             <div 
                key={ann.id} 
                className={`p-4 rounded-lg flex items-start gap-3 border ${
                   ann.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                   ann.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                   'bg-blue-50 border-blue-200 text-blue-800'
                }`}
             >
                <Bell size={18} className="mt-0.5 flex-shrink-0" />
                <div>
                   <p className="text-sm font-medium">{ann.message}</p>
                   <p className="text-xs opacity-80 mt-1">{new Date(ann.createdAt).toLocaleDateString()}</p>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 rounded-lg">
            <Book className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Skills</p>
            <p className="text-2xl font-bold text-slate-900">{skills.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-lg">
            <Activity className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Entries</p>
            <p className="text-2xl font-bold text-slate-900">{totalEntries}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="w-6 h-6 text-blue-600 font-bold text-center leading-6">%</div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Completion Rate</p>
            <p className="text-2xl font-bold text-slate-900">{completionRate}%</p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text"
            placeholder="Search skills..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setAddModalOpen(true)} icon={<Plus size={18} />}>
          Add Skill
        </Button>
      </div>

      {/* Skills Grid */}
      {filteredSkills.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
            <Book className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {searchQuery ? "No matching skills found" : "No skills added yet"}
          </h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            {searchQuery 
              ? "Try adjusting your search query." 
              : "Start tracking your learning journey by creating your first skill."}
          </p>
          {!searchQuery && (
            <Button onClick={() => setAddModalOpen(true)} variant="secondary">
              Create First Skill
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map(skill => {
            const skillCompleted = skill.entries.filter(e => e.progress === ProgressLevel.Complete).length;
            const skillTotal = skill.entries.length;
            const skillRate = skillTotal > 0 ? Math.round((skillCompleted / skillTotal) * 100) : 0;

            return (
              <div 
                key={skill.id} 
                className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
                onClick={() => navigate(`/skill/${skill.id}`)}
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-sm"
                      style={{ backgroundColor: skill.themeColor }}
                    >
                      {skill.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="bg-slate-50 px-2.5 py-1 rounded-full text-xs font-medium text-slate-600">
                      {skillTotal} Entries
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {skill.name}
                  </h3>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-2 mt-4">
                    <div 
                      className="h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${skillRate}%`, backgroundColor: skill.themeColor }} 
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Progress</span>
                    <span>{skillRate}%</span>
                  </div>
                </div>
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-500">Last updated recently</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Skill Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add New Skill</h2>
            <form onSubmit={handleCreateSkill}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Skill Name</label>
                <input 
                  autoFocus
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g., UI/UX, React, Piano..."
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-2">Examples: MERN Stack, Copywriting, Digital Marketing</p>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setAddModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={!newSkillName.trim()}>Save Skill</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
