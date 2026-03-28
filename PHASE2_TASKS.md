# Phase 2 Copilot 执行任务清单（稳定性优先版）

> 适用对象：GitHub Copilot / Coding Agent  
> 目标：在不引入浏览器自动化 E2E 的前提下，优先提升系统稳定性，并完成审计持久化升级。  
> 规划基线：根据 2026-03-22 的已确认决策（1B 2C 3B 4C 5A）与实施细节（1B-细化, 2A）  
> 更新时间：2026-03-22

---

## 1. 已确认决策（不可偏离）

1. SidePanel 方向：**B**（轻量信息面板回归）
2. 测试策略：**C**（暂不引入浏览器自动化，先做 API + 前端集成测试）
3. 审计存储：**B**（DB 主存储，JSONL 作为备份）
4. OPA 策略：**C**（Phase 2 延后，不纳入本阶段）
5. 核心 KPI：**A**（稳定性优先）

### 1.1 已确认实施细节（2026-03-22）

- SidePanel 触发方式：**悬浮球 hover 时分裂出二级按钮，点击二级按钮触发 SidePanel**
- 审计 DB 技术栈：**SQLAlchemy + Alembic + PostgreSQL**

---

## 2. 全局执行约束

- 提交规范：`<type>(<scope>): <summary>`（Conventional Commits）
- 原子化原则：一个逻辑闭环一个提交
- 验证优先：未通过验证不得标记完成
- 不做项：本阶段不引入 Playwright/Selenium，不推进 OPA 接入
- 文档同步：行为变化必须更新 `README.md` + 本清单状态

---

## 3. Phase 2 完成标准（DoD）

当以下条件同时满足，可判定 Phase 2 完成：

- [ ] 稳定性相关关键任务全部 `✅`
- [ ] 审计读写链路已切到 DB 主路径（JSONL 备份可用）
- [ ] API 与前端集成测试可重复通过
- [ ] 悬浮球 hover 可分裂出二级按钮，点击可打开轻量 SidePanel
- [ ] 轻量 SidePanel 可展示上下文与分析摘要（不引入重交互）
- [ ] 文档（README + DELIVERY_OVERVIEW）与真实行为一致

---

## 4. 稳定性 KPI（Phase 2）

> 说明：以下阈值用于验收，不是当前现状。

- 插件端“未捕获异常导致功能中断”场景：**0 个 P0**
- `Extension context invalidated` 场景：**100% 被兜底处理，无崩溃**
- 后端 `/analyze` 与 `/health/llm` 集成测试通过率：**100%**
- 审计写入失败时：**主路径失败可降级 JSONL 备份，不丢事件**

---

## 5. Phase 2 任务执行表（机器导向）

