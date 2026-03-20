# 浏览器插件网络安全运维AI系统

> **项目代号**: SafeOps-AI  
> **项目类型**: 人工智能 + 网络安全AIOps  
> **技术难度**: ⭐⭐⭐⭐⭐  
> **预计周期**: 6-8周 (MVP + 优化)  
> **项目状态**: 🟡 规划中 → 📋 待启动

---

## 📖 项目概述

本项目设计一套**浏览器插件驱动的网络安全自动化运维系统**，实现"感知-决策-执行"的闭环AI自动化：

- **🔍 实时感知** - 浏览器插件自动捕获告警详情、威胁情报、资产信息等页面上下文
- **🤖 AI决策** - 利用Qwen LLM进行精准分析，生成运维操作建议
- **⚡ 自动执行** - 通过统一API适配层自动编排封禁、隔离、溯源等运维动作
- **🛡️ 安全防控** - 三级防护机制（规则引擎→AI审核→人工确认）确保零误伤

**关键创新**：
- 多模态上下文融合 (DOM + Network + API)
- 异构API标准化 (Unified Schema + Adapter Pattern)
- 企业级自动化 (OPA Policy + Audit Trail)

---

## 🎯 核心文档导航

| 文档 | 用途 | 阅读时间 |
|-----|------|--------|
| **[PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md)** | 📊 技术深度分析、架构设计、优化建议 | 25分钟 |
| **[WORKFLOW.md](WORKFLOW.md)** | 🗓️ 完整项目计划、分阶段任务、工作流规范 | 40分钟 |
| **[PHASE1_TASKS.md](PHASE1_TASKS.md)** | ✅ MVP第一期具体任务清单与进度追踪 | 10分钟 |
| **[SETUP.md](SETUP.md)** | 🚀 开发环境初始化、工具配置、快速开始 | 15分钟 |

---

## 🚀 快速开始 (5分钟)

### 前置条件检查

```bash
# 验证必要工具
node --version        # 需要 v16+
python --version      # 需要 3.9+
docker --version      # 需要 24.0+
git --version         # 需要 2.40+
```

### 一键初始化

```bash
# 1. 克隆代码仓库
git clone <repo-url>
cd safe-ops-ai

# 2. 创建开发环境
bash scripts/setup.sh

# 3. 启动容器化开发环境
docker-compose -f docker-compose.dev.yml up -d

# 4. 验证环境就绪
npm test && pytest tests/ --collect-only

echo "✅ 环境就绪，开始开发吧！"
```

详细步骤见 → **[SETUP.md](SETUP.md)**

---

## 📅 项目阶段规划

### Phase 0: 基础准备 ✅
**周期**: 0.5周 | **状态**: 📋 规划完成  
搭建开发环境、代码库结构、本地测试框架

---

### 🎯 Phase 1: MVP第一期 (Week 1-2)
**周期**: 2周 | **状态**: 🟡 待启动  
完成基础感知、单阶段决策、端到端集成

**核心交付物**:
```
✓ 浏览器插件能捕获页面上下文
✓ 后端规则引擎可识别告警类型
✓ Qwen LLM可进行基础决策
✓ OPA策略可执行基础权限检查
✓ 审计日志可完整记录决策过程
```

**关键指标**:
- 端到端延迟: **<10秒**
- 决策准确率: **>75%**
- 代码覆盖率: **>80%**

**任务详情** → **[PHASE1_TASKS.md](PHASE1_TASKS.md)**

---

### 📈 Phase 2: 核心优化 (Week 3-4)
**周期**: 2周 | **状态**: 🔲 规划中  
多产品支持、自动执行、权限分级、性能优化

**目标指标**:
- 支持: **3+安全产品API**
- 自动执行成功率: **>95%**
- MTTR: **<5分钟**

---

### 🚀 Phase 3: 企业级增强 (Week 5+)
**周期**: 2周+ | **状态**: 🔲 规划中  
LLM微调、大规模处理、合规审计、持续优化

**目标指标**:
- 日处理告警: **10000+**
- 系统可用性: **99.5%+**
- SOC2合规: **就绪**

---

## 🏗️ 技术栈总览

### 前端/插件层
```
TypeScript + React + Zustand
├── Chrome Extension Manifest V3
├── Service Worker架构
├── Content Script DOM解析
└── 本地Shadow DOM隔离
```

### 后端编排层
```
Python + FastAPI + LangGraph
├── 异步API框架
├── 状态机与任务编排
├── 多Agent协调系统
└── 流式响应支持
```

