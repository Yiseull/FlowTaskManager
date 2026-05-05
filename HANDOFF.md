# Flow Task Manager Handoff

Updated: 2026-05-05

## Current State
- Backend and frontend are both functional.
- Backend and frontend are now separated as sibling modules:
  - `backend/`: Spring Boot backend Gradle subproject
  - `frontend/`: React/Vite frontend
  - root `./gradlew bootRun` and `./gradlew test` remain convenience aliases for backend tasks
- Sidebar destinations are now real screens:
  - `오늘`: active/planned/blocked/completed/interrupt queue flow
  - `예정`: today planned/blocked/carry-over pending plus future scheduled tasks
  - `언젠가`: unscheduled task storage with create/move/today/cancel actions
  - `완료됨`: completed task list
- Task cancel actions in today/upcoming/someday now go through a shared confirmation modal.
- Interrupt queue is implemented and wired to the UI.
- Stale task postpone is real and uses local-date formatting:
  - `PATCH /tasks/{id}/schedule`
  - Stale modal `미루기` reschedules to tomorrow
  - Stale modal cancel wording now matches actual cancel semantics
- Timer `NaN:NaN` issue was fixed by normalizing session response keys on the frontend.
- Frontend task movement regression tests are in place with Vitest + Testing Library.
- Additional casing-sensitive frontend tests cover:
  - Settings `dailyTaskLimit`
  - Switch modal `switchReason`/`switchNote`
  - Day start `carryOver`/`dismiss`
  - Day end `carryOver`/`dismiss`
  - Interrupt convert `startImmediately`
  - Upcoming move-to-today `DAILY_TASK_LIMIT`
  - Today create `DAILY_TASK_LIMIT`
  - Stale modal start/postpone/cancel
- Browser QA against the current backend passed for:
  - today task create/start/complete
  - completed screen completed time display
  - someday create/move-to-today/cancel modal
  - upcoming planned task move-to-someday
  - settings daily task limit display/save
- Frontend API casing was aligned to the current backend camelCase contract while preserving snake_case reads where useful for old mock data.
- Mobile/narrow interrupt queue behavior was improved:
  - interrupt actions are visible without hover at narrow widths
  - action buttons wrap to a separate row so titles and actions do not crowd each other

## Recent Commits
- `8668d91 fix: interrupt 중복 생성과 전환 횟수 갱신`
- `953114e fix: 모바일 작업 행 액션 배치 개선`
- `2f1b9d6 fix: 모바일 상단 내비게이션 정리`
- `5320bb9 fix: 모바일 interrupt 액션 배치 개선`
- `a3634ac test: 전환 흐름과 예정 한도 오류 검증 추가`
- `d796836 test: interrupt와 방치 작업 액션 검증 추가`
- `88f89bc test: 프론트 주요 흐름 회귀 테스트 보강`
- `a48c4a2 test: 프론트 작업 이동 플로우 검증 추가`
- `4445e6a feat: 작업 취소 확인 모달 추가`
- `f5753a9 fix: 방치 작업 취소 문구 정리`
- `138ab5a feat: 보관 작업 취소 액션 추가`
- `a74ba6e feat: 이후 예정 작업 조회 추가`
- `2338d23 feat: 언젠가 작업 오늘 이동 추가`

## API/Domain Notes
- `GET /tasks/someday`
  - Returns unscheduled `PLANNED`/`BLOCKED` tasks.
- `POST /tasks/someday`
  - Creates an unscheduled `PLANNED` task.
  - Does not apply `daily_task_limit`.
- `PATCH /tasks/{id}/someday`
  - Allows only `PLANNED`.
  - Sets `scheduledDate = null`.
- `PATCH /tasks/{id}/schedule`
  - Allows only `PLANNED`.
  - Clears `carryOverPending`.
  - Now checks `daily_task_limit` when moving to a different non-null date.
- `GET /tasks/upcoming`
  - Returns future scheduled `PLANNED`/`BLOCKED` tasks ordered by date.
