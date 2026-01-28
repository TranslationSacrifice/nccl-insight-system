
import React, { useRef, useEffect } from 'react';
import { NCCLLogEntry } from '../types';

interface LogStreamProps {
  logs: NCCLLogEntry[];
}

export const LogStream: React.FC<LogStreamProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">NCCL Debug Stream</span>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] text-slate-500 font-mono">NCCL_DEBUG=INFO</span>
        </div>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 p-3 overflow-y-auto mono text-[11px] leading-relaxed scroll-smooth"
      >
        {logs.map((log) => (
          <div key={log.id} className="mb-1 flex gap-3 hover:bg-slate-800/30 py-0.5 rounded px-1 group">
            <span className="text-slate-600 shrink-0">
              {/* Fix: Use type assertion to bypass outdated environment type definitions for fractionalSecondDigits */}
              [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 } as any)}]
            </span>
            <span className={`shrink-0 font-bold ${log.rank % 8 === 0 ? 'text-blue-400' : 'text-emerald-400'}`}>
              Rank {log.rank}
            </span>
            <span className="text-slate-300 break-all">{log.message}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="h-full flex items-center justify-center text-slate-600 italic">
            Waiting for NCCL-test initialization...
          </div>
        )}
      </div>
    </div>
  );
};
