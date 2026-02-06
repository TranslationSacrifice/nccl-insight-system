import React from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Line, ComposedChart } from 'recharts';
import { NCCLMetric } from '../types';

/** 将 size(B) 格式化为短标签：8, 16, 1K, 128K, 128M 等 */
function formatSize(size: number): string {
  if (size < 1024) return String(size);
  if (size < 1024 * 1024) return `${(size / 1024) | 0}K`;
  return `${(size / (1024 * 1024)) | 0}M`;
}

interface MetricsPanelProps {
  metrics: NCCLMetric[];
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  const latest = metrics[metrics.length - 1];
  const chartData = metrics;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
      {/* Real-time stats */}
      <div className="md:col-span-1 grid grid-rows-3 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-xs text-slate-500 font-medium mb-1">Alg Bandwidth (out-of-place)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-400">{latest?.algBandwidth.toFixed(2) || '0.00'}</span>
            <span className="text-sm text-slate-500">GB/s</span>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-xs text-slate-500 font-medium mb-1">Alg Bandwidth (in-place)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-violet-400">{latest?.algBandwidthInPlace?.toFixed(2) ?? '0.00'}</span>
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

      {/* Bandwidth Chart：横轴为 size(B)，纵轴为带宽 GB/s */}
      <div className="md:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-4 min-h-[300px]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-slate-400 uppercase">Bandwidth vs Size (B)</span>
          <div className="flex flex-wrap gap-3 text-[10px]">
            <span className="flex items-center gap-1 text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-400" /> out-place Alg
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> out-place Bus
            </span>
            <span className="flex items-center gap-1 text-violet-400">
              <span className="w-2 h-2 rounded-full bg-violet-400" /> in-place Alg
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> in-place Bus
            </span>
          </div>
        </div>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAlg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAlgInPlace" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBusInPlace" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="size"
                type="number"
                scale="log"
                domain={['auto', 'auto']}
                tickFormatter={formatSize}
                stroke="#64748b"
                fontSize={10}
                tick={{ fill: '#94a3b8' }}
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
                labelFormatter={(val) => `size: ${formatSize(Number(val))} B`}
                formatter={(val: number, name: string) => [
                  `${typeof val === 'number' && !Number.isNaN(val) ? val.toFixed(2) : val} GB/s`,
                  name
                ]}
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
              <Line
                type="monotone"
                dataKey="algBandwidthInPlace"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="busBandwidthInPlace"
                stroke="#fbbf24"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
