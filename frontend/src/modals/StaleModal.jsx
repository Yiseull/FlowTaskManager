import { useState } from 'react';
import Btn from '../components/Btn';
import { toast } from '../components/toastStore';
import { api, MOCK, shouldUseMockFallback } from '../api';

async function apiOrMock(fn, mockData) {
  try { return await fn(); }
  catch (e) {
    if (shouldUseMockFallback(e)) return mockData;
    throw e;
  }
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function StaleModal({ tasks, onResolved }) {
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(null);

  const task = tasks[current];
  if (!task) return null;

  async function handle(action) {
    setLoading(action);
    try {
      if (action === 'start') {
        await apiOrMock(() => api.startTask(task.id), {});
        toast('태스크를 시작했어요', 'success');
      } else if (action === 'postpone') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const scheduledDate = formatLocalDate(tomorrow);
        await apiOrMock(() => api.rescheduleTask(task.id, { scheduledDate }), {});
        toast('내일로 미뤘어요');
      } else if (action === 'delete') {
        await apiOrMock(() => api.cancelTask(task.id), {});
        toast('태스크를 삭제했어요');
      }
      if (current + 1 >= tasks.length) onResolved();
      else setCurrent(c => c + 1);
    } catch (e) {
      toast(e.message || '오류가 발생했어요', 'error');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 2000, padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, maxWidth: 400, width: '100%',
        padding: 28, boxShadow: '0 12px 48px rgba(0,0,0,0.18)',
        animation: 'modalIn 0.2s ease',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-danger)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          방치된 태스크 {current + 1}/{tasks.length}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{task.title}</div>
        <div style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 20 }}>
          {task.carry_over_count >= 4
            ? `${task.carry_over_count}회 이월 — 반드시 처리해 주세요`
            : '3일 이상 진행하지 않은 태스크예요'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Btn onClick={() => handle('start')} loading={loading === 'start'} fullWidth>지금 시작</Btn>
          <Btn variant="secondary" onClick={() => handle('postpone')} loading={loading === 'postpone'} fullWidth>미루기</Btn>
          <Btn variant="danger-ghost" onClick={() => handle('delete')} loading={loading === 'delete'} fullWidth>삭제</Btn>
        </div>
      </div>
    </div>
  );
}
