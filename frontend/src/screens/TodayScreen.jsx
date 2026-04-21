import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, MOCK } from '../api';
import ActiveBanner from '../components/ActiveBanner';
import TaskRow from '../components/TaskRow';
import AddTaskRow from '../components/AddTaskRow';
import SwitchModal from '../modals/SwitchModal';
import { toast } from '../components/Toast';

async function apiOrMock(fn, mockData) {
  try { return await fn(); }
  catch (e) {
    if (e instanceof TypeError) return mockData;
    throw e;
  }
}

export default function TodayScreen({ onDayEnd }) {
  const queryClient = useQueryClient();
  const [switchModal, setSwitchModal] = useState({ open: false, targetTask: null });
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  const { data: todayData, isLoading } = useQuery({
    queryKey: ['today'],
    queryFn: () => apiOrMock(() => api.getToday(), MOCK.today),
    staleTime: 0,
  });

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: () => apiOrMock(() => api.getCurrentSession(), MOCK.session),
    enabled: !!todayData?.active,
    retry: false,
  });

  // Timer
  useEffect(() => {
    if (session) {
      const base = session.elapsed_seconds;
      const startedAt = new Date(session.started_at).getTime();
      const tick = () => setElapsed(base + Math.floor((Date.now() - startedAt) / 1000));
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      setElapsed(0);
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [session?.id, session?.elapsed_seconds]);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['today'] });
    queryClient.invalidateQueries({ queryKey: ['session'] });
  }

  const completeMutation = useMutation({
    mutationFn: () => api.completeTask(todayData.active.id),
    onSuccess: () => { toast('완료! 🎉', 'success'); refresh(); },
    onError: (e) => toast(e.message, 'error'),
  });

  const blockMutation = useMutation({
    mutationFn: () => api.blockTask(todayData.active.id),
    onSuccess: () => { toast('차단됨으로 변경했어요'); refresh(); },
    onError: (e) => toast(e.message, 'error'),
  });

  const unblockMutation = useMutation({
    mutationFn: (id) => api.unblockTask(id),
    onSuccess: () => { toast('차단 해제됐어요'); refresh(); },
    onError: (e) => toast(e.message, 'error'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => api.cancelTask(id),
    onSuccess: () => { toast('취소됐어요'); refresh(); },
    onError: (e) => toast(e.message, 'error'),
  });

  const startMutation = useMutation({
    mutationFn: ({ id, payload }) => api.startTask(id, payload),
    onSuccess: (_, { title }) => {
      toast(`"${title}" 시작!`, 'success');
      refresh();
      setSwitchModal({ open: false, targetTask: null });
    },
    onError: (e, { id }) => {
      if (e.code === 'SWITCH_REASON_REQUIRED') {
        const task = [...(todayData?.planned || []), ...(todayData?.blocked || [])].find(t => t.id === id);
        if (task) setSwitchModal({ open: true, targetTask: task });
      } else {
        toast(e.message, 'error');
      }
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: (title) => api.createTask({ title }),
    onSuccess: (_, title) => { toast(`"${title}" 추가됐어요`, 'success'); refresh(); },
    onError: (e) => toast(e.code === 'DAILY_TASK_LIMIT' ? '일일 태스크 한도를 초과했어요' : e.message, 'error'),
  });

  function handleSwitchRequest(task) {
    if (todayData?.active) setSwitchModal({ open: true, targetTask: task });
    else startMutation.mutate({ id: task.id, payload: {}, title: task.title });
  }

  async function handleSwitchConfirm(payload) {
    const task = switchModal.targetTask;
    startMutation.mutate({ id: task.id, payload, title: task.title });
  }

  const active = todayData?.active;
  const planned = todayData?.planned || [];
  const completed = todayData?.completed || [];
  const blocked = todayData?.blocked || [];

  const dateStr = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-muted)', fontSize: 13 }}>
        불러오는 중...
      </div>
    );
  }

  const startingId = startMutation.isPending ? startMutation.variables?.id : null;
  const cancelingId = cancelMutation.isPending ? cancelMutation.variables : null;
  const unblockingId = unblockMutation.isPending ? unblockMutation.variables : null;

  return (
    <>
      {/* Top bar */}
      <div style={{ padding: '20px 24px 12px', borderBottom: '1px solid var(--c-border)', flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--c-text)', marginBottom: 2 }}>오늘</div>
        <div style={{ fontSize: 13, color: 'var(--c-muted)' }}>{dateStr}</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        {active && (
          <div style={{ padding: '0 8px 8px' }}>
            <ActiveBanner
              task={active}
              elapsed={elapsed}
              onComplete={() => completeMutation.mutate()}
              onBlock={() => blockMutation.mutate()}
              loading={completeMutation.isPending ? 'complete' : blockMutation.isPending ? 'block' : null}
            />
          </div>
        )}

        {planned.length > 0 && (
          <>
            <SectionHeader label="할 일" count={planned.length} />
            {planned.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                status="PLANNED"
                onStart={() => handleSwitchRequest(task)}
                onCancel={() => cancelMutation.mutate(task.id)}
                loading={startingId === task.id}
              />
            ))}
          </>
        )}

        {blocked.length > 0 && (
          <>
            <SectionHeader label="차단됨" />
            {blocked.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                status="BLOCKED"
                onUnblock={() => unblockMutation.mutate(task.id)}
                onCancel={() => cancelMutation.mutate(task.id)}
                loading={unblockingId === task.id}
              />
            ))}
          </>
        )}

        <div style={{ padding: '8px 0' }}>
          <AddTaskRow onAdd={(title) => addTaskMutation.mutate(title)} />
        </div>

        {completed.length > 0 && (
          <>
            <SectionHeader label="완료됨" count={completed.length} />
            {completed.map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', height: 44, opacity: 0.45 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: 'var(--c-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M2.5 5.5l2.5 2.5 3.5-4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ fontSize: 15, textDecoration: 'line-through', color: 'var(--c-muted)' }}>{task.title}</span>
                {task.completed_at && (
                  <span style={{ fontSize: 12, color: 'var(--c-muted)', marginLeft: 'auto' }}>
                    {new Date(task.completed_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      <SwitchModal
        open={switchModal.open}
        onClose={() => setSwitchModal({ open: false, targetTask: null })}
        onConfirm={handleSwitchConfirm}
        targetTask={switchModal.targetTask}
        activeTask={active}
      />
    </>
  );
}

function SectionHeader({ label, count }) {
  return (
    <div style={{ padding: '20px 16px 6px', display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
      {count != null && <span style={{ fontSize: 12, color: '#C7C7CC' }}>{count}</span>}
    </div>
  );
}