| ID | 状态 | 目标闭环 | 关键文件 | 验证命令 | 建议提交消息 |
|---|---|---|---|---|---|
| STB-2.1 | ✅ | 扩展上下文失效容错统一（content/service-worker） | `frontend/src/content-script.ts`, `frontend/src/service-worker.ts` | `npm run build` | `fix(stability): unify extension context invalidation handling` |
| STB-2.2 | ✅ | 前端后端调用超时/重试/错误码标准化 | `frontend/src/service-worker.ts`, `frontend/src/api/protocol.ts` | `npm test -- --runInBand` + `npm run build` | `feat(stability): add resilient backend request handling` |
| STB-2.3 | ✅ | 前端状态提示一致化（避免重复/冲突文案） | `frontend/src/content-script.ts`, `frontend/src/popup.ts`, `frontend/src/options.ts` | `npm run build` | `fix(ui): normalize runtime status messaging` |
| STB-2.4 | ✅ | 后端错误分级与可观测日志字段统一 | `backend/app/main.py`, `backend/app/orchestration/workflow.py` | `python -m pytest -q` | `refactor(backend): standardize error classification and logging` |
| UI-2.0 | ✅ | 悬浮球 hover 分裂二级按钮并接入 SidePanel 触发 | `frontend/src/content-script.ts`, `frontend/src/service-worker.ts`, `frontend/src/manifest.json` | `npm run build` | `feat(sidepanel): add hover-split secondary trigger from floating ball` |
| UI-2.1 | ✅ | 轻量 SidePanel 页面骨架回归（仅信息展示） | `frontend/src/sidepanel.html`, `frontend/src/sidepanel.ts`, `frontend/src/manifest.json` | `npm run build` | `feat(sidepanel): restore lightweight info panel shell` |
| UI-2.2 | ✅ | SidePanel 展示最新 Context + AI 摘要（只读） | `frontend/src/sidepanel.ts`, `frontend/src/state/settings.ts` | `npm test -- --runInBand` + `npm run build` | `feat(sidepanel): render latest context and ai summary` |
| TEST-2.1 | ✅ | 后端 API 集成测试增强（健康/分析/异常路径） | `backend/tests/test_analyze_api.py`, `backend/tests/` | `python -m pytest -q` | `test(api): extend backend integration coverage` |
| TEST-2.2 | ✅ | 前端集成级测试（message-router + service-worker 调用链） | `frontend/tests/message-router.test.ts`, `frontend/tests/` | `npm test -- --runInBand` | `test(frontend): add integration-style message flow tests` |
| TEST-2.3 | ✅ | 建立稳定性回归命令清单与执行顺序 | `README.md`, `WORKFLOW.md` | `npm test -- --runInBand` + `python -m pytest -q` | `docs(test): define phase2 stability regression checklist` |
| AUD-2.1 | ✅ | 引入 SQLAlchemy/Alembic 与 PostgreSQL 配置（主路径） | `backend/requirements.txt`, `backend/app/` | `python -m pytest -q` | `feat(audit): add sqlalchemy and alembic dependencies` |
| AUD-2.2 | ⬜ | 审计表模型 + Alembic 迁移脚本 | `backend/app/models/`, `backend/migrations/`, `backend/alembic.ini` | `python -m pytest -q` | `feat(database): add audit schema and alembic migration` |
| AUD-2.3 | ⬜ | 审计写入链路改造：DB 主写 + JSONL 备份 | `backend/app/agents/audit_agent.py` | `python -m pytest -q` | `feat(audit): switch to db-primary with jsonl backup` |
| AUD-2.4 | ⬜ | `/audit/recent` 改为 DB 读并保留降级路径 | `backend/app/main.py`, `backend/app/orchestration/workflow.py` | `python -m pytest -q` | `feat(api): serve recent audits from database` |
| OPS-2.1 | ⬜ | 后端 Docker 镜像化（FastAPI + 依赖） | `backend/Dockerfile`, `backend/.dockerignore` | `docker build`（backend） | `build(backend): containerize fastapi service` |
| OPS-2.2 | ⬜ | docker-compose 接入 backend 服务并联通 pg/redis/opa | `docker-compose.dev.yml` | `docker compose -f docker-compose.dev.yml up -d` | `chore(devops): wire backend service in docker compose` |
| DOC-2.1 | ✅ | 文档与实现一致性修正（含 SidePanel 新定位） | `README.md`, `DELIVERY_OVERVIEW.md`, `PHASE2_TASKS.md` | 文档自检 + 构建/测试抽查 | `docs(phase2): align docs with stabilized architecture` |

---

## 6. 延后项（本阶段不做）

| ID | 状态 | 延后原因 |
|---|---|---|
| SEC-OPA-2.X | ⏸️ | 已确认 4C：OPA 接入延后至下一阶段 |
| E2E-BROWSER-2.X | ⏸️ | 已确认 2C：暂不引入浏览器自动化框架 |

---

## 7. 推荐执行顺序（降低返工）

1. `STB-2.1` → `STB-2.2` → `STB-2.3`（先稳定插件主链路）
2. `TEST-2.1` → `TEST-2.2`（补可重复验证能力）
3. `AUD-2.1` → `AUD-2.2` → `AUD-2.3` → `AUD-2.4`（完成审计持久化迁移）
4. `UI-2.0` → `UI-2.1` → `UI-2.2`（完成分裂按钮触发 + 轻量 SidePanel 只读能力）
5. `OPS-2.1` → `OPS-2.2`（后端容器化与 compose 联通）
6. `DOC-2.1`（最后统一文档）

---

## 8. 里程碑建议（可按人力微调）

- M1（第 1 周）：完成 `STB-2.1~2.3` + `TEST-2.1`
- M2（第 2 周）：完成 `AUD-2.1~2.4`
- M3（第 3 周）：完成 `UI-2.0~2.2` + `OPS-2.1~2.2` + `DOC-2.1`

---

## 9. 给 Copilot 的执行提醒

- 每完成一项任务即更新状态（`⬜`→`✅`）
- 每项任务通过验证后立即原子提交
- 若任务依赖未满足，标记 `⛔` 并写明阻塞原因
- 严禁把“未验证通过”的任务标记为 `✅`
