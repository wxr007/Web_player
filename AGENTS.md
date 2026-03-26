# AGENTS.md - Video Platform Development Guide

## Project Overview

This is a full-stack video streaming platform with:
- **Frontend**: Vue 3 + TypeScript + Vite + Pinia + Vue Router
- **Backend**: NestJS + TypeScript + TypeORM + PostgreSQL
- **Features**: Video playback, subtitles, user auth, VIP subscription, admin dashboard, watch history

## Current Features

### User Features
- **Authentication**: Login/Register with username or email, JWT token-based auth
- **Video Playback**: Stream local videos with progress tracking, subtitle support (SRT/VTT)
- **Watch History**: Records viewing progress, resume playback from last position
- **Favorites**: Add/remove videos from favorites
- **User Profile**: Update profile info, avatar upload with image compression
- **VIP Subscription**: VIP-only video access control

### Admin Features
- **User Management**: CRUD operations on users, role management
- **Video Management**: Upload, edit, delete videos
- **Directory Management**: Organize videos in directories
- **Repository Management**: Manage video repositories

### Video List Features
- **Pagination**: Google-style pagination with page numbers
- **Sorting**: Sort by upload time, view count, title (asc/desc)
- **Filtering**: Filter by repository
- **Thumbnail Size**: Toggle between 4/5/6 items per row

---

## Build Commands

### Frontend (web-client)
```bash
cd src/web-client

# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Backend (server)
```bash
cd src/server

# Development with hot reload
npm run start:dev

# Production build
npm run build

# Start production
npm run start:prod

# Lint and fix
npm run lint
```

### Testing
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run a single test file
npm run test -- path/to/test.spec.ts

# Run e2e tests
npm run test:e2e
```

---

## Code Style Guidelines

### General Principles
- Use **TypeScript** for all new code (strict mode enabled)
- Prefer **composition API** in Vue 3 (script setup syntax)
- Use **async/await** over Promise chains
- Avoid `any` type - use proper typing or `unknown` with type guards
- Handle errors with try/catch and proper error messages

### Backend (NestJS)

#### Naming Conventions
- **Files**: kebab-case (e.g., `auth.service.ts`, `video-list.dto.ts`)
- **Classes**: PascalCase (e.g., `AuthService`, `VideoController`)
- **Methods**: camelCase (e.g., `findById`, `createUser`)
- **DTOs**: Use `.d.ts` suffix or `dto` folder with suffix (e.g., `login.dto.ts`)
- **Entities**: Use `.entity.ts` suffix (e.g., `user.entity.ts`)

#### Import Order
1. External NestJS/Node modules
2. External third-party packages
3. Local modules (relative imports)

```typescript
// 1. External NestJS
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

// 2. External third-party
import * as bcrypt from 'bcrypt'

// 3. Local modules
import { UserService } from '../user/user.service'
import { LoginDto } from './dto/auth.dto'
```

