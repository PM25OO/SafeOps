# Phase 1 Copilot 执行任务清单

> 适用对象：GitHub Copilot / Coding Agent  
> 目标：把 Phase 1 拆解成可自动执行、可验证、可提交的闭环任务。  
> 更新时间：2026-03-22

---

## 1. 使用方式（给 Copilot）

每个任务按以下顺序执行：

1. 读取目标文件并确认上下文
2. 仅修改该任务涉及文件（最小改动）
3. 运行任务对应验证命令
4. 测试通过后立即原子化提交
5. 更新本清单状态与备注

---

## 2. 全局执行约束

- 提交规范：`<type>(<scope>): <summary>`（Conventional Commits）
- 原子化原则：一个逻辑闭环一个提交
- 验证优先：未通过验证不得标记完成
- 文档同步：行为变化必须更新 README/相关说明

---

## 3. 命令基线（当前仓库）

### 后端

- 安装：`pip install -r backend/requirements.txt`
- 运行：`python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`（cwd=`backend`）
- 测试：`python -m pytest -q`（cwd=`backend`）

### 前端

- 安装：`npm install`（cwd=`frontend`）
- 测试：`npm test -- --runInBand`（cwd=`frontend`）
- 构建：`npm run build`（cwd=`frontend`）
- 导入扩展目录：`frontend/dist`

---

## 4. 任务状态说明

- `✅`：已完成并验证通过
- `🟡`：部分完成（有后续行动）
- `⬜`：未开始
- `⛔`：阻塞（需外部依赖）

---

## 5. Phase 1 任务执行表（机器导向）

