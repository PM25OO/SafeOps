# SafeOps AI - Copilot 执行工作流手册

> 版本：v2.0（Agent-Oriented）  
> 更新时间：2026-03-21  
> 目的：让 Copilot 在本仓库里按统一策略执行“读代码→改代码→验证→提交→更新文档”。

---

## 1. 适用范围

本手册适用于以下任务类型：

- 新增功能（前端插件 / 后端API / 编排逻辑）
- 修复缺陷（功能、样式、构建、测试）
- 补测试与回归验证
- 更新文档与交付说明

不适用：纯需求评审、商业方案评估、非代码性质讨论。

---

## 2. 仓库事实（执行前必须知道）

### 2.1 当前技术栈

- 前端：TypeScript + Chrome Extension MV3 + esbuild
- 后端：FastAPI + LangGraph + Pydantic
- 测试：Jest（前端）+ Pytest（后端）

### 2.2 当前命令基线

- 前端测试：`npm test -- --runInBand`（cwd=`frontend`）
- 前端构建：`npm run build`（cwd=`frontend`）
- 后端测试：`python -m pytest -q`（cwd=`backend`）
- 后端运行：`python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`（cwd=`backend`）

### 2.3 插件导入目录

- `frontend/dist`

---

## 3. 标准执行循环（必须遵守）

每次任务遵循固定 7 步：

1. **Gather**：读取相关文件（不少于任务必要上下文）
2. **Plan**：拆分最小任务并维护 todo
3. **Implement**：只做本任务最小改动
4. **Validate**：运行最小必要测试/构建
5. **Commit**：通过后原子提交（Conventional Commit）
6. **Document**：如行为变化，更新 README/任务文档
7. **Report**：输出“改了什么 + 怎么验证 + 下一步”

---

## 4. 任务拆分规则（原子化）

### 4.1 可以合并为一个提交的条件

- 同一个逻辑闭环
- 同一类风险
- 同一验证命令即可覆盖

### 4.2 必须拆分提交的条件

- 功能代码与文档台账
- 结构重构与行为修复
- 样式/UI微调与业务逻辑变化

### 4.3 推荐提交类型

- `feat(scope): ...`
- `fix(scope): ...`
- `test(scope): ...`
- `docs(scope): ...`
- `style(scope): ...`
- `refactor(scope): ...`
- `chore(scope): ...`

---

## 5. 验证策略（任务级）

### 5.1 前端任务

至少执行其一：

- `npm test -- --runInBand`
- `npm run build`

若改动涉及 MV3 入口、manifest、打包配置，必须跑 `npm run build`。

### 5.2 后端任务

至少执行：

- `python -m pytest -q`

若改动API路由/模型，需确保关键接口可调用（`/health`、`/analyze`）。

### 5.3 文档任务

- 检查文档与当前真实命令一致
- 检查链接和路径是否存在

---

## 6. Copilot 执行模板

每次响应尽量包含：

1. 目标摘要（本轮要完成什么）
2. 进行中的任务状态（todo delta）
3. 已完成验证（测试/构建结果）
4. 已提交记录（commit hash + message）
5. 余项与风险

---

## 7. 常见场景策略

### 场景 A：UI 异常

- 先定位具体页面入口（popup/options/sidepanel/content）
- 再定位样式作用域（通用样式 vs 页面样式）
- 修复后必须跑 `npm run build`
- 如影响体验说明，同步 README 使用截图/说明（可选）

### 场景 B：Service Worker 报错

- 检查 `manifest.json` 与打包产物是否一致
- 检查 `dist/service-worker.js` 是否存在不可解析导入
- 优先排查构建脚本与入口声明

### 场景 C：接口联调失败

- 先验 `/health`
- 再验 `/analyze`
- 再看插件端请求头、后端地址、API Key

---

## 8. 文档更新策略

### 必须更新文档的情况

- 新增 API
- 新增运行入口（新页面/新脚本）
- 环境变量变化
- 启动/测试命令变化

### 文档优先级

1. `README.md`（产品说明与启动手册）
2. `PHASE1_TASKS.md`（任务执行状态）
3. `DELIVERY_OVERVIEW.md`（交付索引）

---

## 9. 质量门禁（Definition of Done）

任务完成前必须满足：

- [ ] 改动范围最小且可解释
- [ ] 对应验证命令通过
- [ ] 已按原子化提交
- [ ] 文档同步（如需要）
- [ ] `git status` 干净或仅保留明确后续改动

---

## 10. 当前优先队列入口

- 功能拆解与状态：见 `PHASE1_TASKS.md`
- 产品与运行说明：见 `README.md`
- 环境细节：见 `SETUP.md`
