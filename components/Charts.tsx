
import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, AreaChart, Area 
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl">
        <p className="text-[10px] font-black text-slate-500 uppercase mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="text-[11px] font-bold" style={{ color: item.color }}>{item.name}:</span>
              <span className="text-[11px] font-mono font-black text-white">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const MultiLineChart: React.FC<{ data: any[], xKey: string, lines: { key: string, color: string }[] }> = ({ data, xKey, lines }) => (
  <div className="h-64 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey={xKey} stroke="#475569" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} dy={10} />
        <YAxis stroke="#475569" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        {lines.map(line => (
          <Line key={line.key} type="monotone" dataKey={line.key} name={line.key.toUpperCase()} stroke={line.color} strokeWidth={3} dot={{ r: 4, fill: line.color, strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6, strokeWidth: 0 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export const ComparisonBarChart: React.FC<{ data: any[], xKey: string, bars: { key: string, color: string }[] }> = ({ data, xKey, bars }) => (
  <div className="h-64 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey={xKey} stroke="#475569" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} dy={10} />
        <YAxis stroke="#475569" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
        <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
        {bars.map(bar => (
          <Bar key={bar.key} dataKey={bar.key} fill={bar.color} radius={[6, 6, 0, 0]} barSize={20} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const PriceAreaChart: React.FC<{ data: any[], xKey: string, yKey: string, color: string }> = ({ data, xKey, yKey, color }) => (
  <div className="h-72 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`color-${yKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey={xKey} hide />
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
        <Area type="monotone" dataKey={yKey} stroke={color} strokeWidth={3} fillOpacity={1} fill={`url(#color-${yKey})`} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);
