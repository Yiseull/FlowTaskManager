async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.error?.message || 'API Error');
    err.code = body?.error?.code;
    err.status = res.status;
    throw err;
  }
  return body.data !== undefined ? body.data : body;
}

export const api = {
  getToday:        ()       => apiFetch('/tasks/today'),
  createTask:      (payload) => apiFetch('/tasks', { method: 'POST', body: JSON.stringify(payload) }),
  startTask:       (id, payload = {}) => apiFetch(`/tasks/${id}/start`, { method: 'PATCH', body: JSON.stringify(payload) }),
  completeTask:    (id)     => apiFetch(`/tasks/${id}/complete`, { method: 'PATCH', body: JSON.stringify({}) }),
  blockTask:       (id)     => apiFetch(`/tasks/${id}/block`,   { method: 'PATCH', body: JSON.stringify({}) }),
  unblockTask:     (id)     => apiFetch(`/tasks/${id}/unblock`, { method: 'PATCH', body: JSON.stringify({}) }),
  cancelTask:      (id)     => apiFetch(`/tasks/${id}/cancel`,  { method: 'PATCH', body: JSON.stringify({}) }),
  getCurrentSession: ()     => apiFetch('/sessions/current'),
  endDay:          ()       => apiFetch('/day/end', { method: 'POST', body: JSON.stringify({}) }),
  startDay:        (payload) => apiFetch('/day/start', { method: 'POST', body: JSON.stringify(payload) }),
  getDaySummary:   ()       => apiFetch('/day/summary'),
  getSettings:     ()       => apiFetch('/settings'),
  updateSettings:  (payload) => apiFetch('/settings', { method: 'PATCH', body: JSON.stringify(payload) }),
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
};