#### Error Handling
- Use built-in NestJS exceptions (`NotFoundException`, `BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `ConflictException`)
- Always provide Chinese error messages for user-facing errors
- Use custom exception filters for API error responses

#### Service Structure
```typescript
@Injectable()
export class ExampleService {
  constructor(
    private readonly dependency1: Dependency1Service,
    private readonly dependency2: Dependency2Service,
  ) {}

  async findAll(params: QueryParamsDto): Promise<{ list: Entity[]; total: number }> {
    // Implementation
  }

  async create(data: CreateDto): Promise<Entity> {
    // Implementation
  }
}
```

#### Database
- Use **TypeORM** with PostgreSQL
- Use `Repository` pattern for database operations
- Define entities in `src/database/entities/`
- Use UUID for primary keys
- Enable `synchronize: true` for development only

### Frontend (Vue 3)

#### File Structure
```
src/
├── api/           # API request functions
├── assets/        # Static assets (styles, images)
├── components/    # Reusable Vue components
│   ├── common/    # Base components
│   ├── video/     # Video-related components
│   └── layout/    # Layout components
├── composables/   # Vue composables (hooks)
├── router/        # Vue Router configuration
├── stores/        # Pinia stores
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── views/         # Page components
```

#### Naming Conventions
- **Components**: PascalCase (e.g., `VideoPlayer.vue`, `AppHeader.vue`)
- **Composables**: camelCase with `use` prefix (e.g., `useAuth.ts`, `useVideo.ts`)
- **Stores**: camelCase (e.g., `auth.ts`, `video.ts`)
- **Types**: PascalCase (e.g., `User.ts`, `VideoResponse.ts`)

#### Script Setup Syntax
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Video } from '@/types/video'
import { getVideoList } from '@/api/video'

const videos = ref<Video[]>([])
const loading = ref(false)

const filteredVideos = computed(() => 
  videos.value.filter(v => v.status === 'published')
)

onMounted(async () => {
  const res = await getVideoList({ page: 1, pageSize: 12 })
  videos.value = res.data
})
</script>

<template>
  <!-- Template content -->
</template>

<style scoped lang="scss">
/* Component styles */
</style>
```

#### API Layer
- Use `axios` with interceptors for request/response handling
- Create separate API files per domain (e.g., `auth.ts`, `video.ts`)
- Use generic types for API responses

```typescript
// api/video.ts
import instance from './axios'
import type { Video, VideoListParams } from '@/types/video'

export const getVideoList = (params: VideoListParams) => {
  return instance.get<VideoListResponse>('/videos', { params })
}
```

#### Store (Pinia)
- Use composition API syntax with `defineStore`
- Export custom hooks (useXxxStore) for store access
- Keep state minimal, use getters for computed values

```typescript
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>('')
  const userInfo = ref<User | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  async function login(credentials: LoginParams) {
    // Implementation
  }

  return { token, userInfo, isLoggedIn, login }
})
```

---

## Logging (Important!)

### Backend Logging
The backend uses a custom `FileLogger` class that writes logs to both console and files:

**Log Files Location**: `src/server/logs/`
- `app-YYYY-MM-DD_HH-MM-SS.log` - All log levels
- `error-YYYY-MM-DD_HH-MM-SS.log` - Error logs only

**Usage in Code**:
```typescript
import { Logger } from '@nestjs/common'

@Controller('videos')
export class VideoController {
  private readonly logger = new Logger(VideoController.name)

  async someMethod() {
    this.logger.log('Info message')
    this.logger.error('Error message', error.stack)
    this.logger.warn('Warning message')
    this.logger.debug('Debug message')
  }
}
```

**Important**: 
- Always use `Logger` from `@nestjs/common` instead of `console.log()`
- `console.log()` outputs will NOT be written to log files
- Each controller/service should have its own logger instance

---

## Configuration

### Environment Variables
- Backend: `src/server/.env` (not committed to git)
- Frontend: `src/web-client/.env` or Vite environment files

### Database
- PostgreSQL required (default: localhost:5432)
- Database name: `video_platform`
- Configure in `src/server/.env`

---

## Common Tasks

### Creating a New Module (Backend)
1. Create folder: `src/modules/{module-name}/`
2. Create entity: `entities/{name}.entity.ts`
3. Create service: `{name}.service.ts`
4. Create controller: `{name}.controller.ts`
5. Create DTOs: `dto/{name}.dto.ts`
6. Create module: `{name}.module.ts`
7. Register in `app.module.ts`

### Creating a New Page (Frontend)
1. Create component: `views/{PageName}/index.vue`
2. Add route in `router/index.ts`
3. Add API functions if needed in `api/{module}.ts`
4. Add store if needed in `stores/{module}.ts`

---

## Notes for AI Agents

- When fixing TypeScript errors, prefer `as unknown as Type` over `as any`
- Use strict null checks - check for null/undefined before accessing properties
- Always run `npm run build` after making changes to verify compilation
- Use meaningful variable and function names
- Add comments only for complex business logic (not required by default)
- Test changes in development mode before committing
