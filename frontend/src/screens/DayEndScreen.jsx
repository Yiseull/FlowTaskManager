import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, MOCK } from '../api';
import FreshnessBadge from '../components/FreshnessBadge';
import Btn from '../components/Btn';
import { toast } from '../components/Toast';

async function apiOrMock(fn, mockData) {
  try { return await fn(); }
  catch (e) {
    if (e instanceof TypeError) return mockData;
    throw e;
  }
}

function RingChart({ value, max, label, sublabel, color }) {
  const r = 38, circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: 100, height: 100 }}>
        <svg width={100} height={100} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={50} cy={50} r={r} fill="none" stroke="var(--c-border)" strokeWidth={7} />
          <circle cx={50} cy={50} r={r} fill="none"
            stroke={color || 'var(--c-accent)'} strokeWidth={7}
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round"
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{value}</span>
          <span style={{ fontSize: 10, color: 'var(--c-muted)' }}>{sublabel}</span>
        </div>
      </div>
      <span style={{ fontSize: 12, color: 'var(--c-muted)', fontWeight: 500 }}>{label}</span>
    </div>
  );
}

function FocusBar({ minutes }) {
  const goal = 240;
  const pct = Math.min(minutes / goal, 1);
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const label = hrs > 0 ? `${hrs}시간 ${mins}분` : `${mins}분`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 12, color: 'var(--c-muted)', fontWeight: 500 }}>집중 시간</span>
        <span style={{ fontSize: 18, fontWeight: 700 }}>{label}</span>
      </div>
      <div style={{ height: 8, background: 'var(--c-border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct * 100}%`, borderRadius: 4,
          background: pct >= 0.75 ? 'var(--c-success)' : pct >= 0.4 ? 'var(--c-accent)' : 'var(--c-warn)',
          transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--c-muted)' }}>0</span>
        <span style={{ fontSize: 11, color: 'var(--c-muted)' }}>목표 4시간</span>
      </div>
    </div>
  );
}

export default function DayEndScreen({ summary, carryOverPending = [], onDayStart, onBack }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(() => new Set(carryOverPending.map(t => t.id)));

  function toggle(id) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const carry_over = carryOverPending.filter(t => selected.has(t.id)).map(t => t.id);
      const dismiss = carryOverPending.filter(t => !selected.has(t.id)).map(t => t.id);
      if (carry_over.length || dismiss.length) {
        await apiOrMock(() => api.startDay({ carry_over, dismiss }), {});
      }
    },
    onSuccess: () => {
      toast('하루를 마무리했어요 👏', 'success');
      queryClient.invalidateQueries({ queryKey: ['today'] });
      onDayStart();
    },
    onError: (e) => toast(e.message, 'error'),
  });

  const s = summary || MOCK.summary;
  const dateStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px 48px' }}>
      <div style={{ width: '100%', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            하루 마감
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
            {s.completed_count > 0 ? '수고했어요! 🎉' : '내일 더 잘 할 수 있어요'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--c-muted)', marginTop: 6 }}>{dateStr}</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '24px 0', marginBottom: 8 }}>
          <RingChart value={s.completed_count} max={Math.max(s.completed_count + carryOverPending.length, 5)} label="완료" sublabel="tasks" color="var(--c-success)" />
          <RingChart value={s.switch_count} max={Math.max(s.switch_count, 10)} label="전환" sublabel="times" color="var(--c-warn)" />
          <RingChart value={s.carry_over_count} max={Math.max(s.carry_over_count, 5)} label="이월" sublabel="tasks" color="var(--c-danger)" />
        </div>

        <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: 20, marginBottom: 24, border: '1px solid var(--c-border)' }}>
          <FocusBar minutes={s.focus_minutes} />
        </div>

        {carryOverPending.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>내일로 이월할 태스크</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {carryOverPending.map(task => {
                const isSel = selected.has(task.id);
                return (
                  <button
                    key={task.id}
                    onClick={() => toggle(task.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 10,
                      border: `1.5px solid ${isSel ? 'var(--c-accent)' : 'var(--c-border)'}`,
                      background: isSel ? 'var(--c-accent-faint)' : 'var(--c-surface)',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%',
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 5,
                      border: `2px solid ${isSel ? 'var(--c-accent)' : 'var(--c-border)'}`,
                      background: isSel ? 'var(--c-accent)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s',
                    }}>
                      {isSel && <span style={{ color: '#fff', fontSize: 10 }}>✓</span>}
                    </div>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{task.title}</span>
                    {task.carry_over_count > 0 && (
                      <FreshnessBadge freshness="WARNING" count={task.carry_over_count} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="secondary" onClick={onBack} fullWidth>돌아가기</Btn>
          <Btn onClick={() => mutation.mutate()} loading={mutation.isPending} fullWidth>완료 →</Btn>
        </div>
      </div>
    </div>
  );
}
