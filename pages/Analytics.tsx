
import React, { useContext } from 'react';
import { AppContext } from '../App';
import { ProgressLevel } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Activity } from 'lucide-react';

export const Analytics: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return null;
  const { skills } = context;

  // Data for Bar Chart (Entries per Skill)
  const entriesPerSkillData = skills.map(skill => ({
    name: skill.name,
    entries: skill.entries.length,
    fill: skill.themeColor
  }));

  // Data for Pie Chart (Overall Progress Distribution)
  const allEntries = skills.flatMap(s => s.entries);
  const statusCounts = allEntries.reduce((acc, entry) => {
    acc[entry.progress] = (acc[entry.progress] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(ProgressLevel).map(key => {
    const label = ProgressLevel[key as keyof typeof ProgressLevel];
    return {
      name: label,
      value: statusCounts[label] || 0
    };
  }).filter(d => d.value > 0);

  const COLORS = {
    [ProgressLevel.NotStarted]: '#94a3b8', // Slate 400
    [ProgressLevel.OnGoing]: '#f59e0b', // Amber 500
    [ProgressLevel.Complete]: '#10b981', // Emerald 500
    [ProgressLevel.Hold]: '#6366f1', // Indigo 500
  };

  if (allEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="p-4 bg-slate-100 rounded-full mb-4">
          <Activity className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">No Data Available</h2>
        <p className="text-slate-500 max-w-md mt-2">
          Start adding skills and entries to see your learning analytics visualization here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-900">Learning Insights</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Entries per Skill Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Entries by Skill</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={entriesPerSkillData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
              <YAxis allowDecimals={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f1f5f9' }}
              />
              <Bar dataKey="entries" radius={[4, 4, 0, 0]}>
                {entriesPerSkillData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Progress Distribution Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Overall Progress Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as ProgressLevel]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h3>
        <div className="divide-y divide-slate-100">
          {skills
            .flatMap(skill => skill.entries.map(e => ({ ...e, skillName: skill.name, skillColor: skill.themeColor })))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
            .map(entry => (
              <div key={entry.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.skillColor }} />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{entry.topic}</p>
                    <p className="text-xs text-slate-500">{entry.skillName} • {entry.subject}</p>
                  </div>
                </div>
                <div className="text-right">
                   <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                     entry.progress === ProgressLevel.Complete ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                   }`}>
                     {entry.progress}
                   </span>
                   <p className="text-xs text-slate-400 mt-1">{new Date(entry.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
