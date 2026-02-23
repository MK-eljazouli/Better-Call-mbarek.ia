import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { DashboardStat, TopicData, LanguageData } from '../types';

const stats: DashboardStat[] = [
  { label: 'Citoyens aidés', value: '1,245', change: '+12%', icon: 'users', color: 'bg-blue-500' },
  { label: 'Démarches résolues', value: '890', change: '+8%', icon: 'check', color: 'bg-slate-500' },
  { label: 'Temps économisé', value: '320h', change: 'Total', icon: 'clock', color: 'bg-amber-500' },
  { label: 'Satisfaction', value: '4.8/5', change: 'Top', icon: 'trending', color: 'bg-purple-500' },
];

const topicData: TopicData[] = [
  { name: 'Passeport', value: 450, fill: '#475569' }, // Emerald 600
  { name: 'CNIE', value: 320, fill: '#64748b' }, // Emerald 500
  { name: 'CNSS / AMO', value: 210, fill: '#94a3b8' }, // Emerald 400
];

const langData: LanguageData[] = [
  { name: 'Darija', value: 65, fill: '#f59e0b' }, // Amber
  { name: 'Français', value: 25, fill: '#3b82f6' }, // Blue
  { name: 'Arabe', value: 10, fill: '#64748b' }, // Emerald
];

const Dashboard: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Tableau de Bord d'Impact</h2>
        <p className="text-gray-500">Statistiques en temps réel de Better Call mbarek</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${stat.color} bg-opacity-10`}>
                  {stat.icon === 'users' && <Users className={`h-6 w-6 text-${stat.color.replace('bg-', '')}`} />}
                  {stat.icon === 'check' && <CheckCircle className={`h-6 w-6 text-${stat.color.replace('bg-', '')}`} />}
                  {stat.icon === 'clock' && <Clock className={`h-6 w-6 text-${stat.color.replace('bg-', '')}`} />}
                  {stat.icon === 'trending' && <TrendingUp className={`h-6 w-6 text-${stat.color.replace('bg-', '')}`} />}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.label}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                      {stat.change && (
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-slate-600">
                          {stat.change}
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Topic Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Demandes par Démarche</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Language Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Langues utilisées</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={langData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {langData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;