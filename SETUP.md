# 项目初始化与开发环境设置

## 🚀 快速开始 (5分钟)

### 前置条件

```bash
# 验证系统工具
node --version        # v16+ 推荐 v18/20
python --version      # 3.9+
docker --version      # 24.0+
git --version         # 2.40+
```

### 一键初始化

```bash
# 1. 克隆仓库
git clone <repo-url>
cd safe-ops-ai

# 2. 运行初始化脚本
bash scripts/setup.sh

# 3. 启动开发环境
docker-compose -f docker-compose.dev.yml up -d

# 4. 验证
npm test && pytest tests/ --co
```

---

## 📦 项目结构初始化

### 创建项目骨架

```bash
# 创建目录结构
mkdir -p frontend/{src,tests,dist}
mkdir -p backend/{app/{agents,orchestration,adapters,security,llm_bridge},tests}
mkdir -p scripts docs .github/workflows

# 前端初始化
cd frontend
npm init -y
npm install --save-dev webpack webpack-cli typescript ts-loader eslint prettier
npm install --save react zustand
cd ..

# 后端初始化
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

### 核心配置文件

**`requirements.txt` (后端)**
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.13.0
pydantic-settings==2.1.0
sqlalchemy==2.0.25
psycopg2-binary==2.9.9
redis==5.0.1
requests==2.31.0
python-dotenv==1.0.0

# LangChain/LangGraph
langchain==0.1.9
langgraph==0.0.20
langchain-community==0.0.24
langchain-openai==0.0.11

# Security & OPA
opa==0.60.0
cryptography==41.0.7
python-jose==3.3.0

# Testing
pytest==7.4.4
pytest-cov==4.1.0
pytest-asyncio==0.23.2
httpx==0.25.2

# Monitoring
prometheus-client==0.19.0

# Development
black==23.12.1
flake8==6.1.0
bandit==1.7.5
pre-commit==3.6.0
```

**`package.json` (前端依赖)`**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "webpack": "^5.90.0",
    "webpack-cli": "^5.1.0",
    "ts-loader": "^9.5.0",
    "@types/react": "^18.2.0",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.1.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.0"
  },
  "scripts": {
    "build": "webpack",
    "dev": "webpack serve",
    "test": "jest",
    "lint": "eslint src/",
    "format": "prettier --write src/"
  }
}
```

---

## 🔧 IDE与工具配置

### VS Code 推荐扩展

```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-python.python",           // Python扩展
    "ms-python.vscode-pylance",   // Python类型检查
    "ms-vscode.makefile-tools",   // Makefile支持
    "esbenp.prettier-vscode",     // 代码格式化
    "dbaeumer.vscode-eslint",     // JS/TS Lint
    "GitHub.copilot",             // GitHub Copilot
    "GitLens.gitlens",            // Git可视化
    "ms-vscode-remote.remote-containers" // Docker支持
  ]
}
```

### Python环境管理 (.env)

```bash
# backend/.env (本地开发)
DEBUG=True
DATABASE_URL=postgresql://user:pass@localhost:5432/safe_ops_db
REDIS_URL=redis://localhost:6379/0

OPENAI_API_KEY=sk-xxx        # 如果使用OpenAI
QWEN_API_KEY=sk-xxx

OPA_URL=http://localhost:8181
LOG_LEVEL=DEBUG
```

### 代码质量配置

**`pyproject.toml` (Python)**
```toml
[tool.black]
line-length = 100
target-version = ['py39']

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "--cov=app --cov-report=html"

[tool.isort]
profile = "black"

[tool.pylint]
max-line-length = 100
```

**`.eslintrc.json` (TypeScript)**
```json
{
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "parser": "@typescript-eslint/parser",
  "rules": {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

---

## 🗂️ Git配置

### .gitignore

```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
pip-wheel-metadata/
share/python-wheels/
*.egg-info/
.installed.cfg
*.egg

# Node
node_modules/
npm-debug.log
yarn-error.log
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# 密钥
.env
.env.local
*.key
*.pem
secrets/

# 覆盖率
htmlcov/
.coverage
.pytest_cache/

# 日志
logs/
*.log

