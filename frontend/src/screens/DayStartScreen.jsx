import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, MOCK, shouldUseMockFallback } from '../api';
import FreshnessBadge from '../components/FreshnessBadge';
import Btn from '../components/Btn';
import { toast } from '../components/toastStore';

async function apiOrMock(fn, mockData) {
  try { return await fn(); }
  catch (e) {
    if (shouldUseMockFallback(e)) return mockData;
    throw e;
  }
}

function carryOverCount(task) {
  return task.carry_over_count ?? task.carryOverCount ?? 0;
}

export default function DayStartScreen({ carryOverPending, onComplete }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(() => new Set(carryOverPending.map(t => t.id)));

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const mutation = useMutation({
    mutationFn: (payload) => apiOrMock(() => api.startDay(payload), {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today'] });
      onComplete();
    },
    onError: (e) => toast(e.message || '오류 발생', 'error'),
  });

  function handleStart() {
    const carryOver = carryOverPending.filter(t => selected.has(t.id)).map(t => t.id);
    const dismiss = carryOverPending.filter(t => !selected.has(t.id)).map(t => t.id);
    mutation.mutate({ carryOver, dismiss });
  }

  const carryCount = selected.size;
  const dismissCount = carryOverPending.length - carryCount;

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            하루 시작
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, lineHeight: 1.25 }}>어제 남은 태스크를<br />어떻게 할까요?</h1>
          <p style={{ fontSize: 14, color: 'var(--c-muted)', marginTop: 10 }}>이월하면 오늘 목록에 추가되고, 제거하면 사라져요.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {carryOverPending.map(task => {
            const isSel = selected.has(task.id);
            return (
              <button
                key={task.id}
                onClick={() => toggle(task.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 12,
                  border: `1.5px solid ${isSel ? 'var(--c-accent)' : 'var(--c-border)'}`,
                  background: isSel ? 'var(--c-accent-faint)' : 'var(--c-surface)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  border: `2px solid ${isSel ? 'var(--c-accent)' : 'var(--c-border)'}`,
                  background: isSel ? 'var(--c-accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.15s',
                }}>
                  {isSel && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{task.title}</div>
                  {carryOverCount(task) > 0 && (
                    <div style={{ marginTop: 4 }}>
                      <FreshnessBadge freshness={carryOverCount(task) >= 4 ? 'STALE' : 'WARNING'} count={carryOverCount(task)} />
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: isSel ? 'var(--c-accent)' : 'var(--c-muted)', fontWeight: 600, flexShrink: 0 }}>
                  {isSel ? '이월' : '제거'}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ background: 'var(--c-surface)', borderRadius: 10, padding: '12px 16px', border: '1px solid var(--c-border)', marginBottom: 20, display: 'flex', gap: 24 }}>
          <div style={{ fontSize: 13 }}>
            <span style={{ color: 'var(--c-accent)', fontWeight: 700 }}>{carryCount}</span>
            <span style={{ color: 'var(--c-muted)' }}> 이월</span>
          </div>
          <div style={{ fontSize: 13 }}>
            <span style={{ color: 'var(--c-danger)', fontWeight: 700 }}>{dismissCount}</span>
            <span style={{ color: 'var(--c-muted)' }}> 제거</span>
          </div>
        </div>

        <Btn onClick={handleStart} loading={mutation.isPending} fullWidth>오늘 시작하기 →</Btn>
      </div>
    </div>
  );
}
