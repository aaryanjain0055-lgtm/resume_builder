import React from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip
} from 'recharts';

interface SkillChartProps {
  data: {
    category: string;
    current: number;
    required: number;
  }[];
}

export const SkillChart: React.FC<SkillChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
          <Radar
            name="Your Level"
            dataKey="current"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="#3b82f6"
            fillOpacity={0.4}
          />
          <Radar
            name="Required Level"
            dataKey="required"
            stroke="#94a3b8"
            strokeWidth={2}
            fill="#94a3b8"
            fillOpacity={0.1}
            strokeDasharray="4 4"
          />
          <Legend />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};