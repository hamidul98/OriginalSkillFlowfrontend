
import React, { useContext } from 'react';
import { AppContext } from '../App';
import { Button } from '../components/ui/Button';
import { Download, Upload, RefreshCw, Trash2, FileSpreadsheet } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const Settings: React.FC = () => {
  const context = useContext(AppContext);

  const handleExportJSON = () => {
    if (!context?.user || !context?.skills) return;
    const data = JSON.stringify(context.skills, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `skillflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Backup exported successfully.');
  };

  const handleExportCSV = () => {
    if (!context?.user || !context?.skills) return;
    const skills = context.skills;
    // CSV Header
    let csvContent = "Skill Name,Module,Date,Topic,Subject,Status,Video URL,Website URL,Docs URL,Other URL\n";
    
    skills.forEach(skill => {
        skill.entries.forEach(entry => {
            // Escape double quotes by doubling them
            const escape = (text: string) => text ? `"${text.replace(/"/g, '""')}"` : '""';
            
            const row = [
                escape(skill.name),
                escape(entry.module || ''),
                escape(entry.date),
                escape(entry.topic),
                escape(entry.subject),
                escape(entry.progress),
                escape(entry.videoUrl || ''),
                escape(entry.websiteUrl || ''),
                escape(entry.docsUrl || ''),
                escape(entry.otherUrl || '')
            ].join(",");
            csvContent += row + "\n";
        });
    });

    // Add BOM for Excel UTF-8 compatibility
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `skillflow-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported to Excel (CSV) successfully.');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!context?.user) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result === 'string') {
          const parsed = JSON.parse(result);
          // Simple validation
          if (Array.isArray(parsed) && parsed.every(s => s.id && s.entries)) {
             localStorage.setItem(`skillflow_data_${context.user.id}`, result);
             window.location.reload(); // Force reload to apply import
          } else {
             toast.error('Invalid backup file format.');
          }
        }
      } catch (err) {
        toast.error('Failed to parse file.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm("CRITICAL WARNING: This will delete ALL your skills and entries permanently. This action cannot be undone. Are you sure?")) {
      context?.resetApp();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
           <RefreshCw size={20} className="text-indigo-600"/>
           Data Management
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          Manage your local data. Export your learning history for backup or transfer it to another device.
        </p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Export Backup (JSON)</p>
              <p className="text-xs text-slate-500">Download a full JSON backup of all skills and entries.</p>
            </div>
            <Button onClick={handleExportJSON} variant="secondary" icon={<Download size={16}/>}>
              JSON
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Export to Excel</p>
              <p className="text-xs text-slate-500">Download all data as a CSV file for spreadsheet analysis.</p>
            </div>
            <Button onClick={handleExportCSV} variant="secondary" icon={<FileSpreadsheet size={16}/>}>
              Excel
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Import Data</p>
              <p className="text-xs text-slate-500">Restore from a JSON backup file.</p>
            </div>
            <div className="relative">
               <input 
                  type="file" 
                  accept=".json"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleImport}
               />
               <Button variant="secondary" icon={<Upload size={16}/>}>
                 Import
               </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm">
        <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
           <Trash2 size={20} />
           Danger Zone
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          Resetting the application will remove all skills, settings, and progress.
        </p>
        <div className="flex justify-end">
          <Button variant="danger" onClick={handleReset}>
            Reset All Data
          </Button>
        </div>
      </div>

      <div className="text-center pt-8 border-t border-slate-200">
         <p className="text-sm text-slate-500">SkillFlow v1.1.0</p>
         <p className="text-xs text-slate-400 mt-2">
           A project for lifelong learners.
         </p>
      </div>
    </div>
  );
};
