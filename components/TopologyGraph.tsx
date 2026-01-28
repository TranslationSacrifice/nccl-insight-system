
import React, { useMemo } from 'react';
import { NCCLTopologyNode, NCCLTopologyEdge } from '../types';

interface TopologyGraphProps {
  nodes: NCCLTopologyNode[];
  edges: NCCLTopologyEdge[];
  activeRank?: number;
}

export const TopologyGraph: React.FC<TopologyGraphProps> = ({ nodes, edges, activeRank }) => {
  const centerX = 200;
  const centerY = 200;
  const radius = 140;

  const nodePositions = useMemo(() => {
    return nodes.map((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });
  }, [nodes, radius]);

  const findPos = (rank: number) => nodePositions.find(n => n.rank === rank) || { x: 0, y: 0 };

  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800 relative overflow-hidden">
      <div className="absolute top-4 left-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Communication Topology
      </div>
      <svg viewBox="0 0 400 400" className="w-full h-full max-w-[500px]">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => {
          const from = findPos(parseInt(edge.source));
          const to = findPos(parseInt(edge.target));
          const isActive = parseInt(edge.source) === activeRank;
          return (
            <path
              key={`edge-${i}`}
              d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
              className={`${isActive ? 'stroke-blue-400 stroke-[3px]' : 'stroke-slate-700 stroke-[1px]'} transition-all duration-300`}
              markerEnd="url(#arrow)"
              fill="none"
            />
          );
        })}

        {/* Nodes */}
        {nodePositions.map((node) => (
          <g key={`node-${node.rank}`} className="cursor-pointer group">
            <circle
              cx={node.x}
              cy={node.y}
              r="16"
              className={`${
                node.rank === activeRank 
                  ? 'fill-blue-500 stroke-blue-300' 
                  : 'fill-slate-800 stroke-slate-600'
              } stroke-2 transition-all duration-300 group-hover:scale-110`}
            />
            {node.rank === activeRank && (
              <circle
                cx={node.x}
                cy={node.y}
                r="16"
                className="fill-none stroke-blue-400 stroke-1 animate-ping"
              />
            )}
            <text
              x={node.x}
              y={node.y}
              dy="0.35em"
              textAnchor="middle"
              className="fill-white text-[10px] font-bold select-none pointer-events-none"
            >
              R{node.rank}
            </text>
            <text
              x={node.x}
              y={node.y + 25}
              textAnchor="middle"
              className="fill-slate-400 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {node.host}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};
