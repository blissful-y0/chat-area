# ChatArea UI 리스트럭처링: Character.AI + TRPG 스타일

## 개요

ChatGPT 스타일(미니멀 생산성 UI) → **Character.AI 스타일**(엔터테인먼트/RP 중심) 전환.
TRPG(LLM이 마스터 역할) 지원, 채팅 안에서 월드/캐릭터/로어북 설정을 모두 볼 수 있는 워크스페이스 구조.

### 레이아웃 변경

```
Before: [Sidebar 256px] [Header + Messages + Input]
After:  [CompactSidebar 56px] [ChatHeader + Messages + Input] [ContextPanel 360px (접기 가능)]
```

- 채팅 페이지만 컴팩트 사이드바 + 우측 컨텍스트 패널
- 관리 페이지(/characters, /worlds, /lorebooks, /settings)는 기존 풀 사이드바 유지

---

## 완료된 작업

### Phase 1: Store + API 기반

| 파일 | 변경 |
|------|------|
| `src/stores/ui-store.ts` | `contextPanelOpen`, `contextPanelTab` 상태 + `toggleContextPanel`, `setContextPanelTab` 액션 추가 |
| `src/stores/chat-context-store.ts` | **신규**. `CharacterData`, `WorldPresetData`, `LorebookWithEntries` 타입 + 스토어 |
| `src/stores/chat-store.ts` | `Message` 인터페이스에 `characterId: string | null` 추가 |
| `src/lib/assets/resolve-url.ts` | **신규**. `avatarAssetId` → `/api/assets/${id}` URL 변환 |
| `src/app/api/chat/[chatId]/context/route.ts` | **신규**. 한 번의 GET으로 character + worldPreset + lorebooks + groupMembers 반환 |
| `src/hooks/use-chat-context.ts` | **신규**. 채팅 마운트 시 context API 호출 → store 저장 |

### Phase 2: 레이아웃 구조 변경

| 파일 | 변경 |
|------|------|
| `src/app/(app)/layout.tsx` | pass-through로 변경 (`<>{children}</>`) |
| `src/app/(app)/(main)/layout.tsx` | **신규**. `<AppShell sidebarVariant="full">` |
| `src/app/(app)/(chat)/layout.tsx` | **신규**. `<AppShell sidebarVariant="compact">` |
| `src/components/layout/app-shell.tsx` | `sidebarVariant` prop 추가 (full/compact) |
| `src/components/layout/compact-sidebar.tsx` | **신규**. 56px 아이콘 사이드바, 아바타 썸네일, 활성 채팅 악센트 바 |

**라우트 이동:**
```
(app)/characters/    → (app)/(main)/characters/
(app)/worlds/        → (app)/(main)/worlds/
(app)/lorebooks/     → (app)/(main)/lorebooks/
(app)/settings/      → (app)/(main)/settings/
(app)/page.tsx       → (app)/(main)/page.tsx
(app)/chat/[chatId]/ → (app)/(chat)/chat/[chatId]/
```
URL 경로는 동일 유지 (route group은 URL에 영향 없음).

### Phase 3: ContextPanel 탭 4개

| 파일 | 역할 |
|------|------|
| `src/components/chat/context-panel/context-panel.tsx` | 360px 패널 셸, 탭 바, 접기/펼치기, 모바일 오버레이 |
| `src/components/chat/context-panel/character-tab.tsx` | 아바타 + 이름 + 태그, 접기 가능 섹션 (Description, Personality 등) |
| `src/components/chat/context-panel/world-tab.tsx` | 월드 프리셋 정보, System Prompt, Formatting Order, Generation Defaults |
| `src/components/chat/context-panel/lorebook-tab.tsx` | Active Entries (녹색 강조) + All Entries (검색/필터) |
| `src/components/chat/context-panel/settings-tab.tsx` | Provider/Model 드롭다운, Temperature 슬라이더, Max Tokens |
| `src/components/chat/context-panel/index.ts` | barrel export |