- Backend `GET /sessions/current` currently returns camelCase fields (`startedAt`, `elapsedSeconds`).
  - Frontend tolerates both camelCase and snake_case for session data.
- Current backend request/response records use camelCase JSON by default:
  - Settings: `dailyTaskLimit`
  - Switch: `switchReason`, `switchNote`
  - Interrupt convert: `startImmediately`
  - Day start: `carryOver`, `dismiss`
  - Task date fields: `scheduledDate`, `completedAt`, `carryOverCount`
- Frontend now writes camelCase for these request payloads.

## Frontend Notes
- `SomedayScreen`
  - Can create stored tasks.
  - Can move `PLANNED` tasks to today via `PATCH /tasks/{id}/schedule`.
  - Can cancel `PLANNED`/`BLOCKED` stored tasks.
- `UpcomingScreen`
  - Shows today planned/blocked/carry-over pending.
  - Shows future scheduled tasks from `GET /tasks/upcoming`.
  - Future `PLANNED` tasks can move to today or someday.
  - Future `PLANNED`/`BLOCKED` tasks can be cancelled.
- `ConfirmCancelModal`
  - Shared confirmation for cancel actions in `TodayScreen`, `SomedayScreen`, and `UpcomingScreen`.
- `CompletedScreen`
  - Shows today completed tasks from `GET /tasks/today`.
- `InterruptRow`
  - Desktop actions still appear on hover.
  - Narrow-width actions are always visible and wrap below the row content.
- Unknown sidebar nav ids still fall back to a defensive “준비 중” toast, but visible nav items are implemented.
- Vite proxy can target a non-default backend with:
  - `VITE_API_TARGET=http://localhost:8081 npm run dev -- --host 127.0.0.1`
- This is useful when an older IntelliJ backend is still running on `8080`.

## Repository Structure Notes
- Backend source moved from root `src/` to `backend/src/`.
- Backend build file moved from root `build.gradle` to `backend/build.gradle`.
- Root `settings.gradle` includes `backend`.
- Root `build.gradle` only exposes convenience aliases:
  - `./gradlew bootRun` -> `:backend:bootRun`
  - `./gradlew test` -> `:backend:test`
- Module split and multi-device sync planning lives at:
  - `docs/plans/2026-05-05-module-split-and-sync.md`
- Remote shared PostgreSQL setup lives at:
  - `docs/setup-remote-postgres.md`
- Backend datasource can now be configured with:
  - `SPRING_DATASOURCE_URL`
  - `SPRING_DATASOURCE_USERNAME`
  - `SPRING_DATASOURCE_PASSWORD`

## Files Left Uncommitted on Purpose
- `.claude/settings.local.json`
- `.gitignore`
- `skills/`

These are local/tooling changes, not app feature work.

## User Preferences
- Commit messages should use Korean.
- Commit messages should include a concise subject plus a short explanatory body.
- Do not include `Co-Authored-By`.

## Recommended Next Feature
- Try the Neon Free Postgres shared DB setup on a second laptop.

Why this next:
- The repo structure now separates frontend/backend modules.
- Backend datasource config now supports environment variable overrides.
- The recommended v1 path is local backend/frontend on each laptop connected to one shared Neon Postgres database.
- Authentication remains deferred because the backend is not exposed to the internet in this setup.

## Validation Baseline
- `./gradlew test`
- `./gradlew :backend:test`
- `cd frontend && npm run test`
- `cd frontend && npm run build`
- `cd frontend && npm run lint`

## Latest Validation
- `./gradlew test` — passed, delegates to `:backend:test`
- `./gradlew :backend:test`
- `cd frontend && npm run test` — 8 files, 24 tests passed
- `cd frontend && npm run lint`
- `cd frontend && npm run build`
- `./gradlew :backend:bootRun --args='--server.port=18080'` — local fallback datasource boot reached Tomcat started; process was then manually terminated

## If You Start Here Next
1. Read this file first.
2. Check `git status` for any new local changes.
3. Implement one feature slice only.
4. Keep commits in Korean with a short explanatory body.
