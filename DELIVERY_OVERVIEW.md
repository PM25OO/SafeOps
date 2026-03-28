# DELIVERY_OVERVIEW（Copilot 执行索引）

> 用途：给 Copilot 一个“当前仓库能做什么、下一步该做什么”的快速入口。  
> 更新时间：2026-03-22

---

## 1. 当前交付状态（事实）

### 1.1 产品能力

- 插件（MV3）已实现：
  - Popup 控制台
  - Options 配置中心
  - Floating Ball 悬浮球
  - Audit 审计历史页
- 插件（Phase 2 已实现）：
  - SidePanel 轻量只读信息面板（最新上下文 + AI 摘要）
  -悬浮球 hover 分裂二级按钮触发 SidePanel
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
| `PHASE2_TASKS.md` | Phase 2 任务清单（稳定性优先：测试增强、审计DB化、轻量SidePanel） |
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

### Phase 2（当前）

已完成：
- `STB-2.1~2.3`：稳定性加固 ✅
- `TEST-2.1~2.2`：API + 前端集成测试 ✅
- `TEST-2.3`：稳定性回归清单 ✅
- `UI-2.0~2.2`：悬浮球二级按钮 + 轻量 SidePanel 只读信息面板 ✅

进行中与余项：
1. `AUD-2.1~2.4`：审计持久化升级（DB主路径 + JSONL备份）
2. `OPS-2.1~2.2`：后端 Docker 镜像化与 compose 联通
3. `DOC-2.1`：文档与实现一致性修正

> 详细任务定义与提交模板：见 `PHASE2_TASKS.md`

### Phase 1（历史收尾）

1. `FE-1.6.4`：SidePanel + 二次确认动作面板（已转入 Phase 2）
2. `INT-1.5.1`：补齐 E2E 流程（暂不引入浏览器自动化）
3. `BE-1.4.1`：OPA 基础策略接入与验证
4. `BE-1.4.3`：审计日志 DB 模型与迁移脚本

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
