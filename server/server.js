import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 兼容 ESModule 环境下的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// NCCL 日志文件路径（用户可以通过环境变量覆盖）
const NCCL_LOG_FILE =
  process.env.NCCL_LOG_FILE ||
  path.join(__dirname, 'sample-data', 'nccl_all_reduce.log');

let isRunning = false;

function buildRingTopology(numRanks, numGpusPerNode = 4) {
  return {
    nodes: Array.from({ length: numRanks }).map((_, i) => ({
      id: `rank-${i}`,
      rank: i,
      gpuId: i % numGpusPerNode,
      host: 'gpu-node-01',
      active: true
    })),
    edges: Array.from({ length: numRanks }).map((_, i) => ({
      source: `${i}`,
      target: `${(i + 1) % numRanks}`,
      bandwidth: 100,
      type: 'Ring'
    }))
  };
}

function createBaseSession(numRanks) {
  return {
    isRunning: false,
    algorithm: 'AllReduce',
    numRanks,
    numNodes: 1,
    // 建议用户在生成日志时使用的完整 NCCL 调试命令
    recommendedCommand:
      'NCCL_DEBUG=INFO NCCL_DEBUG_SUBSYS=ALL mpirun -np 8 ./all_reduce_perf -b 1G -e 8G -f 2 -g 2',
    topology: buildRingTopology(numRanks)
  };
}

/**
 * 从 NCCL 文本日志中解析出：
 * - numRanks：通过出现过的 rank 数推断
 * - logs：原始每一行日志
 * - metrics：从 nccl-tests 输出表格中粗略提取 algBandwidth/busBandwidth/latency
 */
function parseNcclLogFile() {
  if (!fs.existsSync(NCCL_LOG_FILE)) {
    console.warn(
      `[nccl-backend] NCCL log file not found at ${NCCL_LOG_FILE}, returning empty session`
    );
    const emptySession = createBaseSession(0);
    return { session: emptySession, metrics: [], logs: [] };
  }

  const content = fs.readFileSync(NCCL_LOG_FILE, 'utf8');
  const lines = content.split(/\r?\n/);

  const rankSet = new Set();
  const logs = [];
  const metrics = [];

  lines.forEach((line, idx) => {
    if (!line.trim()) return;

    // 先尝试识别是否是 nccl-tests 输出表格中的“速度行”
    // 典型格式：
    //   size   count   type  redop  root   time(us)  algbw(GB/s)  busbw(GB/s) ...
    const metricMatch = line.match(
      /^\s*(\d+)\s+(\d+)\s+\w+\s+\w+\s+\-?\d+\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)/
    );
    if (metricMatch) {
      const size = parseInt(metricMatch[1], 10);
      const latency = parseFloat(metricMatch[3]);       // time(us)
      const algBandwidth = parseFloat(metricMatch[4]);  // out-of-place algbw
      const busBandwidth = parseFloat(metricMatch[5]);  // out-of-place busbw

      if (
        !Number.isNaN(size) &&
        !Number.isNaN(latency) &&
        !Number.isNaN(algBandwidth) &&
        !Number.isNaN(busBandwidth)
      ) {
        metrics.push({
          timestamp: Date.now() + idx,
          size,
          algBandwidth,
          busBandwidth,
          latency
        });
      }

      // 这类性能表格行不再进入“调试日志流”，避免和 NCCL_DEBUG 信息混在一起
      return;
    }

    // 解析 rank，用于估计 numRanks，并在日志流里标记大致来源 rank
    let rank = 0;
    const mRank =
      line.match(/rank\s+(\d+)/i) || line.match(/RANK\s+(\d+)/i);
    if (mRank) {
      rank = parseInt(mRank[1], 10);
      if (!Number.isNaN(rank)) {
        rankSet.add(rank);
      } else {
        rank = 0;
      }
    }

    // 保存 NCCL 调试 / 拓扑等文本日志
    logs.push({
      id: `${idx}`,
      timestamp: Date.now() + idx,
      rank,
      node: 'nccl-node',
      message: line,
      type: line.includes('WARN') ? 'WARN' : 'INFO'
    });
  });

  const numRanks =
    rankSet.size > 0 ? rankSet.size : Math.max(0, ...Array.from(rankSet, r => r + 1));

  // 为了让前端的吞吐曲线更清晰，可按 size 升序整理一次 metrics
  metrics.sort((a, b) => {
    if (a.size === b.size) {
      return a.timestamp - b.timestamp;
    }
    return a.size - b.size;
  });

  const session = {
    ...createBaseSession(numRanks),
    metrics,
    logs
  };

  return { session, metrics, logs };
}

app.use(express.json());

// 提供一个简单的 HTTP 接口方便调试：一次性返回整个 session（含 metrics/logs）
app.get('/session', (req, res) => {
  const { session } = parseNcclLogFile();
  res.json(session);
});

wss.on('connection', (ws) => {
  // 连接建立时先发一个“空” session（只带基本配置），实际数据在 start 控制消息后再发送
  const { session } = parseNcclLogFile();
  ws.send(JSON.stringify({ type: 'session', payload: session }));

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === 'control') {
        if (data.action === 'start') {
          if (isRunning) return;
          isRunning = true;
          const { session: parsedSession } = parseNcclLogFile();
          // 一次性把整个运行结果通过 session 消息推给前端，
          // 前端在 onSession 回调里更新 metrics / logs 即可。
          broadcast({ type: 'session', payload: parsedSession });
          isRunning = false;
        } else if (data.action === 'stop') {
          // 当前是离线回放模式，stop 只会标记状态，不中断任何实际进程
          isRunning = false;
          broadcast({ type: 'sessionUpdate', payload: { isRunning: false } });
        }
      }
    } catch (e) {
      console.error('invalid message', e);
    }
  });
});

function broadcast(obj) {
  const s = JSON.stringify(obj);
  wss.clients.forEach((c) => {
    if (c.readyState === c.OPEN) c.send(s);
  });
}

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`NCCL mock backend running on http://localhost:${PORT}`);
});
