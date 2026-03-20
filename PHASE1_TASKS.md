# Phase 1 任务追踪表

> 发发布日期: 2026-03-20 | MVP交付目标: 2026-04-03 (2周内)

## Sprint 1.1: 浏览器插件基础框架 (目标: 3天)

| ID | 任务 | 优先级 | 预计工时 | 状态 | 负责人 | 备注 |
|----|------|--------|---------|------|--------|------|
| FE-1.1.1 | 创建MV3 manifest + service-worker骨架 | P0 | 2h | ✅ | Copilot | Manifest V3标准 |
| FE-1.1.2 | 实现Content Script页面DOM解析器 | P0 | 4h | ✅ | Copilot | 选择器库+单测 |
| FE-1.1.3 | 设计与后端通信协议(JSON) | P0 | 2h | ✅ | Copilot | 协议文档 |
| FE-1.1.4 | 实现消息路由中间件 | P0 | 3h | ✅ | Copilot | 支持双向通信 |
| FE-1.1.X | 本地单元测试覆盖 | P1 | 2h | 🟡 | Copilot | 已补充单测，待覆盖率报告 |

## Sprint 1.2: 后端基础框架 (目标: 3天)

| ID | 任务 | 优先级 | 预计工时 | 状态 | 负责人 | 备注 |
|----|------|--------|---------|------|--------|------|
| BE-1.2.1 | FastAPI + LangGraph项目初始化 | P0 | 2h | ✅ | Copilot | hello world demo |
| BE-1.2.2 | 实现RuleEngineAgent(规则库) | P0 | 4h | ✅ | Copilot | ≥5条内置规则 |
| BE-1.2.3 | 设计Pydantic数据模型 | P0 | 2h | ✅ | Copilot | 自动API文档 |
| BE-1.2.4 | 实现/analyze API端点 | P0 | 3h | ✅ | Copilot | 集成测试可跑通 |
| BE-1.2.X | 单元+集成测试 | P1 | 2h | 🟡 | Copilot | 测试通过，待覆盖率门禁 |

## Sprint 1.3: Qwen LLM集成 (目标: 3天)

| ID | 任务 | 优先级 | 预计工时 | 状态 | 负责人 | 备注 |
|----|------|--------|---------|------|--------|------|
| BE-1.3.1 | 设计LLM Bridge(Qwen client) | P0 | 2h | ⬜ | - | 支持retry+timeout |
| BE-1.3.2 | 定义Function Calling Schema | P0 | 3h | ⬜ | - | ≤5个核心function |
| BE-1.3.3 | 实现AIAgent(LangGraph节点) | P0 | 4h | ⬜ | - | E2E测试可跑通 |
| BE-1.3.4 | Prompt优化+安全约束 | P0 | 3h | ⬜ | - | 误伤场景覆盖 |
| BE-1.3.X | 性能基准测试 | P2 | 1h | ⬜ | - | 响应时间<8s |

## Sprint 1.4: OPA基础策略 (目标: 2天)

| ID | 任务 | 优先级 | 预计工时 | 状态 | 负责人 | 备注 |
|----|------|--------|---------|------|--------|------|
| BE-1.4.1 | 部署OPA + 3条基础策略 | P0 | 3h | ⬜ | - | unit test覆盖 |
| BE-1.4.2 | 实现AuditAgent | P0 | 2h | ⬜ | - | 决策持久化 |
| BE-1.4.3 | 审计日志数据模型+DB表 | P0 | 1h | ⬜ | - | 包含操作者/时间戳 |

## Sprint 1.5: 端到端集成 (目标: 2天)

| ID | 任务 | 优先级 | 预计工时 | 状态 | 负责人 | 备注 |
|----|------|--------|---------|------|--------|------|
| INT-1.5.1 | 编写10条E2E测试用例 | P0 | 4h | ⬜ | - | Pytest + Selenium |
| INT-1.5.2 | 演示数据集+Docker Compose | P0 | 3h | ⬜ | - | 一键启动 |
| INT-1.5.3 | 性能基准记录+优化报告 | P1 | 2h | ⬜ | - | baseline metrics |

## Sprint 1.6: 插件前端交互优化 (新增任务, 目标: 2天)

| ID | 任务 | 优先级 | 预计工时 | 状态 | 负责人 | 备注 |
|----|------|--------|---------|------|--------|------|
| FE-1.6.1 | 插件主页Popup控制台(开关/状态看板/快捷入口) | P0 | 3h | ✅ | Copilot | 包含模型状态与今日统计 |
| FE-1.6.2 | Options配置中心(API配置/Allowlist/Parser Rules导入) | P0 | 4h | ✅ | Copilot | 支持JSON规则导入与格式化 |
| FE-1.6.3 | 悬浮球FloatingBall(贴边隐藏/高危高亮/拖拽) | P0 | 3h | ✅ | Copilot | 双击/右键可打开侧边栏 |
| FE-1.6.4 | SidePanel决策视图(Context/AI Chat/Action) | P0 | 4h | ✅ | Copilot | ActionPanel二次确认拦截 |
| FE-1.6.X | 新增前端入口联调与构建导出验证 | P1 | 2h | ✅ | Copilot | 构建产物含popup/options/sidepanel/audit |

---

## 关键里程碑

- **Day 3 (2026-03-23)**: 插件骨架完成 + 后端能接收数据
- **Day 6 (2026-03-26)**: LLM集成完成, 可进行单链路决策
- **Day 9 (2026-03-29)**: OPA + 审计日志完成
- **Day 10 (2026-03-30)**: E2E测试全绿, MVP演示可行
- **Day 14 (2026-04-03)**: Phase 1交付, 开始Phase 2

---

## 关键依赖与风险

### 关键依赖
- [ ] Qwen API账户 + 开发秘钥 (获取时间: 1天)
- [ ] Chrome Extension开发环境 (设置时间: 2h)
- [ ] PostgreSQL + Redis本地开发环境 (设置时间: 1h)
- [ ] GitHub Actions配置 (设置时间: 2h)

### 风险评估

| 风险 | 影响 | 概率 | 缓解方案 |
|-----|------|------|--------|
| LLM API延迟超预期 | 延期3-5天 | 中 | 使用Mock LLM快速验证逻辑 |
| DOM选择器过于脆弱 | 延期2-3天 | 高 | 建立页面指纹库 + 自适应选择器 |
| Qwen Function Calling支持不足 | 延期5-7天 | 低 | 提前验证, 设计降级方案 |
| Team可用性不足 | 延期变数 | 中 | 提前沟通预期, 分解任务  |

---

## 每日进度报告模板

```markdown
## 日期: 2026-03-XX

### 昨日完成
- [ ] Task X: 完成度 Y%
- [ ] ...

### 今日计划
- [ ] Task A
- [ ] Task B

### 遇到的问题
- Issue 1: [描述] → 解决方案: [方案]

### 健康度评分
- 进度: 🟢 On Track | 🟡 At Risk | 🔴 Off Track
- 质量: 🟢 Good | 🟡 Fair | 🔴 Poor
- Team: 🟢 Motivated | 🟡 Mixed | 🔴 Blocked
```

---

## 通过标准 (Definition of Done)

每个任务必须满足:

- [ ] 代码已提交并通过CR
- [ ] 单元测试 (覆盖率>80%)
- [ ] 相关文档已更新
- [ ] 未引入新的critical/high bug
- [ ] CI流程全绿

第一阶段总计约 **49小时** ≈ **1.2周**（每天8h工作）