| ID | 状态 | 目标闭环 | 关键文件 | 验证命令 | 建议提交消息 |
|---|---|---|---|---|---|
| FE-1.1.1 | ✅ | MV3 manifest + service worker 骨架可加载 | `frontend/src/manifest.json`, `frontend/src/service-worker.ts` | `npm run build` | `feat(plugin): initialize mv3 extension skeleton` |
| FE-1.1.2 | ✅ | DOM 解析器可提取核心字段 | `frontend/src/parser/dom-parser.ts`, `frontend/tests/dom-parser.test.ts` | `npm test -- --runInBand` | `feat(parser): implement alert context extractor` |
| FE-1.1.3 | ✅ | 插件↔后端协议统一并类型化 | `frontend/src/api/protocol.ts`, `docs/PLUGIN_BACKEND_PROTOCOL.md` | `npm test -- --runInBand` | `feat(protocol): define plugin backend message schema` |
| FE-1.1.4 | ✅ | 消息路由可处理成功/失败路径 | `frontend/src/api/message-router.ts`, `frontend/tests/message-router.test.ts` | `npm test -- --runInBand` | `feat(messaging): add extension message router` |
| FE-1.1.X | 🟡 | 前端测试覆盖率门禁与报告 | `frontend/tests/*`, `frontend/package.json` | `npm test -- --runInBand` | `test(frontend): enforce parser and router coverage gate` |
| BE-1.2.1 | ✅ | FastAPI + LangGraph 可启动与编排 | `backend/app/main.py`, `backend/app/orchestration/workflow.py` | `python -m pytest -q` | `feat(backend): bootstrap fastapi with langgraph` |
| BE-1.2.2 | ✅ | 规则引擎支持高危识别 | `backend/app/agents/rule_engine_agent.py`, `backend/tests/test_rule_engine_agent.py` | `python -m pytest -q` | `feat(agents): implement rule engine agent` |
| BE-1.2.3 | ✅ | Pydantic 模型覆盖请求/响应 | `backend/app/models/schemas.py` | `python -m pytest -q` | `feat(models): define analyze request response schemas` |
| BE-1.2.4 | ✅ | `/analyze` API端到端可调用 | `backend/app/main.py`, `backend/tests/test_analyze_api.py` | `python -m pytest -q` | `feat(api): implement analyze endpoint` |
| BE-1.2.X | 🟡 | 后端覆盖率门禁与报告 | `backend/tests/*`, `backend/requirements.txt` | `python -m pytest -q` | `test(backend): enforce unit and integration coverage gate` |
| BE-1.3.1 | ✅ | LLM bridge 支持Qwen+Mock降级 | `backend/app/agents/llm_bridge_agent.py` | `python -m pytest -q` | `feat(llm): add qwen bridge with mock fallback` |
| BE-1.3.2 | ✅ | Function Calling schema 固化与验证 | `backend/app/agents/llm_bridge_agent.py`, `docs/` | `python -m pytest -q` | `feat(llm): define function calling contracts` |
| BE-1.3.3 | ✅ | AI 节点并入 LangGraph 主链路 | `backend/app/orchestration/workflow.py` | `python -m pytest -q` | `feat(orchestration): integrate ai enhancement node` |
| BE-1.3.4 | ⬜ | Prompt 安全约束与误伤用例 | `backend/app/agents/llm_bridge_agent.py`, `backend/tests/` | `python -m pytest -q` | `docs(llm): add prompt guardrails and misuse cases` |
| BE-1.3.X | ⬜ | 记录性能基准（P95/P99） | `docs/`, `backend/tests/` | `python -m pytest -q` | `test(perf): capture llm latency baseline` |
| BE-1.4.1 | ⬜ | OPA 基础策略接入（3条） | `backend/security/*`, `docker-compose.dev.yml` | `python -m pytest -q` | `feat(security): add opa baseline policies` |
| BE-1.4.2 | ✅ | 审计Agent落盘+查询能力 | `backend/app/agents/audit_agent.py`, `backend/app/main.py` | `python -m pytest -q` | `feat(audit): persist and query audit records` |
| BE-1.4.3 | ⬜ | 审计日志DB模型与迁移脚本 | `backend/app/models/*`, `backend/migrations/*` | `python -m pytest -q` | `feat(database): add audit log persistence schema` |
| INT-1.5.1 | ⬜ | 10条E2E（含悬浮球→侧边栏→动作确认） | `backend/tests/`, `frontend/tests/`, `tests/e2e/` | `python -m pytest -q` + `npm test -- --runInBand` | `test(e2e): add end-to-end workflow suite` |
| INT-1.5.2 | 🟡 | 演示数据+一键启动脚本完善 | `docker-compose.dev.yml`, `scripts/*`, `docs/*` | `docker compose -f docker-compose.dev.yml up -d` | `chore(demo): improve one-click demo environment` |
| INT-1.5.3 | ⬜ | 性能基准与优化报告 | `docs/*`, `tests/*` | `python -m pytest -q` | `docs(perf): publish phase1 baseline report` |
| FE-1.6.1 | ✅ | Popup 控制台可用 | `frontend/src/popup.*`, `frontend/src/ui.css` | `npm run build` | `feat(extension-ui): add popup dashboard` |
| FE-1.6.2 | ✅ | Options 配置中心可用 | `frontend/src/options.*`, `frontend/src/state/settings.ts` | `npm run build` | `feat(extension-ui): add options center` |
| FE-1.6.3 | ✅ | 悬浮球高危提示+拖拽贴边+监听切换 | `frontend/src/content-script.ts` | `npm run build` | `feat(content): add floating ball interactions` |
| FE-1.6.4 | ⬜ | SidePanel + 二次确认动作面板（已转入 Phase 2） | `frontend/src/sidepanel.*`, `frontend/src/service-worker.ts` | `npm run build` | `feat(sidepanel): add context chat and action confirm` |
| FE-1.6.X | ✅ | 多入口构建产物稳定导出 | `frontend/scripts/build.mjs`, `frontend/src/manifest.json` | `npm run build` | `fix(frontend-build): bundle multipage extension assets` |

---

## 6. 阻塞与外部依赖清单

| 依赖 | 影响任务 | 状态 | 说明 |
|---|---|---|---|
| Qwen API Key | BE-1.3.2 / BE-1.3.4 / BE-1.3.X | ⏳ | 无Key时可用Mock模式继续开发 |
| OPA策略文件 | BE-1.4.1 | ⏳ | 当前 compose 已有 OPA 服务占位 |
| E2E测试环境（浏览器自动化） | INT-1.5.1 | ⏳ | 需补 Selenium/Playwright 工程化配置 |

---

## 7. DoD（给 Copilot 的完成标准）

某任务被标记为 `✅` 前必须同时满足：

- 代码变更最小且范围清晰
- 任务对应验证命令通过
- 相关文档同步更新
- 有原子化提交记录
- 无新增 critical/high 级问题
