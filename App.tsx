
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  NCCLOp, 
  NCCLSession, 
  NCCLLogEntry, 
  NCCLMetric, 
  NCCLTopologyNode, 
  NCCLTopologyEdge,
  NCCLTopologyType
} from './types';
import { generateMockLog, generateMockMetric } from './services/ncclSimulator';
import { TopologyGraph } from './components/TopologyGraph';
import { LogStream } from './components/LogStream';
import { MetricsPanel } from './components/MetricsPanel';

// Icons as simple SVGs to avoid dependency overhead
const PlayIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StopIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H10a1 1 0 01-1-1v-4z" />
  </svg>
);

const App: React.FC = () => {
  const [session, setSession] = useState<NCCLSession>({
    isRunning: false,
    algorithm: NCCLOp.ALLREDUCE,
    numRanks: 8,
    numNodes: 1,
    metrics: [],
    logs: [],
    topology: { nodes: [], edges: [] }
  });

  const [activeRank, setActiveRank] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);

  // Initialize nodes for the topology
  useEffect(() => {
    const nodes: NCCLTopologyNode[] = Array.from({ length: 8 }).map((_, i) => ({
      id: `rank-${i}`,
      rank: i,
      gpuId: i % 4,
      host: `gpu-node-01`,
      active: true
    }));

    const edges: NCCLTopologyEdge[] = nodes.map((node, i) => ({
      source: node.rank.toString(),
      target: ((node.rank + 1) % nodes.length).toString(),
      bandwidth: 100,
      type: NCCLTopologyType.RING
    }));

    setSession(prev => ({ ...prev, topology: { nodes, edges } }));
  }, []);

  const toggleSession = () => {
    setSession(prev => ({
      ...prev,
      isRunning: !prev.isRunning,
      logs: !prev.isRunning ? [] : prev.logs,
      metrics: !prev.isRunning ? [] : prev.metrics
    }));
  };

  useEffect(() => {
    if (session.isRunning) {
      intervalRef.current = window.setInterval(() => {
        // Update Metrics
        setSession(prev => {
          const newMetric = generateMockMetric(prev.metrics[prev.metrics.length - 1]);
          const newMetrics = [...prev.metrics, newMetric].slice(-100);
          
          // Update Logs
          const randomRank = Math.floor(Math.random() * 8);
          const newLog: NCCLLogEntry = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            rank: randomRank,
            node: 'gpu-node-01',
            message: generateMockLog(randomRank, prev.algorithm),
            type: 'INFO'
          };
          
          setActiveRank(randomRank);
          
          return {
            ...prev,
            metrics: newMetrics,
            logs: [...prev.logs, newLog].slice(-500)
          };
        });
      }, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session.isRunning]);

  return (
    <div className="h-screen w-screen flex flex-col p-4 gap-4 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-6 py-4 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
            <span className="text-white font-black text-xl">N</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">NCCL Insight Pro</h1>
            <p className="text-xs text-slate-500 font-medium">Real-time Collective Communications Analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Algorithm</span>
              <select 
                className="bg-transparent text-sm font-semibold text-slate-200 outline-none focus:text-blue-400"
                value={session.algorithm}
                onChange={(e) => setSession(prev => ({ ...prev, algorithm: e.target.value as NCCLOp }))}
              >
                {Object.values(NCCLOp).map(op => (
                  <option key={op} value={op} className="bg-slate-900">{op}</option>
                ))}
              </select>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Ranks</span>
              <span className="text-sm font-semibold text-slate-200">{session.numRanks} GPUs</span>
            </div>
          </div>

          <button
            onClick={toggleSession}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all duration-300 ${
              session.isRunning 
                ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/50' 
                : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/50'
            }`}
          >
            {session.isRunning ? <StopIcon /> : <PlayIcon />}
            {session.isRunning ? 'Stop Test' : 'Run nccl-tests'}
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Left Column: Topology & Logs */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-4 min-h-0">
          <div className="flex-[3] min-h-0">
            <TopologyGraph 
              nodes={session.topology.nodes} 
              edges={session.topology.edges} 
              activeRank={activeRank}
            />
          </div>
          <div className="flex-[2] min-h-0">
            <LogStream logs={session.logs} />
          </div>
        </section>

        {/* Right Column: Metrics & Detailed Stats */}
        <section className="col-span-12 lg:col-span-8 flex flex-col gap-4 min-h-0">
          <div className="flex-1 min-h-0">
            <MetricsPanel metrics={session.metrics} />
          </div>
          
          {/* Instructions / Tips */}
          <div className="bg-blue-900/10 border border-blue-900/30 rounded-xl p-4 flex gap-4 items-start">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-bold text-blue-300 uppercase mb-1">Observation Guide</h3>
              <p className="text-[11px] text-blue-200/70 leading-relaxed">
                To capture real data from your Linux system, run your benchmark with: 
                <code className="mx-1 px-1 bg-blue-500/20 rounded text-blue-300 mono">NCCL_DEBUG=INFO mpirun -np 8 ./all_reduce_perf -b 8 -e 128M -f 2</code>
                The dashboard will automatically parse the stderr stream for topology mapping and phase transitions.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Status Bar */}
      <footer className="h-6 flex items-center justify-between px-2 text-[10px] text-slate-600 font-mono uppercase tracking-widest">
        <div className="flex gap-4">
          <span>ENV: CUDA_VISIBLE_DEVICES=0,1,2,3,4,5,6,7</span>
          <span>NCCL_DEBUG_SUBSYS: GRAPH,ENV,TUNING</span>
        </div>
        <div className="flex items-center gap-2">
          <span>System Status: Optimal</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
        </div>
      </footer>
    </div>
  );
};

export default App;
