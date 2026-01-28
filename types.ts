
export enum NCCLOp {
  ALLREDUCE = 'AllReduce',
  ALLGATHER = 'AllGather',
  BROADCAST = 'Broadcast',
  REDUCE = 'Reduce',
  REDUCESCATTER = 'ReduceScatter',
  SCAN = 'Scan',
  UNKNOWN = 'Unknown'
}

export enum NCCLTopologyType {
  RING = 'Ring',
  TREE = 'Tree',
  NVLINK = 'NVLink'
}

export interface NCCLLogEntry {
  id: string;
  timestamp: number;
  rank: number;
  node: string;
  message: string;
  type: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  subsys?: string;
}

export interface NCCLMetric {
  timestamp: number;
  size: number;
  algBandwidth: number;
  busBandwidth: number;
  latency: number;
}

export interface NCCLTopologyNode {
  id: string;
  rank: number;
  gpuId: number;
  host: string;
  active: boolean;
}

export interface NCCLTopologyEdge {
  source: string;
  target: string;
  bandwidth: number;
  type: NCCLTopologyType;
}

export interface NCCLSession {
  isRunning: boolean;
  algorithm: NCCLOp;
  numRanks: number;
  numNodes: number;
  metrics: NCCLMetric[];
  logs: NCCLLogEntry[];
  topology: {
    nodes: NCCLTopologyNode[];
    edges: NCCLTopologyEdge[];
  };
}
