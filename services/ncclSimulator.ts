
import { NCCLOp, NCCLTopologyType, NCCLMetric, NCCLLogEntry } from '../types';

export const generateMockLog = (rank: number, op: NCCLOp): string => {
  const steps = [
    `NCCL INFO Ring 0 : ${rank} -> ${(rank + 1) % 8} via P2P/IPC`,
    `NCCL INFO ${op} : opCount 0123 send 104857600 bytes from rank ${rank}`,
    `NCCL INFO Trees : ${rank} -> {${(rank + 1) % 8}, ${(rank + 2) % 8}}`,
    `NCCL INFO [0] NCCL_ALGO=Ring NCCL_PROTO=Simple`,
    `NCCL INFO rank ${rank} on node gpu-node-01 device ${rank % 4} [0x${(rank * 100).toString(16)}]`
  ];
  return steps[Math.floor(Math.random() * steps.length)];
};

export const generateMockMetric = (prevMetric?: NCCLMetric): NCCLMetric => {
  const baseBandwidth = prevMetric ? prevMetric.algBandwidth : 80;
  const jitter = (Math.random() - 0.5) * 5;
  const newBW = Math.max(70, Math.min(105, baseBandwidth + jitter));
  
  return {
    timestamp: Date.now(),
    size: Math.pow(2, 20 + Math.floor(Math.random() * 5)),
    algBandwidth: newBW,
    busBandwidth: newBW * 1.2,
    latency: 10 + Math.random() * 20
  };
};
