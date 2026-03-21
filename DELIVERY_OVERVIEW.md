# DELIVERY_OVERVIEW（Copilot 执行索引）

> 用途：给 Copilot 一个“当前仓库能做什么、下一步该做什么”的快速入口。  
> 更新时间：2026-03-21

---

## 1. 当前交付状态（事实）

### 1.1 产品能力

- 插件（MV3）已实现：
  - Popup 控制台
  - Options 配置中心
  - Floating Ball 悬浮球
  - SidePanel 决策视图
  - Audit 审计历史页
- 后端（FastAPI）已实现：
  - `/health`
  - `/health/llm`
  - `/analyze`
  - `/audit/recent`

### 1.2 工程能力

- 前端可测试、可构建、可导入扩展
- 后端可测试、可启动
- 具备原子化提交实践（Conventional Commits）

---

## 2. 文档职责映射

| 文件 | Copilot 应如何使用 |
|---|---|
| `README.md` | 产品说明、环境变量、前后端启动、插件导入、测试与排障 |
| `PHASE1_TASKS.md` | Phase 1 任务清单（机器导向：目标/文件/验证/提交） |
| `WORKFLOW.md` | 执行方法学（任务拆分、验证策略、提交策略） |
| `SETUP.md` | 额外环境搭建与容器说明（作为补充而非首要入口） |

---

## 3. 执行入口（命令）

### 后端

- 安装依赖：`pip install -r backend/requirements.txt`
- 运行：`python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`（cwd=`backend`）
- 测试：`python -m pytest -q`（cwd=`backend`）

### 前端

- 安装依赖：`npm install`（cwd=`frontend`）
- 测试：`npm test -- --runInBand`（cwd=`frontend`）
- 构建：`npm run build`（cwd=`frontend`）
- 插件导入目录：`frontend/dist`

---

## 4. Copilot 下一步优先任务（建议）

按优先级从高到低：

1. `INT-1.5.1`：补齐 E2E 流程（至少覆盖“悬浮球→侧边栏→动作确认”）
2. `BE-1.3.2`：Function Calling schema 固化
3. `BE-1.3.4`：Prompt 安全约束与误伤测试用例
4. `BE-1.4.1`：OPA 基础策略接入与验证

> 详细任务定义与提交模板：见 `PHASE1_TASKS.md`

---

## 5. 交付完成判定（Phase 1）

当以下条件全部满足，可判定 Phase 1 完成：

- [ ] `PHASE1_TASKS.md` 中 Phase 1 任务全部 `✅`
- [ ] 前后端核心测试全绿
- [ ] `README.md` 与真实命令、入口一致
- [ ] E2E 有最小可复现用例集
- [ ] 提交历史符合原子化原则

---

## 6. 维护规则

每次新增能力后，Copilot 应同步更新：

1. `README.md`（用户可见能力/启动方式）
2. `PHASE1_TASKS.md`（任务状态）
3. `DELIVERY_OVERVIEW.md`（索引与优先级）
