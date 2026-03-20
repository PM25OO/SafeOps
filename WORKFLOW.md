# 浏览器插件网络安全运维AI系统 - 项目Workflow

> **版本**: v1.0 | **更新时间**: 2026-03-20 | **预计工期**: 6-8周

## 目录
1. [项目组织结构](#项目组织结构)
2. [开发阶段规划](#开发阶段规划)
3. [Git工作流规范](#git工作流规范)
4. [测试策略](#测试策略)
5. [每日迭代检查清单](#每日迭代检查清单)

---

## 项目组织结构

```
safe-ops-ai/
├── frontend/                          # 浏览器插件前端
│   ├── src/
│   │   ├── manifest.json              # MV3配置
│   │   ├── service-worker.ts          # 后台服务脚本
│   │   ├── content-script.ts          # 页面注入脚本
│   │   ├── popup/                     # 弹窗UI
│   │   ├── options/                   # 配置页面
│   │   ├── parser/                    # DOM解析器
│   │   └── api/                       # 后端通信
│   ├── tests/                         # 单元测试
│   └── dist/                          # 构建输出
│
├── backend/                           # 后端编排系统
│   ├── app/
│   │   ├── main.py                    # FastAPI入口
│   │   ├── agents/
│   │   │   ├── rule_engine_agent.py   # 规则引擎Agent
│   │   │   ├── ai_agent.py            # AI决策Agent
│   │   │   └── audit_agent.py         # 审计Agent
│   │   ├── orchestration/
│   │   │   ├── state_machine.py       # LangGraph状态机
│   │   │   └── workflow.py            # 工作流编排
│   │   ├── adapters/                  # API适配器
│   │   ├── security/
│   │   │   ├── opa_engine.py          # OPA策略执行
│   │   │   └── audit_log.py           # 审计日志
│   │   └── llm_bridge/
│   │       └── model_client.py        # LLM调用封装
│   ├── tests/                         # 单元+集成测试
│   ├── requirements.txt
│   └── docker/                        # 容器化配置
│
├── scripts/                           # 工具脚本
│   ├── setup.sh                       # 开发环境初始化
│   ├── build_plugin.sh                # 构建插件
│   └── run_tests.sh                   # 运行测试套件
│
├── docs/                              # 文档
│   ├── API.md                         # API设计文档
│   ├── SECURITY.md                    # 安全设计说明
│   └── DEPLOYMENT.md                  # 部署指南
│
└── .github/
    └── workflows/
        ├── build.yml                  # CI构建流程
        ├── test.yml                   # 测试流程
        └── deploy.yml                 # CD部署流程
```

---

## 开发阶段规划

### 📅 **Phase 0: 基础准备 (Day 1, 0.5周)**

**目标**: 搭建开发环境、代码库基础结构、本地测试框架

| 任务 | 预计工时 | 关键输出 | 验收标准 |
|-----|--------|--------|--------|
| 初始化代码仓库结构 | 1h | 目录树 | ✅ 所有文件夹已建立 |
| 前端开发环境配置 (Node.js + webpack) | 2h | package.json | ✅ npm install 成功 |
| 后端开发环境配置 (Python venv) | 2h | requirements.txt | ✅ pip install 成功 |
| Git工作流规范制定 | 1.5h | .gitignore + commit规范 | ✅ CI流程可自动化检查 |
| Docker本地测试环境 | 2h | docker-compose.yml | ✅ docker-compose up 可启动 |

**完成标志**:
```bash
├── Frontend: npm run build 产生 dist/
├── Backend: python -m pytest tests/ 全绿
└── Git: git log 显示规范化commit信息
```

---

### 🎯 **Phase 1: MVP第一期 - 基础感知与单阶段决策 (Week 1-2, 10天)**

#### Sprint 1.1: 浏览器插件基础框架 (3天)

**目标**: 完成插件可独立工作，能解析页面并上报信息

| 任务ID | 任务 | 工时 | 关键测试 | Git Commit模式 |
|--------|-----|------|--------|-------|
| FE-1.1.1 | 创建MV3 manifest + service-worker骨架 | 2h | 插件可加载 | `feat(plugin): init MV3 structure` |
| FE-1.1.2 | 实现Content Script页面DOM解析器 | 4h | 单元测试覆盖主要选择器 | `feat(parser): add DOM parser` |
| FE-1.1.3 | 设计与后端通信协议(ProtoBuf或JSON) | 2h | 协议文档 | `docs(api): define plugin-backend protocol` |
| FE-1.1.4 | 实现消息路由中间件 | 3h | 消息可双向传递 | `feat(messaging): add Router` |
| **小计** | | **11h** | | |

**完成产物**:
```
✅ 插件可在 Chrome devtools 加载
✅ 页面打开时自动解析DOM，在Console输出结构化信息
✅ 后端地址可在 options 页面配置
✅ 缓存解析结果用于本地调试
```

---

#### Sprint 1.2: 后端基础框架与规则引擎Agent (3天)

**目标**: 后端可接收插件数据，执行规则引擎判断

| 任务ID | 任务 | 工时 | 关键测试 | Git Commit |
|--------|-----|------|---------|----------|
| BE-1.2.1 | FastAPI项目初始化 + LangGraph集成 | 2h | FastAPI 可启动 | `feat(backend): init FastAPI + LangGraph` |
| BE-1.2.2 | 实现 RuleEngineAgent(规则库) | 4h | 单元测试+规则引擎集成测试 | `feat(agents): add RuleEngineAgent` |
| BE-1.2.3 | 设计数据模型(Pydantic Schema) | 2h | 模型自动生成API文档 | `feat(models): define core schemas` |
| BE-1.2.4 | 实现接收插件数据的API端点 | 3h | 集成测试：插件→后端→数据库 | `feat(api): add /analyze endpoint` |
| **小计** | | **11h** | | |

**完成产物**:
```
✅ 后端 http://localhost:8000/docs 可访问API文档
✅ 规则引擎支持最少5条内置规则（如：告警等级判断、资产类型识别等）
✅ 支持自定义规则上传
✅ 规则匹配命中率测试数据集覆盖 >90%
```

---

#### Sprint 1.3: Qwen LLM集成与决策Agent (3天)

**目标**: LLM可调用Function Calling做决策

| 任务ID | 任务 | 工时 | 关键测试 | Git Commit |
|--------|-----|------|---------|----------|
| BE-1.3.1 | 设计LLM Bridge (Qwen client封装) | 2h | 单元测试 | `feat(llm): add Qwen client wrapper` |
| BE-1.3.2 | 定义Function Calling Schema(操作清单) | 3h | JSONSchema 校验 + 文档生成 | `feat(llm): define function schemas` |
| BE-1.3.3 | 实现 AIAgent (LangGraph节点) | 4h | 集成测试：告警→LLM→决策 | `feat(agents): add AIAgent` |
| BE-1.3.4 | 测试LLM误伤场景 & Prompt优化 | 3h | few-shot用例库 | `docs(llm): add safety prompts` |
| **小计** | | **12h** | | |

**完成产物**:
```
✅ Qwen LLM 可识别并调用 ≤5个核心Function
✅ 响应时间 <8s（计入LLM推理时间）
✅ 决策准确率 >75%（测试集20条告警）
✅ 拒绝率 <5%（LLM主动拒绝不够自信的决策）
```

---

#### Sprint 1.4: OPA基础策略与人工审核Agent (2天)

**目标**: OPA可进行基础权限检查，Audit Agent可缓存决策待审核

| 任务ID | 任务 | 工时 | 关键测试 | Git Commit |
|--------|-----|------|---------|----------|
| BE-1.4.1 | 部署OPA + 编写基础策略库(3条) | 3h | 集成测试 | `feat(security): add OPA policies` |
| BE-1.4.2 | 实现 AuditAgent (决策持久化) | 2h | 决策可查询&可审核 | `feat(agents): add AuditAgent` |
| BE-1.4.3 | 设计审计日志数据模型 | 1h | 数据库表创建 | `feat(database): add audit log schema` |
| **小计** | | **6h** | | |

**完成产物**:
```
✅ OPA策略阻止率 = 0%（检查通过的决策）
✅ 审计日志可记录：操作者、操作类型、目标、时间戳、批准状态
✅ 支持通过API查询历史决策 > 查询<1s
```

---

#### Sprint 1.5: 端到端集成测试 & MVP Demo (2天)

**目标**: 一个完整的控制流程：告警→感知→决策→待执行

| 任务ID | 任务 | 工时 | 关键测试 | Git Commit |
|--------|-----|------|---------|----------|
| INT-1.5.1 | 编写E2E测试用例库(10个场景) | 4h | Pytest + Selenium | `test(e2e): add integration test suite` |
| INT-1.5.2 | 构建演示数据集 & 配置演示环境 | 3h | Docker Compose 可启动 | `docs(demo): add demo setup guide` |
| INT-1.5.3 | 性能基准测试(baseline) | 2h | 端到端延迟记录 | `test(performance): add baseline metrics` |
| **小计** | | **9h** | | |

**完成产物**:
```
✅ MVP演示视频（≤5min）展示完整流程
✅ 端到端延迟 <10s（告警输入到决策输出）
✅ 可重复演示的Docker容器化环境
✅ 所有E2E测试全绿
```

**Phase 1 总结**:
- 工时: 约49小时 ≈ 1.2周（每天8h工作）
- 输出: 可演示的MVP系统
- 关键指标: 决策准确率 75%+, 端到端延迟 <10s

---

### 🔄 **Phase 2: 核心优化 - 多产品支持与自动执行 (Week 3-4, 10天)**

#### Sprint 2.1: 异构API适配框架 (3天)

**目标**: 设计通用Adapter模式，支持3+安全产品API

| 任务ID | 任务 | 工时 | 关键测试 | Git Commit |
|--------|-----|------|---------|----------|
| BE-2.1.1 | 设计通用API Schema & Adapter接口 | 2h | 接口文档 | `feat(adapters): define adapter interface` |
| BE-2.1.2 | 实现 Firewall Adapter (产品A) | 3h | Mock测试 | `feat(adapters): add firewall adapter` |
| BE-2.1.3 | 实现 Endpoint Protection Adapter (产品B) | 3h | Mock测试 | `feat(adapters): add edr adapter` |
| BE-2.1.4 | 实现 SIEM Adapter (产品C) | 3h | Mock测试 | `feat(adapters): add siem adapter` |
| **小计** | | **11h** | | |

**完成产物**:
```
✅ 3个生产Adapter支持端到端调用
✅ Adapter单元测试覆盖率 >85%
✅ API Schema文档自动生成
```

---

#### Sprint 2.2: 执行引擎与回滚机制 (3天)

**目标**: 支持"Dry Run→人工确认→执行→验证→回滚"完整链路

| 任务ID | 任务 | 工时 | 关键测试 | Git Commit |
|--------|-----|------|---------|----------|
| BE-2.2.1 | 实现 ExecutorAgent & 预检查逻辑 | 3h | 集成测试 | `feat(executor): add pre-check & dry-run` |
| BE-2.2.2 | 实现执行后验证逻辑 | 2h | 场景测试 | `feat(executor): add post-exec verification` |
| BE-2.2.3 | 实现自动回滚机制 | 3h | 故障注入测试 | `feat(executor): add auto-rollback` |
| BE-2.2.4 | LangGraph融合ExecutorAgent | 2h | E2E测试 | `feat(orchestration): integrate executor` |
| **小计** | | **10h** | | |

**完成产物**:
```
✅ Dry Run可预判执行结果 (准确率 >90%)
✅ 支持条件自动回滚
✅ 执行结果异常率 <1%（自动回滚覆盖 >95% case）
```

---

#### Sprint 2.3: 多用户权限分级 (2天)

**目标**: OPA支持角色权限，UI支持权限申请流程

| 任务ID | 任务 | 工时 | 关键测试 | Git Commit |
|--------|-----|------|---------|----------|
| BE-2.3.1 | 扩展OPA权限策略 (4个角色) | 2h | 单元测试 | `feat(security): add role-based policies` |
| BE-2.3.2 | 实现权限申请与审批工作流 | 3h | 集成测试 | `feat(auth): add permission request flow` |
| FE-2.3.3 | UI展示操作权限提示 | 2h | 交互测试 | `feat(ui): add permission hints` |
| **小计** | | **7h** | | |

**完成产物**:
```
✅ 支持 Admin/SecurityOps/Analyst/Viewer 4个角色
✅ 权限检查耗时 <100ms
✅ UI对无权限操作有明确提示
```

---

#### Sprint 2.4: 性能优化与监控 (2天)

**目标**: 满足高吞吐，监控覆盖关键路径

| 任务ID | 任务 | 工时 | 关键测试 | Git Commit |
|--------|-----|------|---------|----------|
| BE-2.4.1 | 添加Redis缓存层（决策、规则库） | 3h | 缓存命中率测试 | `feat(cache): add Redis caching` |
| BE-2.4.2 | 实现流式LLM输出 | 2h | 延迟测试 | `feat(llm): add stream output` |
| BE-2.4.3 | 集成ELK/Prometheus监控 | 3h | 仪表板创建 | `feat(monitoring): add ELK stack` |
| **小计** | | **8h** | | |

**完成产物**:
```
✅ P99延迟降低 >30% (vs Phase 1)
✅ 吞吐量支持 ≥100 req/min（单机）
✅ 监控告警配置 ≥5个关键指标
```

**Phase 2 总结**:
- 工时: 约36小时 ≈ 0.9周
- 输出: 生产级多产品支持系统
- 关键指标: 支持3+产品, 自动执行成功率 95%+, MTTR <5min

---

### 🚀 **Phase 3: 企业级增强与迭代优化 (Week 5-6+)**

#### Sprint 3.1: LLM优化与域内微调 (3天)

- [ ] 采集真实告警数据构建微调数据集
- [ ] 基于Qwen进行LoRA微调 (NeuralChat或基础微调)
- [ ] A/B测试对比效果（决策准确率提升）
- [ ] 集成微调模型到系统

**目标指标**: 决策准确率 > 90%

---

#### Sprint 3.2: 大规模告警处理优化 (3天)

- [ ] 实现批量处理管道
- [ ] 消息队列分片设计
- [ ] 数据库索引与查询优化
- [ ] 压测（10000+ 告警/天）

**目标指标**: 吞吐 ≥ 1000 req/min, 可用性 99.5%+

---

#### Sprint 3.3: 安全审计与合规认证 (2天)

- [ ] 补充审计日志字段（符合SOC2）
- [ ] 权限操作的加密存储
- [ ] 定期审计报表自动生成
- [ ] 数据保留策略（如：7年）

**目标**: 通过内部审计, 为将来SOC2认证铺垫

---

#### 持续迭代（Week 5-8+）

- [ ] 客户反馈收集与优先级排序
- [ ] Bug修复与性能微调
- [ ] 文档完善
- [ ] 内部推广与培训

---

## Git工作流规范

### 分支模型

```
main (生产分支)
  ↑
  └─ release/v1.0 (发版准备)
        ↑
        └─ develop (集成分支)
              ↑
              ├─ feature/plugin-parser (功能分支)
              ├─ feature/llm-bridge
              ├─ bugfix/dom-parsing
              └─ docs/api-documentation
```

### Commit规范 (Conventional Commits)

**格式:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type类别:**
- `feat`: 新功能
- `fix`: 错误修复
- `test`: 测试相关
- `docs`: 文档
- `chore`: 构建、依赖等
- `perf`: 性能优化
- `refactor`: 代码重构

**Scope范围** (二选一):
- 代码位置: `plugin`, `backend`, `llm`, `security`
- 功能域: `parser`, `adapter`, `executor`, `audit`

**示例:**

```bash
# 新功能
git commit -m "feat(plugin): add DOM shadow wrapper for style isolation"

# Bug修复
git commit -m "fix(parser): handle dynamic content reload"

# 测试
git commit -m "test(backend): add integration test for adapter layer"

# 性能优化
git commit -m "perf(cache): reduce LLM call latency by 40% with Redis"

# 带详细说明
git commit -m "feat(executor): implement auto-rollback on execution failure

- Add transaction-like semantics for multi-step operations
- Support dry-run verification before actual execution
- Automatic rollback if post-execution check fails

Fixes #123"
```

### PR与代码审查流程

**提交PR前检查清单:**
```
□ 分支从最新 develop 拉取
□ 本地单元测试全绿
□ Lint检查无误 (use flake8 for Python, eslint for TypeScript)
□ Commit信息符合规范
□ 添加了对应的单元测试 (覆盖率 >80%)
□ 更新了相关文档
□ 没有secrets/密钥泄露
```

**PR标题与描述模板:**

```markdown
## 标题
feat(llm): integrate Qwen with function calling support

## 关联Issue
Fixes #42

## 变更说明
- 实现了LLM Bridge层封装Qwen API
- 支持Function Calling自动绑定Python函数
- 集成了错误重试与降级机制

## 验收测试
- [x] LLM可成功调用5个核心function
- [x] 响应时间 <8s
- [x] 错误恢复时间 <2s

## 影响范围
- backend/llm_bridge/
- backend/agents/ai_agent.py
- 无DB迁移需求
```

---

## 测试策略

### 1. 单元测试 (UT)

**Coverage目标**: ≥80% 代码覆盖率

**工具选择**:
- Backend: `pytest` + `pytest-cov`
- Frontend: `Jest` + React Testing Library

**关键路径覆盖**:

```python
# backend/tests/test_rule_engine.py
class TestRuleEngineAgent:
    def test_rule_match_basic(self):
        """基础规则匹配"""
        agent = RuleEngineAgent(rules=[...])
        result = agent.analyze(alert_data)
        assert result.matched_rules == [rule1, rule2]
    
    def test_rule_priority_ordering(self):
        """规则优先级排序"""
        ...
    
    def test_malformed_input_handling(self):
        """异常输入处理"""
        ...
```

```typescript
// frontend/tests/parser.test.ts
describe('DOMParser', () => {
  test('should extract alert ID from known page', () => {
    const html = mockAlertPage();
    const result = parseAlertContext(html);
    expect(result.alertId).toBe('ALT-2026-001');
  });
  
  test('should handle dynamic content update', () => {
    // Shadow DOM场景
    ...
  });
});
```

### 2. 集成测试 (IT)

**目标**: 验证模块间协作

**关键路径**:

| 测试场景 | IT类型 | Pass标准 |
|---------|--------|---------|
| 插件→后端数据传输 | API集成 | 延迟 <2s |
| 后端多Agent协调 | LangGraph集成 | 状态转移正确 |
| LLM模型切换 | 降级测试 | 自动failover <1s |
| 数据库事务 | DB集成 | ACID特性保证 |

```bash
# 运行集成测试
pytest tests/integration/ -v --tb=short

# 覆盖率报告
pytest tests/ --cov=app --cov-report=html
```

### 3. E2E测试 (端到端)

**工具**: Selenium/Playwright + Mock Server

**关键场景** (10条):

```gherkin
Scenario: 告警完整处理流程
  Given 浏览器插件已安装
  When 页面出现高级别告警
  Then 插件自动捕获上报
  And 后端规则引擎识别
  And LLM生成决策建议
  And 审计日志记录
  And UI展示待审核决策
```

**执行频率**:
- 开发阶段: 每个PR前本地跑
- CI流程: 每次merge to develop
- 烟雾测试: 每日定时跑

### 4. 性能测试 (PT)

**基准设置** (Phase 1):

| 指标 | 目标 | 验收标准 |
|-----|------|--------|
| 端到端延迟 | <10s | P99 <12s |
| 插件启动时间 | <2s | 不阻塞页面加载 |
| 内存占用 | <50MB | 长时间运行无泄漏 |
| LLM响应 | <8s | 含网络往返 |

**压测** (Phase 2):

```bash
# 使用 locust 压测后端
locust -f tests/load/locustfile.py --host=http://localhost:8000 -u 100 -r 10 -t 5m
```

### 5. 安全测试 (ST)

**关键关注点**:

- [ ] SQL注入防护 (ORM + 参数化查询)
- [ ] 权限边界测试 (OPA策略验证)
- [ ] 秘密扫描 (无密钥/token在代码中)
- [ ] 依赖漏洞扫描 (OWASP DependencyCheck)

```bash
# SAST扫描
bandit -r app/ -f json -o bandit-report.json

# 依赖检查
pip-audit --desc
```

### 6. 测试数据管理

**Mock数据库**:
```python
# tests/fixtures/alert_data.py
@pytest.fixture
def sample_alerts():
    return [
        {
            "alert_id": "ALT-2026-001",
            "severity": "critical",
            "asset": "prod-server-01",
            ...
        },
        ...
    ]
```

**测试数据库** (SQLite内存):
```bash
TEST_DATABASE_URL=sqlite:///:memory: pytest tests/
```

---

## 每日迭代检查清单

### 📋 开发者每日检查 (Daily Standup)

**上午更新（Stand-up前）**:

- [ ] 取最新代码: `git pull origin develop`
- [ ] 运行本地测试: `pytest tests/ && npm test`
- [ ] 检查Lint: `flake8 app/` & `eslint src/`
- [ ] 更新任务看板状态 (GitHub Projects/Jira)

**代码提交前**:

```bash
# 提交前检查清单
□ git status（确认只改了需要改的文件）
□ git diff（检查diff内容合理性）
□ npm test / pytest tests/（覆盖当前改动的测试）
□ npm run lint:fix / black app/（自动格式化）
□ git commit -m "type(scope): message"（符合规范）
□ git push origin feature/xxx
```

**代码审查检查** (CR者职责):

- [ ] 代码逻辑正确性
- [ ] 是否遵循项目规范
- [ ] 崩溃路径处理
- [ ] 性能影响评估
- [ ] 测试覆盖充分性
- [ ] 文档更新

### 📊 周报核查要素

**每周五提交周报**:

| 指标 | 本周 | 目标 | 状态 |
|-----|------|------|------|
| Feature完成数 | 3 | 3 | ✅ |
| Bug修复 | 2 | <5 | ✅ |
| 测试覆盖率 | 82% | ≥80% | ✅ |
| Code Review周期 | <4h | <8h | ✅ |
| 生产问题 | 0 | 0 | ✅ |

---

## 交付检查清单

### 🎯 阶段成果验收

**Phase 1交付清单** (Week 2末):

```markdown
## MVP系统验收

### 功能验收
- [ ] 浏览器插件可正常加载（Chrome DevTools无错误）
- [ ] 页面DOM解析正确率 >90%
- [ ] 数据上报到后端 <2s
- [ ] 规则匹配准确率 >85%
- [ ] LLM决策准确率 >75%
- [ ] OPA策略生效 (无bypass case)
- [ ] 审计日志完整记录

### 质量指标
- [ ] 代码覆盖率 ≥80%
- [ ] E2E测试全绿 (10/10)
- [ ] 无critical/high级Bug
- [ ] 性能基准已记录

### 文档完整性
- [ ] API文档 (/docs)
- [ ] 架构设计文档
- [ ] 部署指南
- [ ] 操作手册

### 演示与交付
- [ ] 演示视频 (<5min)
- [ ] 可复现的Demo环境
- [ ] GitHub Release发布
```

**Phase 2/3交付清单**: 类似，递增关键指标

---

## 工具链清单

### 开发工具

```yaml
版本控制: Git(GitHub)
CI/CD: GitHub Actions
编程语言: TypeScript(FE), Python(BE)
包管理: npm(FE), pip(BE)
数据库: PostgreSQL(主) + Redis(缓存)
容器: Docker + Docker Compose
测试框架: Jest(FE), pytest(BE), Selenium(E2E)
代码质量: ESLint, flake8, Bandit
API文档: Swagger/OpenAPI 3.0
监控: ELK Stack(日志), Prometheus(指标)
```

### 命令速查

```bash
# 开发
npm install && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# 构建
npm run build && python -m pytest tests/

# 本地运行
docker-compose up -d
npm start & python -m uvicorn app.main:app --reload

# 质量检查
npm run lint && pytest tests/ --cov=app
flake8 app/ && bandit -r app/

# 提交前
git add -A && git commit -m "feat(scope): message"
git push origin feature/xxx
```

---

## 常见问题 (FAQ)

**Q: 如果Phase X 延期怎么办?**
A: 优先级排序→ critical → high → nice-to-have. 后移不关键feature.

**Q: LLM API费用如何控制?**
A: Redis缓存+本地fallback+Dry Run不计费 → 预估月度成本.

**Q: 如何处理生产Bug?**
A: hotfix分支 → Code Review → 直接merge main/develop → 发版补丁

**Q: 权限不足怎么回滚?**
A: OPA deny时自动触发AuditAgent.reject → 日志记录 → 通知权限所有者.

---

## 参考资源

- [Conventional Commits](https://www.conventionalcommits.org/)
- [LangGraph文档](https://langchain-ai.github.io/langgraph/)
- [Chrome MV3指南](https://developer.chrome.com/docs/extensions/mv3/)
- [OPA Rego语言](https://www.openpolicyagent.org/docs/latest/policy-language/)
- [FastAPI最佳实践](https://fastapi.tiangolo.com/deployment/concepts/)

---

**版本历史**:
- v1.0 (2026-03-20): 初版发布

