# 视频播放平台项目

## 📋 项目概述

这是一个完整的视频流媒体平台，包含前端和后端两个主要部分：

- **前端**：Vue 3 + TypeScript + Vite + Pinia + Vue Router
- **后端**：NestJS + TypeScript + TypeORM + PostgreSQL
- **功能**：视频播放、字幕支持、用户认证、会员订阅、管理员后台

## 🛠 技术栈

### 前端技术栈
- **框架**：Vue 3
- **语言**：TypeScript
- **构建工具**：Vite
- **状态管理**：Pinia
- **路由**：Vue Router
- **HTTP 客户端**：Axios
- **视频播放器**：video.js
- **样式**：SCSS

### 后端技术栈
- **框架**：NestJS
- **语言**：TypeScript
- **数据库**：PostgreSQL
- **ORM**：TypeORM
- **认证**：JWT + Passport
- **文件存储**：阿里云 OSS
- **支付**：微信支付、支付宝

## 📁 项目结构

```
Web_player/
├── src/
│   ├── server/          # 后端服务（NestJS）
│   │   ├── src/         # 后端源代码
│   │   │   ├── common/  # 公共组件
│   │   │   ├── config/  # 配置文件
│   │   │   ├── database/ # 数据库配置
│   │   │   ├── modules/  # 业务模块
│   │   │   └── main.ts  # 应用入口
│   │   ├── test/        # 测试文件
│   │   └── package.json # 后端依赖
│   └── web-client/      # 前端应用（Vue 3）
│       ├── src/         # 前端源代码
│       │   ├── api/     # API 调用
│       │   ├── assets/  # 静态资源
│       │   ├── components/ # 组件
│       │   ├── router/  # 路由配置
│       │   ├── stores/  # Pinia 状态管理
│       │   ├── views/   # 页面组件
│       │   └── main.ts  # 应用入口
│       └── package.json # 前端依赖
├── AGENTS.md            # 项目开发指南
├── API文档.md           # API 文档
└── README.md            # 项目说明文档
```

## 🚀 快速开始

### 1. 环境准备

#### 前端环境
- Node.js >= 16.0
- npm >= 7.0

#### 后端环境
- Node.js >= 16.0
- PostgreSQL >= 12.0
- Redis (可选，用于缓存)

### 2. 安装依赖

#### 前端依赖
```bash
cd src/web-client
npm install
```

#### 后端依赖
```bash
cd src/server
npm install
```

### 3. 数据库配置

1. **创建数据库**
   ```bash
   # PostgreSQL 命令
   createdb video_platform
   ```

2. **配置环境变量**
   - 复制 `.env.example` 为 `.env`
   - 修改数据库连接信息

### 4. 启动开发服务

#### 后端开发服务
```bash
cd src/server
npm run start:dev
# 服务运行在 http://localhost:3001
```

#### 前端开发服务
```bash
cd src/web-client
npm run dev
# 服务运行在 http://localhost:5173
```

## 🌐 API 接口

### 健康检查
- `GET /api/health` - 服务状态检查
- `GET /api/health/db` - 数据库连接检查

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `POST /api/auth/refresh` - 刷新 Token

### 用户接口
- `GET /api/user/profile` - 获取用户资料
- `PUT /api/user/profile` - 更新用户资料
- `GET /api/user/subscription` - 获取会员状态

### 视频接口
- `GET /api/videos` - 获取视频列表
- `GET /api/videos/:id` - 获取视频详情
- `GET /api/videos/:id/play` - 获取视频播放地址
- `POST /api/videos` - 创建视频
- `PUT /api/videos/:id` - 更新视频
- `DELETE /api/videos/:id` - 删除视频

详细 API 文档请参考 [API文档.md](./API文档.md)

## 📦 构建与部署

### 前端构建
```bash
cd src/web-client
npm run build
# 构建产物在 dist/ 目录
```

### 后端构建
```bash
cd src/server
npm run build
# 构建产物在 dist/ 目录
```

### 生产环境部署

#### 后端部署
```bash
# 安装生产依赖
npm install --production

# 启动生产服务
npm run start:prod:env
```

#### 前端部署
- 将 `dist` 目录部署到 Nginx、Apache 等 Web 服务器
- 配置反向代理到后端服务

## 🔧 环境配置

### 前端环境变量
- 复制 `.env.example` 为 `.env`
- 修改 API 基础路径等配置

### 后端环境变量
- 复制 `.env.example` 为 `.env`
- 配置数据库连接、JWT 密钥、OSS 等信息

## 🧪 测试

### 单元测试
```bash
# 前端测试
cd src/web-client
npm run test

# 后端测试
cd src/server
npm run test
```

### 端到端测试
```bash
cd src/server
npm run test:e2e
```

### 测试覆盖率
```bash
cd src/server
npm run test:cov
```

## 🎯 功能特性

### 用户系统
- 注册、登录、登出
- JWT 认证
- 用户资料管理
- 会员订阅

### 视频系统
- 视频列表、详情
- 视频播放
- 字幕支持
- 视频管理（管理员）

### 支付系统
- 微信支付
- 支付宝
- 会员订阅管理

### 后台管理
- 用户管理
- 视频管理
- 订单管理
- 数据统计

## 📄 开发规范

### 代码风格
- 使用 TypeScript 严格模式
- 前端使用 Composition API
- 后端使用 NestJS 标准结构
- 遵循 ESLint 和 Prettier 规范

### 命名规范
- **前端组件**：PascalCase
- **后端文件**：kebab-case
- **后端类**：PascalCase
- **方法**：camelCase

详细开发规范请参考 [AGENTS.md](./AGENTS.md)

## 🔒 安全措施

- JWT 令牌认证
- 密码哈希存储
- 输入验证
- CORS 配置
- 防 SQL 注入

## 📞 技术支持

### 常见问题

1. **数据库连接失败**
   - 检查 PostgreSQL 服务是否运行
   - 验证数据库连接参数
   - 确保数据库已创建

2. **API 接口返回 401**
   - 检查 JWT Token 是否有效
   - 验证请求头中的 Authorization

3. **视频无法播放**
   - 检查视频文件路径
   - 验证用户权限
   - 检查 OSS 配置

### 联系方式

- 项目维护者：[Your Name]
- 邮箱：[your.email@example.com]
- 文档：[API文档.md](./API文档.md)

## 📄 许可证

本项目使用 MIT 许可证

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

---

**注意**：本项目仅供学习和开发使用，生产环境部署请确保符合相关法律法规。