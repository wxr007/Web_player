# 服务端API文档

## 基础信息

- **API基础路径**: `http://localhost:3001/api`
- **认证方式**: JWT Token（Bearer Token）
- **内容类型**: `application/json`

## 健康检查API

### 1. 完整健康检查

**端点**: `GET /health`

**功能**: 检查服务和数据库状态

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2026-03-11T00:00:00.000Z",
  "server": {
    "uptime": 123.456,
    "memory": {
      "rss": 52428800,
      "heapTotal": 20971520,
      "heapUsed": 15728640
    },
    "nodeVersion": "v18.17.0"
  },
  "database": {
    "connected": true,
    "database": "video_platform",
    "host": "localhost",
    "port": 5432
  }
}
```

### 2. 数据库状态检查

**端点**: `GET /health/db`

**功能**: 专门检查数据库连接状态

**响应示例**:
```json
{
  "status": "connected",
  "database": "video_platform",
  "host": "localhost",
  "port": 5432,
  "type": "postgres"
}
```

## 认证API

### 1. 用户登录

**端点**: `POST /auth/login`

**功能**: 用户登录并获取JWT token

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应示例**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123456",
    "email": "user@example.com",
    "username": "testuser",
    "role": "user"
  }
}
```

### 2. 用户注册

**端点**: `POST /auth/register`

**功能**: 注册新用户

**请求体**:
```json
{
  "username": "testuser",
  "email": "user@example.com",
  "password": "password123"
}
```

**响应示例**:
```json
{
  "id": "123456",
  "username": "testuser",
  "email": "user@example.com",
  "role": "user",
  "createdAt": "2026-03-11T00:00:00.000Z"
}
```

### 3. 用户登出

**端点**: `POST /auth/logout`

**功能**: 用户登出

**响应示例**:
```json
{
  "message": "登出成功"
}
```

### 4. 刷新Token

**端点**: `POST /auth/refresh`

**功能**: 刷新访问令牌

**认证**: 需要JWT token

**响应示例**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 用户API

### 1. 获取用户资料

**端点**: `GET /user/profile`

**功能**: 获取当前用户资料

**认证**: 需要JWT token

**响应示例**:
```json
{
  "id": "123456",
  "username": "testuser",
  "email": "user@example.com",
  "role": "user",
  "vipExpireAt": null,
  "createdAt": "2026-03-11T00:00:00.000Z"
}
```

### 2. 更新用户资料

**端点**: `PUT /user/profile`

**功能**: 更新当前用户资料

**认证**: 需要JWT token

**请求体**:
```json
{
  "username": "newname",
  "email": "newemail@example.com"
}
```

**响应示例**:
```json
{
  "id": "123456",
  "username": "newname",
  "email": "newemail@example.com",
  "role": "user"
}
```

### 3. 获取会员状态

**端点**: `GET /user/subscription`

**功能**: 获取当前用户的会员状态

**认证**: 需要JWT token

**响应示例**:
```json
{
  "isVip": false,
  "vipExpireAt": null
}
```

## 视频API

### 1. 获取视频列表

**端点**: `GET /videos`

**功能**: 获取视频列表，支持分页和筛选

**查询参数**:
- `page`: 页码（默认1）
- `pageSize`: 每页数量（默认10）
- `keyword`: 搜索关键词
- `tag`: 标签筛选
- `status`: 状态筛选

**响应示例**:
```json
{
  "list": [
    {
      "id": "123456",
      "title": "视频标题",
      "description": "视频描述",
      "coverUrl": "https://example.com/cover.jpg",
      "tags": ["标签1", "标签2"],
      "status": "published",
      "createdAt": "2026-03-11T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 10
}
```

### 2. 获取视频详情

**端点**: `GET /videos/:id`

**功能**: 获取单个视频详情

**路径参数**:
- `id`: 视频ID

**响应示例**:
```json
{
  "id": "123456",
  "title": "视频标题",
  "description": "视频描述",
  "coverUrl": "https://example.com/cover.jpg",
  "videoUrl": "https://example.com/video.mp4",
  "tags": ["标签1", "标签2"],
  "status": "published",
  "createdAt": "2026-03-11T00:00:00.000Z"
}
```

### 3. 获取视频播放地址

**端点**: `GET /videos/:id/play`

**功能**: 获取视频播放地址（支持会员权限验证）

**路径参数**:
- `id`: 视频ID

**认证**: 可选（未登录用户只能访问免费视频）

**响应示例**:
```json
{
  "playUrl": "https://example.com/video.mp4",
  "isVipOnly": false
}
```

### 4. 创建视频

**端点**: `POST /videos`

**功能**: 创建新视频

**认证**: 需要JWT token

**请求体**:
```json
{
  "title": "视频标题",
  "description": "视频描述",
  "coverUrl": "https://example.com/cover.jpg",
  "videoUrl": "https://example.com/video.mp4",
  "tags": ["标签1", "标签2"],
  "status": "published"
}
```

**响应示例**:
```json
{
  "id": "123456",
  "title": "视频标题",
  "description": "视频描述",
  "coverUrl": "https://example.com/cover.jpg",
  "videoUrl": "https://example.com/video.mp4",
  "tags": ["标签1", "标签2"],
  "status": "published",
  "createdAt": "2026-03-11T00:00:00.000Z"
}
```

### 5. 更新视频

**端点**: `PUT /videos/:id`

**功能**: 更新视频信息

**认证**: 需要JWT token

**路径参数**:
- `id`: 视频ID

**请求体**:
```json
{
  "title": "新标题",
  "description": "新描述",
  "status": "published"
}
```

**响应示例**:
```json
{
  "id": "123456",
  "title": "新标题",
  "description": "新描述",
  "coverUrl": "https://example.com/cover.jpg",
  "videoUrl": "https://example.com/video.mp4",
  "tags": ["标签1", "标签2"],
  "status": "published",
  "updatedAt": "2026-03-11T00:00:00.000Z"
}
```

### 6. 删除视频

**端点**: `DELETE /videos/:id`

**功能**: 删除视频

**认证**: 需要JWT token

**路径参数**:
- `id`: 视频ID

**响应示例**:
```json
{
  "message": "视频删除成功"
}
```

## 认证说明

1. **需要认证的API**:
   - 所有 `/user/*` 端点
   - `/auth/refresh`
   - `/videos` (POST)
   - `/videos/:id` (PUT, DELETE)

2. **认证方式**:
   - 在请求头中添加 `Authorization: Bearer <token>`

3. **Token有效期**:
   - 默认7天（可在 .env 文件中配置）

## 错误处理

API返回的错误格式:

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "未授权"
}
```

常见错误码:
- `400`: 请求参数错误
- `401`: 未授权（Token无效或过期）
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

## 开发环境测试

### 启动服务
```bash
cd src/server
npm run start:dev
```

### 测试API
- 使用 Postman 或 curl 测试API
- 基础URL: `http://localhost:3001/api`

### 健康检查
```bash
curl http://localhost:3001/api/health
```

## 生产环境部署

1. **构建项目**:
   ```bash
   npm run build
   ```

2. **启动服务**:
   ```bash
   npm run start:prod:env
   ```

3. **环境变量配置**:
   - 使用 `.env.production` 文件
   - 确保数据库连接信息正确