type SessionPayload = any;

export type LogMessage = {
  id: string;
  timestamp: number;
  rank: number;
  node: string;
  message: string;
  type: string;
};

export type MetricMessage = {
  timestamp: number;
  size: number;
  algBandwidth: number;
  busBandwidth: number;
  latency: number;
};

export function connectToBackend(
  onSession: (s: SessionPayload) => void,
  onMetric: (m: MetricMessage) => void,
  onLog: (l: LogMessage) => void,
  onSessionUpdate?: (partial: Partial<any>) => void
) {
  const ws = new WebSocket('ws://localhost:4000');

  ws.addEventListener('open', () => {
    console.log('Connected to backend');
  });

  ws.addEventListener('message', (evt) => {
    try {
      const data = JSON.parse(evt.data);
      if (data.type === 'session') {
        onSession && onSession(data.payload);
      } else if (data.type === 'metric') {
        onMetric && onMetric(data.payload);
      } else if (data.type === 'log') {
        onLog && onLog(data.payload);
      } else if (data.type === 'sessionUpdate') {
        onSessionUpdate && onSessionUpdate(data.payload);
      }
    } catch (e) {
      console.error('Invalid backend message', e);
    }
  });

  function sendControl(action: 'start' | 'stop') {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'control', action }));
    }
  }

  function close() {
    if (ws.readyState === WebSocket.OPEN) ws.close();
  }

  return { sendControl, close };
}
