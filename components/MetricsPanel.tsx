
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { NCCLMetric } from '../types';

interface MetricsPanelProps {
  metrics: NCCLMetric[];
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  const latest = metrics[metrics.length - 1];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
      {/* Real-time stats */}
      <div className="md:col-span-1 grid grid-rows-3 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-xs text-slate-500 font-medium mb-1">Alg Bandwidth</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-400">{latest?.algBandwidth.toFixed(2) || '0.00'}</span>
            <span className="text-sm text-slate-500">GB/s</span>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-xs text-slate-500 font-medium mb-1">Bus Bandwidth</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400">{latest?.busBandwidth.toFixed(2) || '0.00'}</span>
            <span className="text-sm text-slate-500">GB/s</span>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-xs text-slate-500 font-medium mb-1">Avg. Latency</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-400">{latest?.latency.toFixed(1) || '0.0'}</span>
            <span className="text-sm text-slate-500">us</span>
          </div>
        </div>
      </div>

      {/* Bandwidth Chart */}
      <div className="md:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-4 min-h-[300px]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-slate-400 uppercase">Throughput History</span>
          <div className="flex gap-4 text-[10px]">
            <span className="flex items-center gap-1 text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-400" /> Algorithm
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Bus
            </span>
          </div>
        </div>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics.slice(-30)}>
              <defs>
                <linearGradient id="colorAlg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="timestamp" 
                hide 
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickFormatter={(val) => `${val}G`}
                domain={[0, 'auto']}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                itemStyle={{ fontSize: '10px' }}
                labelStyle={{ display: 'none' }}
              />
              <Area 
                type="monotone" 
                dataKey="algBandwidth" 
                stroke="#60a5fa" 
                fillOpacity={1} 
                fill="url(#colorAlg)" 
                strokeWidth={2}
                isAnimationActive={false}
              />
              <Area 
                type="monotone" 
                dataKey="busBandwidth" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorBus)" 
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