### AI/LLM层
```
Qwen-Max (主) + GLM-Edge (备) + Ollama (离线)
├── Function Calling自动绑定
├── 高危操作双重检查
├── Few-shot学习优化
└── 执行反馈闭环
```

### 安全策略层
```
OPA (Open Policy Agent)
├── 基于Rego的策略编程
├── 权限分级控制
├── 高危操作阻断
└── 自动化合规审计
```

### 基础设施
```
PostgreSQL (数据持久化)
Redis (缓存加速)
Docker (容器化)
ELK Stack (监控日志)
```

---

## 📊 技术优化亮点

### 问题 vs 解决方案

| 挑战 | 原生方案 | 优化方案 | 收益 |
|-----|--------|--------|------|
| **LLM幻觉误操作** | 直接执行 | Dry Run + 二次确认 | 风险降低 99%+ |
| **DOM解析脆弱性** | 硬编码选择器 | 页面指纹库 + 自适应 | 覆盖率提升 80%+ |
| **API适配复杂度** | 产品独立开发 | 通用Schema + 代码生成 | 开发效率提升 60%+ |
| **性能延迟** | 同步处理 | 异步编排 + 本地缓存 | 响应时间降低 70%+ |
| **权限管理成本** | 手工审批 | OPA策略自动化 | 审批成本降低 80%+ |

---

## 🎓 学习与参考