# Docker
.dockerignore
```

### .pre-commit-config.yaml

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files

  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        language_version: python3

  - repo: https://github.com/PyCQA/flake8
    rev: 6.1.0
    hooks:
      - id: flake8

  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.56.0
    hooks:
      - id: eslint
```

---

## 🐳 Docker本地开发环境

### `docker-compose.dev.yml`

```yaml
version: '3.9'

services:
  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: safe_ops_db
      POSTGRES_USER: safe_ops
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  # OPA
  opa:
    image: openpolicyagent/opa:latest
    ports:
      - "8181:8181"
    command: run --server --addr=0.0.0.0:8181
    volumes:
      - ./backend/security/policies:/policies

  # 后端API
  backend:
    build:
      context: ./backend
      dockerfile: docker/Dockerfile
    environment:
      DATABASE_URL: postgresql://safe_ops:dev_password@postgres:5432/safe_ops_db
      REDIS_URL: redis://redis:6379/0
      OPA_URL: http://opa:8181
      DEBUG: "True"
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
      - opa
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --reload

volumes:
  postgres_data:
  redis_data:
```

### `backend/docker/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]
```

---

## 🧪 测试环境快速启动

### 本地单元测试

```bash
# 后端测试
cd backend
pytest tests/ -v --cov=app --cov-report=html

# 前端测试
cd ../frontend
npm test -- --coverage
```

### 集成测试

```bash
# 启动容器
docker-compose -f docker-compose.dev.yml up -d

# 等待服务就绪
sleep 10

# 运行集成测试
pytest tests/integration/ -v -s
```

---

## 📋 首次提交前检查清单

```bash
# 1. 配置Git用户信息
git config user.name "Your Name"
git config user.email "your.email@company.com"

# 2. 安装pre-commit钩子
pre-commit install

# 3. 初始commit
git add .
git commit -m "chore(init): bootstrap project structure"

# 4. 创建develop分支
git checkout -b develop
git push -u origin develop

# 5. 验证CI流程
# (push后GitHub Actions自动运行)
```

---

## 🔐 秘密管理

### 安全建议

1. **不存储密钥**
   ```bash
   # ❌ 错误
   API_KEY="sk-123456"  # 千万不要提交
   
   # ✅ 正确
   # .env 文件 (添加到 .gitignore)
   API_KEY=${QWEN_API_KEY}
   ```

2. **使用GitHub Secrets**
   ```yaml
   # .github/workflows/deploy.yml
   env:
     QWEN_API_KEY: ${{ secrets.QWEN_API_KEY }}
   ```

3. **本地加密存储**
   ```bash
   # 使用 direnv 或 python-dotenv
   pip install python-dotenv
   # backend/.env.example（不提交秘密值）
   DATABASE_URL=postgresql://user:pass@localhost:5432/db
   ```

---

## 💻 日常工作命令

```bash
# 开启开发模式
docker-compose -f docker-compose.dev.yml up -d
source venv/bin/activate

# 编写代码
code .

# 提交前
npm run lint:fix && black app/ && pytest tests/
git add .
git commit -m "feat(scope): description"

# 推送
git push origin feature/xxx

# 创建PR (命令行)
gh pr create --base develop --head feature/xxx --title "..." --body "..."

# 代码审查
gh pr review <pr-number> --comment --body "LGTM!"

# 合并PR
gh pr merge <pr-number> --squash
```

---

## 📞 常见问题排查

### Q1: 数据库连接失败
```bash
# 检查PostgreSQL运行状态
docker-compose ps

# 查看日志
docker-compose logs postgres

# 重启服务
docker-compose restart postgres
```

### Q2: Python依赖冲突
```bash
# 清除缓存重装
pip cache purge
pip install --no-cache-dir -r requirements.txt
```

### Q3: 浏览器插件无法加载
```bash
# 清理构建
rm -rf frontend/dist/
npm run build

# 在Chrome中: 设置 → 扩展程序 → 加载已解压的扩展程序 → 选择 dist/
```

---

**下一步**: 启动环境后，阅读 [WORKFLOW.md](WORKFLOW.md) 开始 Phase 1 开发

