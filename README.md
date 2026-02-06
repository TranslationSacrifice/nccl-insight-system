### NCCL 初始化分析可视化系统
这是一个用于分析和可视化 NCCL（NVIDIA Collective Communications Library）初始化过程与性能数据的系统1.0版本。

#### 本地运行指南 (Run Locally)

##### 1. 前置条件 (Prerequisites)
请确保您的开发环境中已安装 Node.js（建议使用 LTS 版本）。

##### 2. 安装项目依赖
在终端中进入项目根目录，运行以下命令来安装所有必要的依赖包（包括前端和后端）：

```Bash
npm install
```

##### 3. 启动后端服务（模拟模式）
该系统包含一个模拟后端，用于在没有真实 GPU 环境的情况下演示系统功能。它会解析server/sample-data/下的 NCCL 日志和性能指标，并通过 WebSocket 发送。

在当前终端运行：

```Bash
npm run server
```

作用： 启动 WebSocket 服务器（通常监听在端口 4000）。

注意： 该命令会占用一个终端窗口，请不要关闭它。

##### 4. 启动前端界面
打开一个新的终端窗口（保持后端服务运行），输入以下命令启动前端开发服务器：

```Bash
npm run dev
```
##### 5. 访问系统
打开浏览器，访问以下地址查看可视化界面： http://localhost:3000

#### 系统说明与进阶配置 (Notes)

##### 架构原理
前端应用会自动建立 WebSocket 连接（默认地址 ws://localhost:4000）到后端服务。数据通信主要包含以下三种消息类型：

session (会话与拓扑信息)：包含 GPU 的拓扑结构、初始化时的环境信息。

metric (性能指标)：实时的带宽、延迟等性能数据点。

log (日志流)：NCCL 输出的原始日志行。

控制指令：你可以点击界面上的 "Run" (运行) 或 "Stop" (停止) 按钮，向后端发送控制指令来开始或结束数据流。

###### 如何使用真实的 NCCL 数据？
默认情况下系统使用模拟数据。如果你想在 Linux 机器上分析真实的 NCCL 运行状况，请按照以下步骤操作：

后端配置：后端服务具备通过子进程（spawn）执行 shell 命令的能力。你需要修改后端的启动参数或配置，使其执行真实的 nccl-tests 命令，而不是运行模拟脚本。

捕获输出：后端会自动捕获该子进程的 stdout（标准输出）和 stderr（标准错误），将其解析后推送到前端。

推荐的测试命令： 为了获得最详细的初始化分析数据，请使用以下带有调试环境变量的命令：

```Bash
NCCL_DEBUG=INFO NCCL_DEBUG_SUBSYS=ALL mpirun -np 8 ./all_reduce_perf -b 1G -e 8G -f 2 -g 2
NCCL_DEBUG=INFO：开启信息级别的日志，这是分析初始化过程的基础。

NCCL_DEBUG_SUBSYS=ALL：开启所有子系统（如 INIT, GRAPH, TOPO 等）的详细调试信息，这对可视化拓扑生成至关重要。

mpirun -np 8 ...：启动 8 个进程进行 all_reduce 性能测试（请根据实际 GPU 数量调整）。

```