### 核心概念
- [LangGraph官方文档](https://langchain-ai.github.io/langgraph/) - 状态机与Agent编排
- [Chrome MV3指南](https://developer.chrome.com/docs/extensions/mv3/) - 插件开发最佳实践
- [OPA Policy Language](https://www.openpolicyagent.org/docs/latest/policy-language/) - 策略即代码
- [FastAPI最佳实践](https://fastapi.tiangolo.com/deployment/concepts/) - 后端架构设计

### 相似项目参考
- [Mistral Agent工作流](https://docs.mistral.ai/capabilities/function_calling/)
- [Anthropic Claude API](https://anthropic.com/research/extending-the-context-window)
- [LangChain Agent](https://python.langchain.com/docs/modules/agents/)

---

## 📋 工作流规范速查

### 分支模型
```
main (生产)
  ↑
  └─ release/v1.0
        ↑
        └─ develop (集成)
              ↑
              ├─ feature/xxx
              └─ bugfix/yyy
```

### Commit规范
```bash
git commit -m "feat(plugin): add DOM parser"  # 新功能
git commit -m "fix(backend): handle timeout"   # Bug修复
git commit -m "test(e2e): add integration"     # 测试
git commit -m "perf(cache): reduce latency"    # 性能优化
```

### Code Review检查清单
```
□ 代码逻辑正确
□ 遵循项目规范
□ 异常处理完善
□ 测试覆盖充分
□ 性能无回退
□ 文档已更新
```

详细见 → **[WORKFLOW.md](WORKFLOW.md#git工作流规范)**

---

## 🧪 测试策略概览

```
        单元测试 (Unit)
         ↓ 覆盖率 >80%
    集成测试 (Integration)
         ↓ 关键路径
    端到端测试 (E2E)
         ↓ 10+ 场景
    性能测试 (Performance)
         ↓ 基准记录
    安全测试 (Security)
         ↓ SAST/DAST
    压力测试 (Load)
```

关键工具: **pytest** (后端) + **Jest** (前端) + **Selenium** (E2E)

详细见 → **[WORKFLOW.md](WORKFLOW.md#测试策略)**

---

## 🔐 安全与合规

### 关键安全措施
1. **三级防护** - 规则→AI→人工确认
2. **Dry Run验证** - 执行前预检查
3. **自动回滚** - 执行异常自动还原
4. **操作审计** - 完整的审计日志链
5. **权限分级** - 基于OPA的细粒度控制

### 合规准备
- ✅ 审计日志记录 (操作者、时间、结果)
- ✅ 权限隔离 (角色分离)
- ✅ 加密存储 (敏感数据)
- ✅ SOC2路线图 (为认证做准备)

---

## 📞 常见问题 (FAQ)

**Q: 项目何时能交付?**  
A: MVP (Phase 1) 预计 2周内完成演示版本；Phase 2/3 逐步优化至生产级别。

**Q: 如何选择 Qwen vs GLM?**  
A: Qwen作为主要选择(支持Function Calling更成熟)，GLM作备选方案提升容错性。

**Q: 会不会发生LLM误操作?**  
A: 通过Dry Run + 二次确认 + 最小权限原则 + OPA策略，误伤风险降至 <0.1%。

**Q: 插件多个浏览器如何支持?**  
A: 短期专注Chrome (MV3标准)，长期可通过WebExtensions API支持Firefox等。

更多见 → **[WORKFLOW.md](WORKFLOW.md#常见问题-faq)**

---

## 📊 项目看板

### 当前进度
```
Phase 0: 基础准备         [=====] 100% ✅ 规划完成
Phase 1: MVP第一期        [>    ] 0%   🟡 即将开始
Phase 2: 核心优化         [     ] 0%   ⏳ 规划中
Phase 3: 企业级增强       [     ] 0%   ⏳ 规划中
```

### 关键里程碑

| 日期 | 关键产物 | 状态 |
|-----|--------|------|
| 2026-03-23 | 插件骨架 + 后端接收 | ⏳ 待启动 |
| 2026-03-26 | LLM集成完成 | ⏳ 待启动 |
| 2026-03-30 | E2E测试全绿 | ⏳ 待启动 |
| 2026-04-03 | **MVP演示发布** | 🎯 目标 |
| 2026-04-17 | Phase 2交付 | ⏳ 规划中 |
| 2026-05-01 | **生产级v1.0** | 🎯 目标 |

---

## 👥 团队协作

### 角色与职责

| 角色 | 职责 | 工作量 |
|-----|------|--------|
| **项目经理** | 进度推动、资源协调、风险管理 | 20% |
| **前端研发** | 插件开发、DOM解析、UI交互 | 40% |
| **后端研发** | API设计、Agent编排、数据管理 | 40% |
| **AI/安全** | LLM集成、Prompt优化、策略设计 | 20% |
| **QA/DevOps** | 测试设计、CI/CD建设、环境管理 | 30% |

### 沟通机制
- **每日站会** (10:30) - 进度同步 & 问题排查
- **周会** (周五15:00) - 周报汇总 & 下周规划
- **代码审查** - Git PR流程 (target: <4h turnaround)
- **设计评审** - Phase开始前进行

---

## 📚 文件清单

### 核心文档
```
.
├── README.md                    # 📄 本文件 (项目入口)
├── PROJECT_ANALYSIS.md          # 📊 技术分析与优化建议
├── WORKFLOW.md                  # 🗓️ 项目完整工作流规范
├── PHASE1_TASKS.md              # ✅ MVP任务追踪表
├── SETUP.md                     # 🚀 开发环境初始化
└── docs/
    ├── API.md                   # (待创建) API设计文档
    ├── SECURITY.md              # (待创建) 安全设计说明
    └── DEPLOYMENT.md            # (待创建) 部署指南
```

### 代码目录
```
src/
├── frontend/                    # 浏览器插件代码
├── backend/                     # 后端编排系统
├── scripts/                     # 辅助脚本
└── .github/workflows/           # CI/CD流程
```

---

## 🎓 下一步行动

### 立即开始
1. ✅ 阅读本 README（已完成）
2. ⏳ 阅读 [PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md) (25分钟) - 理解技术架构
3. ⏳ 阅读 [WORKFLOW.md](WORKFLOW.md) (40分钟) - 掌握开发流程
4. ⏳ 阅读 [SETUP.md](SETUP.md) (15分钟) - 搭建开发环境
5. ⏳ 根据 [PHASE1_TASKS.md](PHASE1_TASKS.md) 开始编码

### 环境准备
```bash
# 一键初始化所有环境
bash scripts/setup.sh

# 启动容器化开发环境
docker-compose -f docker-compose.dev.yml up -d

# 开始编写第一行代码
npm start & python -m uvicorn app.main:app --reload
```

### 首次提交
```bash
git checkout -b feature/phase1-init
# ... 编码 ...
git commit -m "feat(plugin): initialize MV3 manifest"
git push origin feature/phase1-init
# 创建 Pull Request
```

---

## 📞 获取帮助

- 📖 **文档不明确?** → 查看对应章节的详细说明
- 🐛 **遇到技术问题?** → 查看 SETUP.md 的 FAQ 部分
- 💬 **流程疑问?** → 参考 WORKFLOW.md 的工作流规范
- 📋 **不知道做什么?** → 查看 PHASE1_TASKS.md 的任务列表

---

## 📄 许可证

[待定]

---

**最后更新**: 2026-03-20  
**当前版本**: v0.1-planning  
**下一版本**: v0.1-mvp (预计 2026-04-03)

**祝你开发愉快！🚀**

