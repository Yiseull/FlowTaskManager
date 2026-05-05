# Flow Task Manager

단일 작업 집중을 유도하는 Task 관리 앱. 동시에 **1개의 Task만 진행 가능**하도록 제한하는 것이 핵심입니다.

## 기술 스택

| 구분 | 기술 |
|------|------|
| Language | Java 26 |
| Framework | Spring Boot 4 (Spring Framework 7) |
| ORM | Spring Data JPA + Hibernate 7 |
| DB | PostgreSQL |
| 로컬 인프라 | Docker Compose |
| Frontend | React, Vite |

## 시작하기

### 사전 요구사항

- Java 26+
- Docker

### 실행

**1. DB 실행**

```bash
docker run -d \
  --name flowtaskmanager-db \
  -e POSTGRES_DB=flowtaskmanager \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:17
```

**2. 서버 실행**

```bash
./gradlew bootRun
```

또는 백엔드 모듈을 직접 지정할 수 있습니다.

```bash
./gradlew :backend:bootRun
```

서버가 `http://localhost:8080`에서 실행됩니다.

**3. 프론트엔드 실행**

```bash
cd frontend
npm install
npm run dev
```

프론트엔드는 기본적으로 `http://localhost:3000`에서 실행되고, Vite proxy가 백엔드 `http://localhost:8080`을 바라봅니다.

### 테스트

```bash
./gradlew test
./gradlew :backend:test
cd frontend && npm run test
```

백엔드 테스트는 DB 없이 H2 인메모리로 실행됩니다.

## API

API 명세는 프로젝트 루트의 `openapi.yaml`을 참고하세요.
[Swagger Editor](https://editor.swagger.io) 또는 Postman에서 import해서 확인할 수 있습니다.

### 주요 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| POST | /tasks | Task 생성 |
| GET | /tasks/today | 오늘 Task 목록 |
| PATCH | /tasks/:id/start | Task 시작 |
| PATCH | /tasks/:id/complete | Task 완료 |
| PATCH | /tasks/:id/block | Task 차단 |
| PATCH | /tasks/:id/unblock | 차단 해제 |
| PATCH | /tasks/:id/cancel | Task 취소 |
| GET | /sessions/current | 현재 세션 조회 |
| POST | /day/end | 하루 종료 |
| POST | /day/start | 하루 시작 |
| GET | /day/summary | 오늘 요약 |
| GET | /settings | 설정 조회 |
| PATCH | /settings | 설정 수정 |

## 핵심 정책

- **Active Task는 항상 1개** — DB Partial Unique Index로 보장
- **Task 전환 시 사유 필수** — 사유 없으면 `SWITCH_REASON_REQUIRED(400)` 에러
- **IN_PROGRESS → CANCELLED 직접 불가** — block → cancel 순서 필요
- **모든 시간은 UTC** — 클라이언트에서 로컬 변환

## 프로젝트 구조

```
FlowTaskManager/
├── backend/
│   └── src/main/java/org/example/flowtaskmanager/
│       ├── api/      # REST controllers and request/response records
│       ├── domain/   # Task, Session, Day, Settings, Interrupt domain logic
│       └── global/   # Exception handling and API response wrapper
├── frontend/
│   └── src/          # React UI
├── docs/
├── gradlew
└── settings.gradle
```

## 설계 문서

- `flow-task-manager-design.md` — 전체 설계 문서 (아키텍처, ERD, 상태 머신, Phase 계획)
- `flow-task-manager-frontend.md` — 프론트엔드 전용 설계서
- `docs/plans/2026-05-05-module-split-and-sync.md` — 모듈 분리와 다중 기기 사용 계획
- `openapi.yaml` — OpenAPI 3.1 명세
