
import React, { useMemo, useState } from 'react';
import { NCCLTopologyNode, NCCLTopologyEdge } from '../types';

interface TopologyGraphProps {
  nodes: NCCLTopologyNode[];
  edges: NCCLTopologyEdge[];
  activeRank?: number;
}

export const TopologyGraph: React.FC<TopologyGraphProps> = ({ nodes, edges, activeRank }) => {
  const [hoveredRank, setHoveredRank] = useState<number | null>(null);
  const centerX = 200;
  const centerY = 200;
  const radius = 140;

  const nodePositions = useMemo(() => {
    return nodes.map((node, i) => {
      const angle = (i / Math.max(1, nodes.length)) * 2 * Math.PI - Math.PI / 2;
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });
  }, [nodes, radius]);

  const findPos = (rankStr: string) => {
    const rank = parseInt(rankStr, 10);
    return nodePositions.find(n => n.rank === rank) || { x: centerX, y: centerY };
  };

  // 按 rank 数值排序边，用于绘制
  const sortedEdges = useMemo(() => {
    return [...edges].sort((a, b) => {
      const aSource = parseInt(a.source, 10);
      const bSource = parseInt(b.source, 10);
      return aSource - bSource;
    });
  }, [edges]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800 relative overflow-hidden p-4">
      <div className="absolute top-4 left-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Communication Topology
      </div>
      
      {/* 显示拓扑信息 */}
      {nodes.length > 0 && (
        <div className="absolute top-4 right-4 text-xs text-slate-400 bg-slate-900/70 px-3 py-2 rounded border border-slate-700">
          <div className="font-semibold text-slate-300">{nodes.length} GPUs</div>
          <div className="text-slate-500">{edges.length} connections</div>
          {edges.length > 0 && (
            <div className="text-slate-500 text-[10px] mt-1">
              Type: {edges[0]?.type || 'Ring'}
            </div>
          )}
        </div>
      )}

      <svg viewBox="0 0 400 400" className="w-full h-full max-w-[500px]">
        <defs>
          <marker 
            id="arrow" 
            viewBox="0 0 10 10" 
            refX="18" 
            refY="5" 
            markerWidth="4" 
            markerHeight="4" 
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
          <marker 
            id="arrow-hover" 
            viewBox="0 0 10 10" 
            refX="18" 
            refY="5" 
            markerWidth="4" 
            markerHeight="4" 
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#60a5fa" />
          </marker>
        </defs>

        {/* Edges with gradient */}
        {sortedEdges.map((edge, i) => {
          const from = findPos(edge.source);
          const to = findPos(edge.target);
          const sourceRank = parseInt(edge.source, 10);
          const isActive = sourceRank === activeRank;
          const isHovered = sourceRank === hoveredRank || parseInt(edge.target, 10) === hoveredRank;
          
          return (
            <g key={`edge-${i}`}>
              <path
                d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
                className={`transition-all duration-300 ${
                  isActive 
                    ? 'stroke-blue-400 stroke-[3px]' 
                    : isHovered
                    ? 'stroke-blue-300 stroke-[2px]'
                    : 'stroke-slate-700 stroke-[1px]'
                }`}
                markerEnd={isActive || isHovered ? 'url(#arrow-hover)' : 'url(#arrow)'}
                fill="none"
              />
              {/* 边标签 - 显示带宽 */}
              {sortedEdges.length <= 8 && (
                <text
                  x={(from.x + to.x) / 2}
                  y={(from.y + to.y) / 2 - 8}
                  textAnchor="middle"
                  className="text-[8px] fill-slate-500 opacity-60 font-medium"
                >
                  {edge.bandwidth}Gbps
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodePositions.map((node) => {
          const isActive = node.rank === activeRank;
          const isHovered = node.rank === hoveredRank;
          
          return (
            <g 
              key={`node-${node.rank}`} 
              className="cursor-pointer group"
              onMouseEnter={() => setHoveredRank(node.rank)}
              onMouseLeave={() => setHoveredRank(null)}
            >
              {/* 背景光晕 */}
              {(isActive || isHovered) && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="28"
                  className={`${
                    isActive ? 'fill-blue-500/10 stroke-blue-400' : 'fill-slate-700/20 stroke-slate-400'
                  } stroke-1`}
                />
              )}
              
              {/* 主节点圆 */}
              <circle
                cx={node.x}
                cy={node.y}
                r="16"
                className={`${
                  isActive 
                    ? 'fill-blue-500 stroke-blue-300' 
                    : isHovered
                    ? 'fill-slate-700 stroke-slate-400'
                    : 'fill-slate-800 stroke-slate-600'
                } stroke-2 transition-all duration-300`}
              />
              
              {/* 脉冲环（活动状态） */}
              {isActive && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="16"
                  className="fill-none stroke-blue-400 stroke-1 animate-pulse"
                />
              )}
              
              {/* Rank 标签 */}
              <text
                x={node.x}
                y={node.y}
                dy="0.35em"
                textAnchor="middle"
                className="fill-white text-[11px] font-bold select-none pointer-events-none"
              >
                R{node.rank}
              </text>
              
              {/* GPU ID 次标签 */}
              <text
                x={node.x}
                y={node.y + 10}
                dy="0.35em"
                textAnchor="middle"
                className="fill-slate-300 text-[7px] select-none pointer-events-none opacity-70"
              >
                GPU{node.gpuId}
              </text>
              
              {/* Hover 提示 - 主机名 */}
              <text
                x={node.x}
                y={node.y + 28}
                textAnchor="middle"
                className="fill-slate-300 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 select-none pointer-events-none font-medium"
              >
                {node.host}
              </text>
            </g>
          );
        })}

        {/* 中心信息 - 如果没有节点 */}
        {nodes.length === 0 && (
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dy="0.35em"
            className="fill-slate-500 text-[12px]"
          >
            Waiting for topology data...
          </text>
        )}
      </svg>
      
      {/* 底部说明 */}
      {nodes.length > 0 && (
        <div className="absolute bottom-3 left-4 text-[10px] text-slate-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-600" />
              <span>Connected</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