### Phase 4: 채팅 페이지 리디자인

| 파일 | 변경 |
|------|------|
| `src/components/shared/character-avatar.tsx` | **신규**. xs/sm/md/lg/xl 사이즈, 이미지 or 이름 이니셜 + 해시 색상 |
| `src/components/chat/chat-header.tsx` | **신규**. 사이드바 토글 + 아바타 + 캐릭터명 + 시나리오 + 컨텍스트 패널 토글 |
| `src/components/chat/game-state-banner.tsx` | **신규**. 월드명, 시나리오, 메시지 수 표시, 접기 가능 |
| `src/components/chat/message-bubble.tsx` | Character.AI 스타일: 아바타 + 이름 + 둥근 버블 (tl-sm/tr-sm) |
| `src/components/chat/message-list.tsx` | character 데이터 전달, 빈 상태에 큰 아바타 + "Start your adventure" |
| `src/components/chat/chat-input.tsx` | ModelSelector 제거 → 모델 배지 (클릭 시 Settings 탭), 더 큰 입력 영역 |
| `src/app/(app)/(chat)/chat/[chatId]/page.tsx` | 3컬럼 레이아웃 재구성 |

### Phase 5: API 보강

| 파일 | 변경 |
|------|------|
| `src/app/api/chat/[chatId]/messages/route.ts` | 로어북 스캐닝 후 `lorebook_matches` SSE 이벤트 전송 |
| `src/hooks/use-chat.ts` | `lorebook_matches` 이벤트 수신 → `chatContextStore.setMatchedEntryIds()` |

### Phase 7: 키보드 단축키

| 파일 | 변경 |
|------|------|
| `src/hooks/use-keyboard-shortcuts.ts` | **신규** |

| 단축키 | 동작 |
|--------|------|
| `Cmd/Ctrl + B` | 사이드바 토글 |
| `Cmd/Ctrl + .` | 컨텍스트 패널 토글 |
| `Cmd/Ctrl + 1~4` | 패널 탭 전환 (Character/World/Lorebook/Settings) |
| `Escape` | 패널 닫기 |

### 반응형

- 1024px 미만: 컨텍스트 패널이 fixed 오버레이 드로어로 전환
- 패널 밖 클릭 시 자동 닫기

---

## 완료된 후속 작업

### DB 마이그레이션 (Phase 6) ✅

messages 테이블에 `character_id` 컬럼 추가 완료.
- `src/lib/db/schema.ts` — `characterId` 컬럼 추가 (FK → characters, ON DELETE SET NULL)
- `drizzle/migrations/0002_green_korg.sql` — 마이그레이션 생성 + 실행 완료

### 폴리시 항목 ✅

- [x] CompactSidebar에서 캐릭터 아바타 썸네일 표시 (CharacterAvatar xs 사이즈)
- [x] 메시지 버블 `*액션 텍스트*` 패턴 → 보라색 배경 + not-italic 스타일 (TRPG 내레이션)
- [x] 그룹 채팅 시 ChatHeader에 스택된 아바타 표시 (StackedAvatars 컴포넌트)
- [x] 컨텍스트 패널 애니메이션 (CSS transition-all, 항상 렌더링 + transform)
- [x] 다크/라이트 테마 전환 지원 (ThemeProvider + CSS 커스텀 프로퍼티 + 사이드바 토글)

### 추가 변경 파일

