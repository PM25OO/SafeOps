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

---

## 11. 常见陷阱与教训库

### 11.1 Chrome sidePanel.open() 用户交互链丢失

**教训来源**：修复二级悬浮球无法打开 sidePanel 的 bug（2026-03-24）

**问题描述**：
```typescript
// ❌ 错误：async IIFE 会打破用户交互链
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "OPEN_SIDE_PANEL") {
    (async () => {
      await chrome.sidePanel.open({ tabId });
    })();
  }
});
```

**根本原因**：
- Chrome 强制要求 `sidePanel.open()` 必须在用户交互的**直接同步回调**中调用
- 使用 `async`/`await` 会将控制流推入微任务队列，导致丢失用户交互上下文
- 结果：API 调用被拒绝，无任何错误提示或异常

**修复方案**：
```typescript
// ✅ 正确：同步直接调用，保留用户交互链
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "OPEN_SIDE_PANEL") {
    const tabId = sender.tab?.id;
    if (!tabId) return true;
    
    void chrome.sidePanel.open({ tabId });
    void chrome.sidePanel.setOptions({
      tabId,
      path: "audit.html",
      enabled: true,
    });
    return true;
  }
});
```

**核心原则**：
- ❌ 永远不要用 async IIFE 包装需要用户交互链的 Chrome API 调用
- ✅ 优先级：用户交互链 > await 链
- ✅ 如果需要异步操作，先立即调用 API，后处理其他逻辑

---

### 11.2 CSS pointer-events 与内联样式优先级陷阱

**教训来源**：修复二级悬浮球按钮无法点击的 bug（2026-03-24）

**问题描述**：
```css
#safeops-floating-ball {
  pointer-events: none;
}
#safeops-floating-ball.open {
  pointer-events: auto;
}
#safeops-floating-ball.open .secondary {
  pointer-events: auto;
}
```

```javascript
// ❌ 错误：仅依赖 CSS 类控制 pointer-events
const trigger = document.createElement("button");
trigger.className = "secondary";
ball.appendChild(trigger);
// 此时即使 ball 添加了 .open 类，trigger 的 pointer-events 仍可能是 none
```

**根本原因**：
- CSS 选择器优先级问题：父级 `.open` 下的子级选择器可能被其他更高优先级规则覆盖
- CSS 级联不够稳定，特别是在复杂的嵌套选择器中
- 结果：按钮可见但无法点击

**修复方案**：
```typescript
// ✅ 正确：强制设置内联样式，确保最高优先级
const trigger = document.createElement("button");
trigger.className = "secondary";
// 直接在 style 属性上设置，绕过 CSS 优先级问题
trigger.style.pointerEvents = "auto";
ball.appendChild(trigger);
```

**核心原则**：
- 🎯 `pointer-events` 是"可交互性"属性，应该在需要交互的元素上**硬编码**
- ✅ 对交互关键的样式，优先使用内联样式
- ❌ 不要完全依赖 CSS 类级联来控制 `pointer-events: none/auto` 切换
- 💡 如果用 CSS 类，配合内联样式作为 fallback/override

**调试技巧**：
```javascript
// 诊断 pointer-events 是否真正生效
console.log(getComputedStyle(element).pointerEvents);
// 如果仍是 "none" 但应该是 "auto"，用内联样式强制设置
element.style.pointerEvents = "auto";
```

---

### 11.3 问题诊断最佳实践

**教训来源**：调试二级按钮无响应（2026-03-24）

**有效的诊断方法**：
1. **分层诊断**：从表现层 → DOM 层 → 事件层 → API 层
2. **添加策略性 console.log**：
   - 在"用户交互链"关键点（如 click 事件）记日志
   - 在"API 调用前"记日志
   - 在"DOM 创建后"验证属性
3. **验证 CSS 生效**：
   ```javascript
   console.log(getComputedStyle(element).pointerEvents);
   ```
4. **验证事件监听**：
   ```javascript
   trigger.addEventListener("click", () => {
     console.log("Click detected!");
   });
   ```

**反面教学**：
- ❌ 不要猜测 CSS 或 API 行为，要验证
- ❌ 不要依赖"看起来应该工作"就认为它工作
- ✅ 显式验证关键路径上的每个假设

---

## 12. Phase 2 稳定性回归清单

> 文档归属：TEST-2.3（建立稳定性回归命令清单与执行顺序）  
> 目标：确保每次改动都通过完整的稳定性验证链  
> 首次生成日期：2026-03-28

### 前置条件

- 本地已克隆最新代码、工作区无未提交改动（`git status` 干净）
- Python 3.10+ 与 Node.js 18+ 已安装

### 标准验证流程

#### 步骤 1：后端测试（backend/）

```bash
cd backend
pip install -r requirements.txt
python -m pytest -q
```

**期望结果**：报告类似 `11 passed, 1 warning` 或更优，无 `FAILED` 或 `ERROR`。

#### 步骤 2：前端测试（frontend/）

```bash
cd frontend
npm install
npm test -- --runInBand
```

**期望结果**：
```
Test Suites: 4 passed, 4 total
Tests: 14+ passed
```

无挂起、超时或失败。

#### 步骤 3：前端构建（frontend/）

```bash
npm run build
```

**期望结果**：
- 输出 `[build] extension bundle generated at dist/`
- `dist/` 包含所有必需文件：`service-worker.js`、`sidepanel.js`、`audit.js`、`popup.js`、`options.js`、`content-script.js`、`manifest.json`、HTML 文件、`ui.css`、`logo.svg`
- 无 esbuild 错误

#### 步骤 4：插件加载验证（可选/手工）

1. 打开 `chrome://extensions/`
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"，选择 `frontend/dist`
4. 检查插件是否正常加载（无红色错误）
5. 在任意网页右键点击插件图标，验证能否打开 Popup / Options / SidePanel（通过 hover 悬浮球）

### 回归检查清单

| 检查项 | 验证方法 | 通过标准 |
|---|---|---|
| 后端 API 健康 | Step 1 pytest | 无失败用例 |
| 前端单元测试 | Step 2 jest | 所有套件 pass |
| 前端构建 | Step 3 npm run build | 无 esbuild 错误，4 个完整 JS 包 |
| Service Worker 消息路由 | 单元测试 pass，支持 `PING` | 无挂起、能处理同步 API 调用 |
| SidePanel 显示 | 插件加载后 hover 悬浮球 | 能打开 sidepanel，显示"最新上下文"与"AI 摘要" |
| 审计持久化 | 触发分析后查询后端 `/audit/recent` | 能返回记录，格式与协议一致 |

### 推荐执行频率

- 开发中每个原子提交后：执行步骤 1-3
- PR 或合并前：完整执行步骤 1-4
- CI/CD 自动化：至少步骤 1-3
