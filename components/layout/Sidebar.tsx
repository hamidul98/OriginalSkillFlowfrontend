
import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart2, Settings, Hexagon, LogOut, Shield } from 'lucide-react';
import { AppContext } from '../../App';

interface SidebarProps {
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const context = useContext(AppContext);
  const skills = context?.skills || [];
  const user = context?.user;

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
      isActive 
        ? 'bg-indigo-50 text-indigo-700' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <div className="flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <Hexagon className="w-6 h-6 text-indigo-600 mr-2 fill-indigo-100" />
        <span className="text-lg font-bold text-slate-800 tracking-tight">SkillFlow</span>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
        <div>
          <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Main
          </h3>
          <nav className="space-y-1">
            <NavLink to="/" onClick={onCloseMobile} className={navItemClass}>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            <NavLink to="/analytics" onClick={onCloseMobile} className={navItemClass}>
              <BarChart2 size={18} />
              Analytics
            </NavLink>
            <NavLink to="/settings" onClick={onCloseMobile} className={navItemClass}>
              <Settings size={18} />
              Settings
            </NavLink>
          </nav>
        </div>

        {/* Admin Link - Only visible if role is admin */}
        {user?.role === 'admin' && (
          <div>
            <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Administration
            </h3>
            <nav className="space-y-1">
              <NavLink to="/admin" onClick={onCloseMobile} className={navItemClass}>
                <Shield size={18} />
                Admin Panel
              </NavLink>
            </nav>
          </div>
        )}

        <div>
          <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex justify-between items-center">
            My Skills
          </h3>
          <nav className="space-y-1">
            {skills.length === 0 ? (
              <p className="px-3 text-sm text-slate-400 italic">No skills yet.</p>
            ) : (
              skills.map(skill => (
                <NavLink 
                  key={skill.id} 
                  to={`/skill/${skill.id}`} 
                  onClick={onCloseMobile}
                  className={navItemClass}
                >
                  <span 
                    className="w-2 h-2 rounded-full mr-1" 
                    style={{ backgroundColor: skill.themeColor }}
                  />
                  <span className="truncate">{skill.name}</span>
                  <span className="ml-auto text-xs bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full">
                    {skill.entries.length}
                  </span>
                </NavLink>
              ))
            )}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200">
        <button 
          onClick={context?.logout}
          className="flex items-center gap-3 px-3 py-2 w-full text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors text-sm font-medium"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </div>
  );
};
