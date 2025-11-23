import React, { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Entry, ProgressLevel } from '../types';
import { ArrowLeft, Plus, Trash2, Edit2, Search, Filter, ExternalLink, FileText, Youtube, Globe, MoreHorizontal, Layers, ListPlus } from 'lucide-react';

export const SkillDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const context = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProgress, setFilterProgress] = useState<string>('All');
  const [isEntryModalOpen, setEntryModalOpen] = useState(false);
  const [isBulkModalOpen, setBulkModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [deleteSkillModal, setDeleteSkillModal] = useState(false);

  if (!context || !id) return null;
  const { skills, deleteSkill, addEntry, addBulkEntries, updateEntry, deleteEntry } = context;
  
  const skill = skills.find(s => s.id === id);
  if (!skill) return <div className="text-center mt-20">Skill not found</div>;

  const handleDeleteSkill = () => {
    deleteSkill(id);
    navigate('/');
  };

  const filteredEntries = skill.entries.filter(entry => {
    const matchesSearch = 
      entry.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.module || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterProgress === 'All' || entry.progress === filterProgress;
    return matchesSearch && matchesFilter;
  });

  // Group entries by module
  const groupedEntries: Record<string, Entry[]> = {};
  filteredEntries.forEach(entry => {
    const moduleName = entry.module || 'Uncategorized';
    if (!groupedEntries[moduleName]) {
      groupedEntries[moduleName] = [];
    }
    groupedEntries[moduleName].push(entry);
  });

  // Sort modules: Oldest Created Module First (Newest at Bottom)
  // Logic: Find the index of the OLDEST entry for each module in the master list.
  // The module with the oldest entry (Highest Index in Newest->Oldest array) comes first.
  const moduleNames = Object.keys(groupedEntries).sort((a, b) => {
    if (a === 'Uncategorized') return -1;
    if (b === 'Uncategorized') return 1;

    // We map over the full entry list to determine canonical order, 
    // ensuring filtered views don't jump around.
    const moduleList = skill.entries.map(e => e.module || 'Uncategorized');
    
    // Find the last index (which corresponds to the oldest entry because entries are Newest->Oldest)
    const lastIndexA = moduleList.lastIndexOf(a);
    const lastIndexB = moduleList.lastIndexOf(b);

    // Sort descending by index (Higher index = Older entry = Show first)
    return lastIndexB - lastIndexA;
  });

  // Available modules for autocomplete
  const existingModules = Array.from(new Set(skill.entries.map(e => e.module).filter(Boolean))) as string[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              {skill.name}
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: skill.themeColor }} />
            </h1>
            <p className="text-sm text-slate-500">
              {skill.entries.length} learning entries tracked
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto flex-wrap justify-end">
          <Button variant="danger" className="w-auto" onClick={() => setDeleteSkillModal(true)}>
             <Trash2 size={16} />
          </Button>
          <Button 
            className="w-auto"
            variant="secondary"
            icon={<ListPlus size={18} />} 
            onClick={() => setBulkModalOpen(true)}
          >
            Bulk Add
          </Button>
          <Button 
            className="w-auto shadow-indigo-100 shadow-lg" 
            icon={<Plus size={18} />} 
            onClick={() => { setEditingEntry(null); setEntryModalOpen(true); }}
          >
            Add Entry
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search topic, subject or module..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <select 
            className="w-full pl-10 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
            value={filterProgress}
            onChange={(e) => setFilterProgress(e.target.value)}
          >
            <option value="All">All Statuses</option>
            {Object.values(ProgressLevel).map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Entries List Grouped by Module */}
      <div className="space-y-8">
        {filteredEntries.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
            No entries found matching your criteria.
          </div>
        ) : (
          moduleNames.map(moduleName => (
            <div key={moduleName} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Module Header */}
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">
                  {moduleName}
                </h3>
                <span className="bg-white text-slate-500 text-xs px-2 py-0.5 rounded-full border border-slate-200">
                  {groupedEntries[moduleName].length}
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-slate-100 text-xs uppercase font-medium text-slate-400 tracking-wider">
                      <th className="px-6 py-3 font-medium">Date</th>
                      <th className="px-6 py-3 font-medium">Topic & Subject</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Resources</th>
                      <th className="px-6 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {groupedEntries[moduleName].map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 w-32">
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">{entry.topic}</span>
                            {entry.subject && <span className="text-xs text-slate-500">{entry.subject}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 w-40">
                          <Badge status={entry.progress} />
                        </td>
                        <td className="px-6 py-4 w-48">
                          <div className="flex items-center gap-2">
                            {entry.videoUrl && (
                              <a href={entry.videoUrl} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-700 bg-red-50 p-1 rounded transition-colors" title="Video">
                                <Youtube size={16} />
                              </a>
                            )}
                            {entry.websiteUrl && (
                              <a href={entry.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 bg-blue-50 p-1 rounded transition-colors" title="Website">
                                <Globe size={16} />
                              </a>
                            )}
                            {entry.docsUrl && (
                              <a href={entry.docsUrl} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 bg-orange-50 p-1 rounded transition-colors" title="Docs">
                                <FileText size={16} />
                              </a>
                            )}
                            {entry.otherUrl && (
                              <a href={entry.otherUrl} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-700 bg-slate-100 p-1 rounded transition-colors" title="Other">
                                <ExternalLink size={16} />
                              </a>
                            )}
                            {!entry.videoUrl && !entry.websiteUrl && !entry.docsUrl && !entry.otherUrl && (
                              <span className="text-slate-300 text-xs italic">No links</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right w-24">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => { setEditingEntry(entry); setEntryModalOpen(true); }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => {
                                if(window.confirm('Delete this entry?')) deleteEntry(skill.id, entry.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Entry Modal */}
      {isEntryModalOpen && (
        <EntryFormModal 
          isOpen={isEntryModalOpen} 
          onClose={() => setEntryModalOpen(false)} 
          initialData={editingEntry}
          existingModules={existingModules}
          onSave={(data) => {
            if (editingEntry) {
              updateEntry(skill.id, editingEntry.id, data);
            } else {
              addEntry(skill.id, data);
            }
            setEntryModalOpen(false);
          }}
        />
      )}

      {/* Bulk Add Modal */}
      {isBulkModalOpen && (
        <BulkEntryModal
          isOpen={isBulkModalOpen}
          onClose={() => setBulkModalOpen(false)}
          existingModules={existingModules}
          onSave={(module, topics) => {
            addBulkEntries(skill.id, module, topics);
            setBulkModalOpen(false);
          }}
        />
      )}

      {/* Delete Skill Confirmation Modal */}
      {deleteSkillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Skill?</h3>
            <p className="text-slate-600 text-sm mb-6">
              Are you sure you want to delete <strong>{skill.name}</strong>? This will permanently remove all {skill.entries.length} tracked entries. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteSkillModal(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleDeleteSkill}>Yes, Delete Skill</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Modals ---

// Entry Form Component
interface EntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Entry | null;
  existingModules: string[];
  onSave: (data: Omit<Entry, 'id'>) => void;
}

const EntryFormModal: React.FC<EntryFormProps> = ({ isOpen, onClose, initialData, existingModules, onSave }) => {
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    topic: initialData?.topic || '',
    subject: initialData?.subject || '',
    module: initialData?.module || '',
    progress: initialData?.progress || ProgressLevel.NotStarted,
    videoUrl: initialData?.videoUrl || '',
    websiteUrl: initialData?.websiteUrl || '',
    otherUrl: initialData?.otherUrl || '',
    docsUrl: initialData?.docsUrl || ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 md:p-8 animate-in fade-in zoom-in duration-200 my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">{initialData ? 'Edit Entry' : 'Add New Entry'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
              <input 
                type="date" 
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Progress Level *</label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                value={formData.progress}
                onChange={e => setFormData({...formData, progress: e.target.value as ProgressLevel})}
              >
                {Object.values(ProgressLevel).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Module (Optional)</label>
             <input 
                type="text" 
                list="modules-list"
                placeholder="e.g. Typography, Basics, Advanced..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={formData.module}
                onChange={e => setFormData({...formData, module: e.target.value})}
             />
             <datalist id="modules-list">
               {existingModules.map(m => <option key={m} value={m} />)}
             </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Topic *</label>
            <input 
              type="text" 
              required
              placeholder="e.g. React Hooks"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={formData.topic}
              onChange={e => setFormData({...formData, topic: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject / Subtitle</label>
            <input 
              type="text" 
              placeholder="e.g. useEffect and useState deep dive"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={formData.subject}
              onChange={e => setFormData({...formData, subject: e.target.value})}
            />
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Resources (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">YouTube URL</label>
                <div className="relative">
                  <Youtube className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                  <input 
                    type="url" 
                    className="w-full pl-9 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    placeholder="https://youtube.com/..."
                    value={formData.videoUrl}
                    onChange={e => setFormData({...formData, videoUrl: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Website URL</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                  <input 
                    type="url" 
                    className="w-full pl-9 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    placeholder="https://example.com"
                    value={formData.websiteUrl}
                    onChange={e => setFormData({...formData, websiteUrl: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Docs / Drive URL</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                  <input 
                    type="url" 
                    className="w-full pl-9 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    placeholder="https://docs.google.com/..."
                    value={formData.docsUrl}
                    onChange={e => setFormData({...formData, docsUrl: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Other Platform</label>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                  <input 
                    type="url" 
                    className="w-full pl-9 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    placeholder="Udemy, Coursera link..."
                    value={formData.otherUrl}
                    onChange={e => setFormData({...formData, otherUrl: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">{initialData ? 'Update Entry' : 'Save Entry'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Bulk Entry Modal Component
interface BulkEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  existingModules: string[];
  onSave: (module: string, topics: string[]) => void;
}

const BulkEntryModal: React.FC<BulkEntryFormProps> = ({ isOpen, onClose, existingModules, onSave }) => {
  const [module, setModule] = useState('');
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Split by new line, remove empty lines
    const topics = text.split('\n').map(t => t.trim()).filter(t => t.length > 0);
    if (topics.length > 0) {
      onSave(module, topics);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
             <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <ListPlus size={20} />
             </div>
             <h2 className="text-2xl font-bold text-slate-900">Bulk Add Entries</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
           <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 mb-4 border border-slate-100">
              <p>Quickly add multiple topics to a module. Each line in the text area below will become a separate entry.</p>
           </div>

           <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Module Name</label>
             <input 
                type="text" 
                list="bulk-modules-list"
                placeholder="e.g. Typography, Advanced State..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={module}
                onChange={e => setModule(e.target.value)}
                autoFocus
             />
             <datalist id="bulk-modules-list">
               {existingModules.map(m => <option key={m} value={m} />)}
             </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Topics List</label>
            <textarea
              className="w-full h-48 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-sm"
              placeholder={`Font Pairing\nLine Height\nKerning\nType Scale`}
              value={text}
              onChange={e => setText(e.target.value)}
            ></textarea>
            <p className="text-xs text-slate-500 mt-1 text-right">
               {text.split('\n').filter(t => t.trim()).length} entries will be created
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={text.trim().length === 0}>Generate Entries</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper Icon
const XIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);