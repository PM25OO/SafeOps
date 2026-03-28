# SafeOps AI（浏览器插件网络安全运维系统）

> 版本：v0.2-mvp-dev  
> 更新日期：2026-03-21  
> 目标：将“页面告警感知 → AI研判 → 策略拦截 → 审计留痕”串成可演示的闭环。

---

## 产品说明

SafeOps AI 是一个以浏览器插件为入口的安全运维辅助系统：

- 在页面侧自动解析告警上下文（告警ID、级别、资产、用户等）
- 将上下文发送到后端进行规则与AI联合分析
- 返回风险分、建议动作、策略判定结果
- 在插件 UI（Popup / Options / 审计页）中展示分析结果，并通过悬浮球进行监听交互

### 当前可用能力（MVP）

- ✅ 插件基础：MV3 + Service Worker + Content Script
- ✅ Popup：全局开关、连接状态、今日统计、快捷入口
- ✅ Options：后端地址、动作白名单、DOM规则JSON导入
- ✅ Floating Ball：高危高亮、呼吸灯、拖拽贴边、单击切换监听、摘要提示框
- 🟡 SidePanel：已支持悬浮球 hover 分裂按钮触发；轻量只读骨架页已回归，可查看最近上下文与 AI 摘要概览（详细交互继续在 Phase 2 完善）
- ✅ Backend Request Resilience：前端调用后端已统一超时、重试与错误码输出
- ✅ 状态提示一致化：Popup/Options/悬浮球失败提示已统一中文口径
- ✅ Backend：`/analyze`、`/health`、`/health/llm`、`/audit/recent`
- ✅ 审计：后端 JSONL 审计落盘 + 前端审计页查看

---

## 技术架构（当前实现）

```text
Chrome Extension (MV3)
  ├─ content-script.ts      页面解析 + 悬浮球 + 触发分析
  ├─ service-worker.ts      消息路由 + 存储 + 后端调用
  ├─ popup/options/sidepanel/audit
  └─ dist/                  可加载的插件产物

FastAPI + LangGraph
  ├─ RuleEngineAgent        规则识别
  ├─ LLMBridgeAgent         Qwen调用(无key时Mock降级)
  ├─ AuditPolicyAgent       策略门控
  ├─ AuditAgent             审计记录/查询
  └─ /analyze API           统一分析入口
```

---

## 环境要求

- Node.js 18+
- Python 3.10+（当前项目在 3.14 也可运行）
- npm 9+
- Chrome（支持 Manifest V3）
- 可选：Docker（本地起 PostgreSQL/Redis/OPA）

---

## 环境变量配置

项目根目录已提供 `.env.example`。

### 推荐步骤

1. 复制 `.env.example` 为 `.env`
2. 按需填写变量（尤其是 `QWEN_API_KEY`）

### 关键变量

| 变量名 | 说明 | 默认/示例 |
|---|---|---|
| `QWEN_API_KEY` | Qwen API Key；为空时后端自动使用Mock决策 | `YOUR_QWEN_API_KEY` |
| `BACKEND_BASE_URL` | 插件默认后端地址 | `http://localhost:8000` |
| `OPA_URL` | OPA地址（后续策略增强使用） | `http://localhost:8181` |
| `DATABASE_URL` | 数据库连接（后续DB模型使用） | `postgresql://...` |
| `REDIS_URL` | 缓存地址（后续性能优化使用） | `redis://localhost:6379/0` |

---

## 启动方式

### 1) 启动后端（FastAPI）

在 `backend` 目录执行：

- 安装依赖：`pip install -r requirements.txt`
- 启动服务：`python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`

启动后可访问：

- 健康检查：`http://127.0.0.1:8000/health`
- API 文档：`http://127.0.0.1:8000/docs`

### 2) 构建前端插件

在 `frontend` 目录执行：

- 安装依赖：`npm install`
- 构建产物：`npm run build`

构建后产物位于：`frontend/dist/`

### 3) 导入插件（Chrome）

1. 打开 `chrome://extensions/`
2. 开启“开发者模式”
3. 选择“加载已解压的扩展程序”
4. 指向 `frontend/dist`

---

## 使用说明（最短路径）

1. 启动后端（确保 `:8000` 可访问）
2. 在插件 Popup 中确认“自动监听”已启用
3. 打开任意页面触发 content script
4. 页面出现悬浮球；高危内容会高亮
5. 单击悬浮球可开启/关闭监听；hover 悬浮球会分裂二级按钮，可点击打开 SidePanel
6. 收到摘要后会在悬浮球旁显示提示框
7. 在 Popup 中点击“历史审计日志”查看审计记录

---

## API（当前）

### `GET /health`
返回服务健康状态。

### `GET /health/llm`
返回LLM连接摘要（qwen/mock模式、是否连通）。

### `GET /audit/recent?limit=20`
返回最近审计记录。

### `POST /analyze`
输入页面告警上下文，返回：

- `risk_score`
- `recommendation`
- `suggested_actions`
- `ai_decision`
- `policy_decision`
- `audit_id`

---

## 测试与质量验证

### 后端

在 `backend` 目录：`python -m pytest -q`

### 前端

在 `frontend` 目录：

- 测试：`npm test -- --runInBand`
- 构建：`npm run build`

---

## 项目结构（当前仓库）

```text
.
├── backend/
│   ├── app/
│   └── tests/
├── frontend/
│   ├── src/
│   ├── tests/
│   └── dist/
├── docs/
├── PHASE1_TASKS.md
├── WORKFLOW.md
├── SETUP.md
└── DELIVERY_OVERVIEW.md
```

---

## 文档导航

- `WORKFLOW.md`：Copilot 执行工作流（任务拆分、验证、提交策略）
- `PHASE1_TASKS.md`：Phase 1 可执行任务清单（机器导向）
- `SETUP.md`：补充环境搭建与排障
- `DELIVERY_OVERVIEW.md`：交付范围与当前状态索引

---

## 许可证

待定。
