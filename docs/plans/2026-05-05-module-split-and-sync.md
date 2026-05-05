# 모듈 분리와 다중 기기 사용 계획

Updated: 2026-05-05

## 목표

1. 현재 repo root에 있는 Spring Boot 백엔드를 `backend/` 모듈로 분리하고, 기존 `frontend/`와 형제 디렉터리로 배치한다.
2. 다른 노트북에서도 같은 데이터를 쓰기 위한 중앙 저장소/동기화 방식을 설계한다.

## 1. 프론트/백엔드 모듈 분리

### 방향

- repo root는 공통 문서, Gradle wrapper, 루트 `settings.gradle`, 공통 명령 entry point만 가진다.
- 백엔드는 `backend/`에 둔다.
- 프론트엔드는 기존 `frontend/` 위치를 유지한다.
- 루트 Gradle은 `backend` subproject를 include해서 기존처럼 root에서 명령을 실행할 수 있게 한다.

### 구조

```text
FlowTaskManager/
├── backend/
│   ├── build.gradle
│   └── src/
├── frontend/
│   ├── package.json
│   └── src/
├── docs/
├── gradlew
├── settings.gradle
└── README.md
```

### 실행 명령

```bash
./gradlew :backend:bootRun
./gradlew :backend:test
cd frontend && npm run dev
cd frontend && npm run test
```

### 완료 조건

- `backend/src`로 소스 이동.
- root `settings.gradle`에 `include 'backend'` 추가.
- 기존 백엔드 테스트가 `./gradlew :backend:test`로 통과.
- 프론트 테스트/빌드가 기존처럼 통과.
- README/HANDOFF의 실행 명령을 새 구조에 맞게 갱신.

## 2. 다른 노트북에서 실제 사용하기

### 문제 정의

현재 앱은 로컬 PostgreSQL을 기준으로 동작한다. 다른 노트북에서도 같은 작업 데이터를 보려면 중앙 데이터 저장소 또는 동기화 계층이 필요하다.

### 추천 1차 방향

- 백엔드/DB를 한 곳에 상시 실행한다.
- 각 노트북은 프론트엔드 또는 브라우저에서 같은 백엔드 URL을 바라본다.
- MVP 단일 사용자 정책은 유지하되, 외부 접근을 열기 전 최소 인증을 추가한다.

### 선택지

| 선택지 | 설명 | 장점 | 리스크 |
|---|---|---|---|
| 홈/개인 서버 + PostgreSQL | 한 장비나 NAS에 백엔드와 DB를 상시 실행 | 비용 낮음, 구조 단순 | 네트워크/백업/보안 직접 관리 |
| 클라우드 VM + Managed PostgreSQL | 백엔드와 DB를 클라우드에 배포 | 노트북 간 접근 쉬움, 운영 안정 | 비용과 배포 설정 필요 |
| PaaS + Managed PostgreSQL | Render/Fly/Railway류에 배포 | 빠른 MVP 배포 | 플랫폼 제약, 비용 변동 |
| 로컬 DB 동기화 | 각 노트북이 로컬 DB를 쓰고 sync | 오프라인 강함 | 충돌 해결과 sync 구현 난도 높음 |

### 다음 구현 순서

1. 배포 대상 결정: 개인 서버, 클라우드 VM, PaaS 중 하나.
2. PostgreSQL 영속 저장소와 백업 정책 정의.
3. 외부 접근 전 최소 인증 추가.
4. 환경 변수 기반 설정 분리: `DATABASE_URL`, CORS 허용 origin, 서버 port.
5. 프론트 `VITE_API_TARGET`/배포 URL 전략 정리.
6. 나중에 오프라인 사용이 필요하면 sync/queue 설계를 별도 Phase로 진행.

### 보류 사항

- 현재 요구는 “다른 노트북에서도 사용”이므로 중앙 백엔드/DB 방식이 우선이다.
- 로컬-first 동기화는 충돌 해결, 이벤트 로그, 삭제/취소 tombstone 정책이 필요하므로 MVP 이후로 미룬다.
