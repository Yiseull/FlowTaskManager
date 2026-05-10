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
- Node.js 20+ (npm 포함)
- Docker (로컬 PostgreSQL을 띄우는 경우)

설치 여부는 다음으로 확인할 수 있습니다.

```bash
java -version    # 26+
node -v          # v20 이상
npm -v
docker -v
```

### 설치

**1. 저장소 클론**

```bash
git clone https://github.com/Yiseull/FlowTaskManager.git
cd FlowTaskManager
```

**2. 프론트엔드 의존성 설치**

```bash
cd frontend
npm install
cd ..
```

백엔드는 Gradle Wrapper가 첫 실행 시 의존성을 자동으로 받아오므로 별도 설치 단계가 필요 없습니다.

### 실행

**1. DB 실행 (로컬 PostgreSQL을 쓸 때)**

```bash
docker run -d \
  --name flowtaskmanager-db \
  -e POSTGRES_DB=flowtaskmanager \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:17
```

원격 PostgreSQL(예: Neon)을 공유 DB로 쓰려면 이 단계를 건너뛰고 다음 단계에서 환경변수를 지정합니다. 자세한 절차는 [docs/setup-remote-postgres.md](docs/setup-remote-postgres.md)를 참고하세요.

**2. 백엔드 실행**

```bash
cd backend
./gradlew bootRun
```

서버가 `http://localhost:8080`에서 실행됩니다.

원격 PostgreSQL을 쓰는 경우, 실행 전에 다음 환경변수를 설정합니다.

```bash
export SPRING_DATASOURCE_URL='jdbc:postgresql://<neon-host>/<db-name>?sslmode=require'
export SPRING_DATASOURCE_USERNAME='<neon-user>'
export SPRING_DATASOURCE_PASSWORD='<neon-password>'
```

**3. 프론트엔드 실행**

```bash
cd frontend
npm run dev
```

프론트엔드는 기본적으로 `http://localhost:3000`에서 실행되고, Vite proxy가 백엔드 `http://localhost:8080`을 바라봅니다.

### 테스트

```bash
cd backend && ./gradlew test
cd frontend && npm run test
```

백엔드 테스트는 DB 없이 H2 인메모리로 실행됩니다.

## 배포

IDE를 켜지 않고도 항상 접근 가능한 환경을 만들기 위해 무료 호스팅 조합을 사용합니다.

| 레이어 | 호스팅 | 무료 한도 / 특이사항 |
|------|--------|----------------------|
| Frontend | Vercel | 사실상 무제한 (개인), Vite 자동 인식 |
| Backend  | Render Free | 750h/월, 15분 무사용 시 sleep → 첫 요청 30~60초 콜드 스타트 |
| DB       | Neon Free | 0.5GB, 5분 무사용 시 일시정지(자동 재시작) |

### 백엔드 (Render)

1. [Render](https://render.com) → **New → Web Service** → GitHub 저장소 연결
2. 다음 값으로 설정
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `Dockerfile`
   - **Plan**: Free
3. **Environment** 탭에서 다음 변수 등록 (값은 절대 커밋 금지)
   ```
   SPRING_DATASOURCE_URL=jdbc:postgresql://<neon-host>/<db-name>?sslmode=require
   SPRING_DATASOURCE_USERNAME=<neon-user>
   SPRING_DATASOURCE_PASSWORD=<neon-password>
   APP_CORS_ALLOWED_ORIGINS=https://<your-vercel-app>.vercel.app
   ```
4. 배포 후 콘솔 로그에서 `Tomcat started on port ...` 확인
5. `https://<render-app>.onrender.com/tasks/today`로 직접 호출해 200 응답 확인

> Render는 컨테이너 포트를 환경변수 `PORT`로 주입하며, 백엔드는 [application.yml](backend/src/main/resources/application.yml)의 `server.port: ${PORT:8080}`으로 자동 적용됩니다.

### 프론트엔드 (Vercel)

1. [Vercel](https://vercel.com) → **New Project** → GitHub 저장소 연결
2. 다음 값으로 설정
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (자동 감지)
3. **Environment Variables**에 다음 등록
   ```
   VITE_API_BASE=https://<render-app>.onrender.com
   ```
4. 배포 후 발급된 Vercel 도메인을 백엔드 `APP_CORS_ALLOWED_ORIGINS`에 추가하고 백엔드 재배포

### 주의사항

- **콜드 스타트**: Render Free는 15분 무사용 시 sleep, Neon Free는 5분 무사용 시 일시정지. 합쳐서 첫 진입 시 30초~1분 정도 지연이 있을 수 있습니다.
- **CORS**: 백엔드는 `APP_CORS_ALLOWED_ORIGINS`(콤마 구분)에 등록된 origin만 허용합니다. 로컬 개발용 기본값은 `http://localhost:3000,http://localhost:5173`입니다.
- **비밀번호**: 모든 자격증명은 호스팅 콘솔의 환경변수로만 관리하세요. README나 `.env`에 실값을 적어 커밋하지 마세요. `.env.example`은 키 형식 참고용입니다.

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
│   ├── build.gradle
│   ├── settings.gradle
│   ├── gradlew
│   ├── Dockerfile          # Render 배포용
│   └── src/main/java/org/example/flowtaskmanager/
│       ├── api/      # REST controllers and request/response records
│       ├── domain/   # Task, Session, Day, Settings, Interrupt domain logic
│       └── global/   # Exception handling, API response wrapper, CORS 설정
├── frontend/
│   ├── vercel.json         # Vercel SPA rewrite 설정
│   ├── .env.example        # VITE_API_BASE 등 환경변수 템플릿
│   └── src/          # React UI
└── docs/
```

## 설계 문서

- `flow-task-manager-design.md` — 전체 설계 문서 (아키텍처, ERD, 상태 머신, Phase 계획)
- `flow-task-manager-frontend.md` — 프론트엔드 전용 설계서
- `docs/plans/2026-05-05-module-split-and-sync.md` — 모듈 분리와 다중 기기 사용 계획
- `docs/setup-remote-postgres.md` — Neon 등 원격 PostgreSQL 공유 DB 설정
- `openapi.yaml` — OpenAPI 3.1 명세