| 파일 | 변경 |
|------|------|
| `src/app/api/chat/route.ts` | 채팅 목록에 characterName, characterAvatarUrl 포함 (LEFT JOIN) |
| `src/stores/chat-store.ts` | ChatSummary에 characterName, characterAvatarUrl 추가 |
| `src/stores/chat-context-store.ts` | GroupMemberData 인터페이스 + groupMembers 상태 추가 |
| `src/hooks/use-chat-context.ts` | groupMembers 로드 + 반환 |
| `src/app/api/chat/[chatId]/context/route.ts` | 그룹 멤버에 characterName, characterAvatarUrl 포함 |
| `src/components/chat/chat-header.tsx` | StackedAvatars 컴포넌트, 그룹 채팅 지원 |
| `src/components/chat/message-bubble.tsx` | 커스텀 `em` 렌더러 (TRPG 내레이션 스타일) |
| `src/components/theme-provider.tsx` | **신규**. localStorage 기반 테마 동기화 |
| `src/components/providers.tsx` | ThemeProvider 래핑 |
| `src/app/globals.css` | CSS 커스텀 프로퍼티 (light/dark), @custom-variant dark |
| `src/app/layout.tsx` | body 스타일을 CSS 변수 기반으로 변경 |
| `src/components/layout/app-shell.tsx` | 배경색 CSS 변수 기반 |
| `src/components/layout/compact-sidebar.tsx` | CharacterAvatar 썸네일, 테마 토글 버튼 |
| `src/components/layout/sidebar.tsx` | CharacterAvatar 썸네일, 테마 토글 버튼 |

---

## 남은 개발 로드맵

### Phase 4: Lorebook 시스템 (완료)
- 엔트리 CRUD, 키워드 스캐닝, 재귀 스캐닝, 토큰 예산

### Phase 5: Memory 시스템
- HypaV2/V3 메모리 (벡터 기반 장기 기억)
- SupaMemory (요약 기반 메모리)
- embeddings 테이블 활용

### Phase 6: Message Management + Swipes
- 메시지 편집/삭제/재생성
- Swipe (alternatives) UI: 좌우 스와이프로 대안 응답 탐색
- 메시지 분기 트리

### Phase 7: Group Chat
- 다중 캐릭터 대화
- 턴 순서 관리 (probability 기반)
- groupMembers 테이블 활용
- ChatHeader에 참여 캐릭터 표시

### Phase 8: Regex Scripting
- 캐릭터별 정규식 스크립트
- 입력/출력 텍스트 변환
- regexScripts 테이블 활용

### Phase 9: Emotion Images
- 캐릭터 감정 이미지 매핑
- LLM 응답에서 감정 태그 추출
- 메시지 버블에 감정 이미지 표시

### Phase 10: Plugin System
- 사용자 정의 플러그인 로드/실행
- 플러그인 매니페스트 + 설정
- plugins 테이블 활용

### Phase 11: Polish + Advanced UI
- 애니메이션 (Framer Motion)
- 테마 시스템 (다크/라이트/커스텀)
- 접근성 개선 (ARIA, 키보드 내비게이션)
- 성능 최적화 (가상 스크롤, 레이지 로딩)

### Phase 12: Docker Deployment
- Dockerfile + docker-compose
- 환경변수 설정
- SQLite 볼륨 마운트
- Nginx 리버스 프록시

### Shared Character Hub (사용자 요청)
- characters 테이블에 `isPublic` 플래그 추가
- `/explore` 또는 `/community` 페이지
- 원클릭 임포트
- 크리에이터 크레딧 보존

---

## 기술 스택

- **Framework**: Next.js 16.1.6 (App Router) + TypeScript strict
- **Auth**: NextAuth.js v5 (Credentials, JWT)
- **DB**: SQLite (better-sqlite3) + Drizzle ORM
- **State**: Zustand 5
- **UI**: Tailwind CSS 4 + lucide-react
- **LLM**: OpenAI, Anthropic, Google, OpenRouter, Ollama, Custom
- **Streaming**: Web Streams + SSE

## 브랜치

```
feat/character-ai-layout (현재 작업 브랜치)
  ← develop
    ← master
```

## 커맨드

```bash
pnpm dev              # 개발 서버
pnpm build            # 프로덕션 빌드
pnpm db:generate      # Drizzle 마이그레이션 생성
pnpm db:migrate       # 마이그레이션 실행
```
