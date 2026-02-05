

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the mock backend (this simulates NCCL logs/metrics and provides a WebSocket API):
   `npm run server`

3. Start the frontend in another terminal:
   `npm run dev`

4. Open http://localhost:3000 in your browser.

Notes:
- The frontend connects to the backend WebSocket at `ws://localhost:4000` and consumes three message types: `session` (initial session/topology), `metric` (metric points), and `log` (NCCL log lines). Use the run/stop button to send start/stop control commands to the backend.
- To capture real NCCL output instead of simulated data, run your benchmark on a Linux machine and point the backend to the stderr/stdout stream of nccl-tests. Recommended real command (enables verbose NCCL logging):

  `NCCL_DEBUG=INFO NCCL_DEBUG_SUBSYS=ALL mpirun -np 8 ./all_reduce_perf -b 1G -e 8G -f 2 -g 2`

  The backend should spawn this process and stream parsed logs and metrics to connected frontends.
