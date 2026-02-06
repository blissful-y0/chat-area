# ChatArea

AI 캐릭터 채팅 플랫폼. RisuAI 대체 구현으로, ChatGPT 스타일의 세련된 UI 제공.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript strict
- **Auth**: NextAuth.js v5 (Credentials Provider, JWT sessions)
- **DB**: SQLite (better-sqlite3) + Drizzle ORM
- **State**: Zustand 5
- **UI**: Tailwind CSS 4 + shadcn/ui + Framer Motion
- **Streaming**: Native Web Streams + SSE

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login/Register (public)
│   ├── (app)/              # Protected routes (AppShell layout)
│   └── api/                # REST API routes
├── lib/                    # Core business logic
│   ├── auth/               # NextAuth config + session helpers
│   ├── db/                 # Drizzle schema + client
│   ├── llm/                # LLM provider abstraction
│   ├── crypto.ts           # AES-256 encryption for API keys
│   └── utils.ts            # cn() helper
├── components/             # React components
│   ├── ui/                 # shadcn/ui primitives
│   ├── layout/             # AppShell, Sidebar, Header
│   └── chat/               # Messages, Input, Streaming
├── stores/                 # Zustand stores (UI state only)
└── hooks/                  # Custom hooks
```

## Key Conventions

### Immutability
NEVER mutate objects. Always create new objects with spread operator.

### Data Isolation
All user data tables have `userId` FK. API routes MUST filter by session userId.

### API Response Format
```typescript
{ success: boolean, data?: T, error?: string }
```

### File Size
200-400 lines typical, 800 max.

### Error Handling
Always wrap async operations in try/catch. Return user-friendly error messages.

### Security (PUBLIC REPO)
- NEVER commit secrets, API keys, or .env files
- API keys encrypted with AES-256 (src/lib/crypto.ts)
- All routes protected by NextAuth middleware (except /login, /register)
- Validate all user input with Zod

## Commands

```bash
pnpm dev              # Start dev server (turbopack)
pnpm build            # Production build
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio
```

## Git Branch Strategy

- `master` - stable releases only
- `develop` - integration branch
- `feat/<name>` - feature branches (branch from develop, PR to develop)
- `fix/<name>` - bugfix branches
- `release/<version>` - release prep branches

## Agent Team Guidelines

팀원들은 독립적인 파일/모듈에서 작업해야 함. 동일 파일 편집 금지.

### Phase 병렬화
- Phase 1 (Foundation) → 먼저 완료 필수
- Phase 2 (Characters) + Phase 3 (Providers) → 병렬 가능
- Phase 4 (Lorebook) + Phase 8 (Regex) → 병렬 가능
- Phase 5 (Memory) + Phase 9 (Emotion) → 병렬 가능
