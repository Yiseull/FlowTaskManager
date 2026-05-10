// 운영(Vercel) 빌드에서는 VITE_API_BASE에 백엔드 절대 URL을 넣어 주입.
// 비어 있으면 dev 모드의 vite proxy(상대 경로) 흐름을 그대로 사용.
const API_BASE = (import.meta.env?.VITE_API_BASE || '').replace(/\/+$/, '');

async function apiFetch(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await res.json().catch(() => ({}))
    : null;
  if (!res.ok) {
    const err = new Error(body?.error?.message || 'API Error');
    err.code = body?.error?.code;
    err.status = res.status;
    throw err;
  }
  if (body == null) {
    throw new TypeError(`Expected JSON response for ${path}`);
  }
  return body.data !== undefined ? body.data : body;
}

export function shouldUseMockFallback(error) {
  if (error instanceof TypeError) return true;
  if (!error) return false;
  if (error.status === 502 || error.status === 503 || error.status === 504) return true;
  const message = String(error.message || '');
  return message.includes('Failed to fetch') || message.includes('API Error');
}

export function shouldUseSomedayMockFallback(error) {
  return shouldUseMockFallback(error) || error?.status === 404;
}

export const api = {
  getToday:        ()       => apiFetch('/tasks/today'),
  getUpcoming:     ()       => apiFetch('/tasks/upcoming'),
  getSomeday:      ()       => apiFetch('/tasks/someday'),
  createTask:      (payload) => apiFetch('/tasks', { method: 'POST', body: JSON.stringify(payload) }),
  createSomedayTask: (payload) => apiFetch('/tasks/someday', { method: 'POST', body: JSON.stringify(payload) }),
  startTask:       (id, payload = {}) => apiFetch(`/tasks/${id}/start`, { method: 'PATCH', body: JSON.stringify(payload) }),
  completeTask:    (id)     => apiFetch(`/tasks/${id}/complete`, { method: 'PATCH', body: JSON.stringify({}) }),
  blockTask:       (id)     => apiFetch(`/tasks/${id}/block`,   { method: 'PATCH', body: JSON.stringify({}) }),
  unblockTask:     (id)     => apiFetch(`/tasks/${id}/unblock`, { method: 'PATCH', body: JSON.stringify({}) }),
  cancelTask:      (id)     => apiFetch(`/tasks/${id}/cancel`,  { method: 'PATCH', body: JSON.stringify({}) }),
  sendTaskToSomeday: (id)   => apiFetch(`/tasks/${id}/someday`, { method: 'PATCH', body: JSON.stringify({}) }),
  rescheduleTask:  (id, payload) => apiFetch(`/tasks/${id}/schedule`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getCurrentSession: ()     => apiFetch('/sessions/current'),
  endDay:          ()       => apiFetch('/day/end', { method: 'POST', body: JSON.stringify({}) }),
  startDay:        (payload) => apiFetch('/day/start', { method: 'POST', body: JSON.stringify(payload) }),
  getDaySummary:   ()       => apiFetch('/day/summary'),
  getSettings:     ()       => apiFetch('/settings'),
  updateSettings:  (payload) => apiFetch('/settings', { method: 'PATCH', body: JSON.stringify(payload) }),
  getInterrupts:   (status) => apiFetch(status ? `/interrupts?status=${encodeURIComponent(status)}` : '/interrupts'),
  createInterrupt: (payload) => apiFetch('/interrupts', { method: 'POST', body: JSON.stringify(payload) }),
  convertInterrupt: (id, payload = {}) => apiFetch(`/interrupts/${id}/convert`, { method: 'PATCH', body: JSON.stringify(payload) }),
  dismissInterrupt: (id) => apiFetch(`/interrupts/${id}/dismiss`, { method: 'PATCH', body: JSON.stringify({}) }),
};

export const MOCK = {
  today: {
    active: { id: 'task-1', title: '프론트엔드 설계서 리뷰', carry_over_count: 0 },
    planned: [
      { id: 'task-2', title: 'API 명세 작성', carry_over_count: 2, freshness: 'WARNING' },
      { id: 'task-3', title: '팀 미팅 준비',  carry_over_count: 0, freshness: 'NORMAL' },
      { id: 'task-4', title: '레거시 코드 정리', carry_over_count: 4, freshness: 'STALE' },
    ],
    completed: [
      { id: 'task-5', title: '스프린트 회고', completed_at: new Date(Date.now() - 3600000).toISOString() },
    ],
    blocked:  [{ id: 'task-6', title: '배포 작업 (인프라 대기)' }],
    cancelled: [],
    carry_over_pending: [],
  },
  session: {
    id: 'sess-1', task_id: 'task-1', task_title: '프론트엔드 설계서 리뷰',
    started_at: new Date(Date.now() - 1820000).toISOString(), elapsed_seconds: 1820,
  },
  summary: { date: new Date().toISOString().split('T')[0], completed_count: 3, switch_count: 5, focus_minutes: 142, carry_over_count: 2 },
  someday: {
    tasks: [
      {
        id: 'someday-1',
        title: '제품 소개 페이지 구조 정리',
        description: '지금 당장 시작하지 않고 다음 집중 슬롯 후보로 보관',
        status: 'PLANNED',
        carry_over_count: 0,
        freshness: 'NORMAL',
        scheduled_date: null,
      },
      {
        id: 'someday-2',
        title: '외부 캘린더 연동 검토',
        description: 'OAuth 범위와 일정 쓰기 정책 확인 필요',
        status: 'BLOCKED',
        carry_over_count: 1,
        freshness: 'NORMAL',
        scheduled_date: null,
      },
      {
        id: 'someday-3',
        title: '반복 미루는 작업 기준 재점검',
        status: 'PLANNED',
        carry_over_count: 3,
        freshness: 'WARNING',
        scheduled_date: null,
      },
    ],
  },
  upcoming: {
    tasks: [
      {
        id: 'future-1',
        title: '릴리즈 노트 초안 정리',
        status: 'PLANNED',
        scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        carryOverCount: 0,
        freshness: 'NORMAL',
      },
      {
        id: 'future-2',
        title: '외부 리뷰 결과 반영',
        status: 'BLOCKED',
        scheduledDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        carryOverCount: 0,
        freshness: 'NORMAL',
      },
    ],
  },
  interrupts: [
    {
      id: 'interrupt-1',
      title: '운영 배포 상태 확인',
      priority: 'HIGH',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 900000).toISOString(),
      processedAt: null,
    },
    {
      id: 'interrupt-2',
      title: '짧은 동기화 메시지 답변',
      priority: 'LOW',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 240000).toISOString(),
      processedAt: null,
    },
  ],
};
