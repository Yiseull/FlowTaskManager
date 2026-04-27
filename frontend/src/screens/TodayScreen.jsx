import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, MOCK, shouldUseMockFallback } from '../api';
import ActiveBanner from '../components/ActiveBanner';
import TaskRow from '../components/TaskRow';
import AddTaskRow from '../components/AddTaskRow';
import AddInterruptRow from '../components/AddInterruptRow';
import InterruptRow from '../components/InterruptRow';
import SwitchModal from '../modals/SwitchModal';
import { toast } from '../components/toastStore';

async function apiOrMock(fn, mockData) {
  try { return await fn(); }
  catch (e) {
    if (shouldUseMockFallback(e)) return mockData;
    throw e;
  }
}

export default function TodayScreen({ onDayEnd, onOpenSettings }) {
  const queryClient = useQueryClient();
  const [switchModal, setSwitchModal] = useState({ open: false, targetTask: null });
  const [elapsed, setElapsed] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const intervalRef = useRef(null);
  const plannedPanelRef = useRef(null);

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

  const { data: interrupts = [] } = useQuery({
    queryKey: ['interrupts', 'PENDING'],
    queryFn: () => apiOrMock(() => api.getInterrupts('PENDING'), MOCK.interrupts),
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
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [session]);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['today'] });
    queryClient.invalidateQueries({ queryKey: ['session'] });
    queryClient.invalidateQueries({ queryKey: ['interrupts'] });
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

  const addInterruptMutation = useMutation({
    mutationFn: (payload) => api.createInterrupt(payload),
    onSuccess: (_, vars) => {
      toast(`"${vars.title}" interrupt를 남겼어요`);
      refresh();
    },
    onError: (e) => {
      if (e.code === 'NO_ACTIVE_SESSION') toast('진행 중인 작업이 있을 때만 interrupt를 남길 수 있어요', 'error');
      else toast(e.message, 'error');
    },
  });

  const convertInterruptMutation = useMutation({
    mutationFn: ({ id, startImmediately }) => api.convertInterrupt(id, { start_immediately: startImmediately }),
    onSuccess: (_, vars) => {
      toast(vars.startImmediately ? 'interrupt를 바로 작업으로 전환했어요' : 'interrupt를 오늘 할 일로 옮겼어요', 'success');
      refresh();
    },
    onError: (e) => toast(e.message, 'error'),
  });

  const dismissInterruptMutation = useMutation({
    mutationFn: (id) => api.dismissInterrupt(id),
    onSuccess: () => {
      toast('interrupt를 닫았어요');
      refresh();
    },
    onError: (e) => toast(e.message, 'error'),
  });

  function handleSwitchRequest(task) {
    if (todayData?.active) setSwitchModal({ open: true, targetTask: task });
    else startMutation.mutate({ id: task.id, payload: {}, title: task.title });
  }

  async function handleSwitchConfirm(payload) {
    const task = switchModal.targetTask;
    startMutation.mutate({ id: task.id, payload, title: task.title });
  }

  function handleSwitchShortcut() {
    setFocusMode(false);
    plannedPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast('아래 할 일 목록에서 시작할 작업을 선택해 전환할 수 있어요.');
  }

  const active = todayData?.active;
  const planned = todayData?.planned || [];
  const completed = todayData?.completed || [];
  const blocked = todayData?.blocked || [];
  const pendingInterrupts = Array.isArray(interrupts) ? interrupts : [];
  const sparseLayout = !focusMode && !active && planned.length === 0 && completed.length === 0;

  const dateStr = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
  const compact = typeof window !== 'undefined' && window.innerWidth < 1160;

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-muted)', fontSize: 13 }}>
        불러오는 중...
      </div>
    );
  }

  const startingId = startMutation.isPending ? startMutation.variables?.id : null;
  const unblockingId = unblockMutation.isPending ? unblockMutation.variables : null;
  const convertingInterruptId = convertInterruptMutation.isPending ? convertInterruptMutation.variables?.id : null;
  const dismissingInterruptId = dismissInterruptMutation.isPending ? dismissInterruptMutation.variables : null;

  return (
    <>
      <div style={{
        padding: compact ? '24px 18px 14px' : '28px 38px 20px',
        display: 'flex',
        alignItems: compact ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 44, lineHeight: 1.05, fontWeight: 800, letterSpacing: '-0.06em', marginBottom: 8 }}>오늘</div>
          <div style={{ fontSize: 18, color: 'var(--c-muted)', fontWeight: 600 }}>{dateStr}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <TopButton
            label={focusMode ? '집중 모드 해제' : '집중 모드'}
            icon="focus"
            active={focusMode}
            onClick={() => setFocusMode(prev => !prev)}
          />
          <TopButton icon="settings" onClick={onOpenSettings} />
          <TopButton label="하루 종료" icon="stop" onClick={onDayEnd} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: compact ? '0 18px 22px' : '0 30px 30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: compact || focusMode ? '1fr' : sparseLayout ? 'minmax(0, 0.92fr) minmax(380px, 1.08fr)' : 'minmax(0, 1.02fr) minmax(360px, 0.98fr)', gap: 24, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {active && (
              <ActiveBanner
                task={active}
                elapsed={elapsed}
                onComplete={() => completeMutation.mutate()}
                onBlock={() => blockMutation.mutate()}
                onSwitch={handleSwitchShortcut}
                loading={completeMutation.isPending ? 'complete' : blockMutation.isPending ? 'block' : null}
              />
            )}

            <Panel title="할 일" count={planned.length} sectionRef={plannedPanelRef}>
              {planned.length === 0 && (
                <EmptyState
                  title="아직 오늘 할 일이 없습니다."
                  description="새 태스크를 추가하거나 interrupt를 작업으로 옮겨서 오늘 흐름을 시작하세요."
                />
              )}
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
              <AddTaskRow onAdd={(title) => addTaskMutation.mutate(title)} />
            </Panel>

            {sparseLayout && (
              <FocusGuideCard />
            )}

            {completed.length > 0 && (
              <Panel title="완료됨" count={completed.length}>
                {completed.map(task => (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderBottom: '1px solid rgba(123, 137, 112, 0.12)', opacity: 0.55 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'var(--c-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 11 11" fill="none">
                        <path d="M2.5 5.5l2.5 2.5 3.5-4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 600, textDecoration: 'line-through', color: 'var(--c-muted)' }}>{task.title}</span>
                    {task.completed_at && (
                      <span style={{ fontSize: 13, color: 'var(--c-muted)', marginLeft: 'auto' }}>
                        {new Date(task.completed_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                ))}
              </Panel>
            )}
          </div>

          {!focusMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Panel
              title="Interrupt Queue"
              count={pendingInterrupts.length}
              action={
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 72,
                  height: 38,
                  padding: '0 12px',
                  borderRadius: 999,
                  background: 'rgba(174,138,61,0.1)',
                  color: 'var(--c-warn)',
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                }}>
                  흐름 보호
                </span>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--c-muted)' }}>
                  집중 흐름을 끊지 않도록, 지금 당장 하지 않을 일은 먼저 queue에 적어둡니다.
                </div>
                <AddInterruptRow onAdd={(payload) => addInterruptMutation.mutateAsync(payload)} />
              </div>

              {pendingInterrupts.length > 0 ? (
                pendingInterrupts.map(interrupt => (
                  <InterruptRow
                    key={interrupt.id}
                    interrupt={interrupt}
                    loadingAction={
                      convertingInterruptId === interrupt.id
                        ? (convertInterruptMutation.variables?.startImmediately ? 'start' : 'plan')
                        : dismissingInterruptId === interrupt.id
                          ? 'dismiss'
                          : null
                    }
                    onConvert={() => convertInterruptMutation.mutate({ id: interrupt.id, startImmediately: false })}
                    onStartNow={() => convertInterruptMutation.mutate({ id: interrupt.id, startImmediately: true })}
                    onDismiss={() => dismissInterruptMutation.mutate(interrupt.id)}
                  />
                ))
              ) : (
                <EmptyState
                  title="기록된 interrupt가 없습니다."
                  description="집중 중 떠오른 일은 여기 잠깐 적어두고 현재 작업 흐름은 유지할 수 있습니다."
                />
              )}
            </Panel>

            <Panel title="차단됨" count={blocked.length}>
              {blocked.length > 0 ? blocked.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  status="BLOCKED"
                  onUnblock={() => unblockMutation.mutate(task.id)}
                  onCancel={() => cancelMutation.mutate(task.id)}
                  loading={unblockingId === task.id}
                />
              )) : (
                <EmptyState
                  title="차단된 작업이 없습니다."
                  description="막힌 작업은 여기로 모아두고, 해제되면 다시 오늘 할 일로 되돌릴 수 있습니다."
                />
              )}
            </Panel>

            <Panel title="집중 분석" action={<span style={{ fontSize: 15, color: 'var(--c-muted)', fontWeight: 600 }}>오늘</span>}>
              <AnalyticsCard elapsed={elapsed} active={Boolean(active)} />
            </Panel>
          </div>
          )}
        </div>
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

function Panel({ title, count, action, children, sectionRef }) {
  return (
    <section ref={sectionRef} style={{
      padding: '24px 26px',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(252,252,250,0.88) 100%)',
      borderRadius: 30,
      border: '1px solid var(--c-border)',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: 20, lineHeight: 1.2, fontWeight: 800, letterSpacing: '-0.04em' }}>{title}</h2>
          {count != null && <span style={{ minWidth: 30, height: 30, padding: '0 10px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(123, 137, 112, 0.08)', color: 'var(--c-muted)', fontSize: 15, fontWeight: 700 }}>{count}</span>}
        </div>
        {action}
      </div>
      <div>{children}</div>
    </section>
  );
}

function FocusGuideCard() {
  return (
    <section style={{
      padding: '24px 26px',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(247,250,245,0.92) 100%)',
      borderRadius: 30,
      border: '1px solid var(--c-border)',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ fontSize: 20, lineHeight: 1.2, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 10 }}>
        오늘 흐름 시작하기
      </div>
      <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--c-muted)', marginBottom: 18 }}>
        오늘 할 일이 아직 비어 있을 때는 가장 먼저 해야 할 일 하나만 적는 쪽이 좋습니다. 집중 중 떠오르는 일은 오른쪽 interrupt queue에 잠깐 보관하세요.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        <GuideStep number="1" title="할 일 추가" description="지금 시작할 작업을 한 줄로 적기" />
        <GuideStep number="2" title="집중 유지" description="급하지 않은 일은 interrupt에 남기기" />
        <GuideStep number="3" title="하루 정리" description="완료하거나 하루 종료로 마무리" />
      </div>
    </section>
  );
}

function GuideStep({ number, title, description }) {
  return (
    <div style={{
      minWidth: 0,
      padding: '16px 14px',
      borderRadius: 22,
      border: '1px solid rgba(126, 141, 116, 0.14)',
      background: 'rgba(255,255,255,0.72)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--c-accent-faint)',
        color: 'var(--c-accent)',
        fontSize: 14,
        fontWeight: 800,
      }}>
        {number}
      </div>
      <div style={{ fontSize: 15, lineHeight: 1.35, fontWeight: 700 }}>
        {title}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--c-muted)' }}>
        {description}
      </div>
    </div>
  );
}

function TopButton({ label, icon, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 58,
        padding: label ? '0 20px' : '0 18px',
        borderRadius: 18,
        border: active ? '1px solid rgba(137,165,125,0.34)' : '1px solid var(--c-border)',
        background: active ? 'var(--c-accent-faint)' : 'rgba(255,255,255,0.72)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        fontWeight: 700,
        fontSize: 16,
        color: active ? 'var(--c-accent-strong)' : 'var(--c-text)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <TopButtonIcon icon={icon} />
      {label}
    </button>
  );
}

function TopButtonIcon({ icon }) {
  if (icon === 'focus') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="10" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M10 3v2.3M17 10h-2.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === 'stop') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="5.8" y="5.8" width="8.4" height="8.4" rx="2.1" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M8.2 3.7h3.6l.5 1.9c.4.1.8.4 1.2.7l1.8-.8 1.7 2.9-1.4 1.4a5.5 5.5 0 0 1 0 2.2l1.4 1.4-1.7 2.9-1.8-.8c-.4.3-.8.6-1.2.7l-.5 1.9H8.2l-.5-1.9a4 4 0 0 1-1.2-.7l-1.8.8L3 14.4l1.4-1.4a5.5 5.5 0 0 1 0-2.2L3 9.4l1.7-2.9 1.8.8c.4-.3.8-.6 1.2-.7l.5-1.9Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function AnalyticsCard({ elapsed, active }) {
  const focusMinutes = Math.max(192, Math.round(elapsed / 60));
  const distractionMinutes = 41;
  const switchCount = 2;
  const total = focusMinutes + distractionMinutes;
  const focusPct = total > 0 ? Math.round((focusMinutes / total) * 100) : 0;
  const circumference = 2 * Math.PI * 68;
  const segments = [
    { value: focusMinutes, color: '#5f95ff' },
    { value: distractionMinutes, color: '#88a67d' },
    { value: 16, color: '#8c63ec' },
  ];
  let offset = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', justifyItems: 'center', gap: 18 }}>
        <div style={{ position: 'relative', width: 180, height: 180 }}>
          <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="90" cy="90" r="68" fill="none" stroke="rgba(123, 137, 112, 0.12)" strokeWidth="10" />
            {segments.map((segment, index) => {
              const length = circumference * (segment.value / segments.reduce((sum, item) => sum + item.value, 0));
              const node = (
                <circle
                  key={index}
                  cx="90"
                  cy="90"
                  r="68"
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="10"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                />
              );
              offset += length;
              return node;
            })}
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.05em' }}>{focusPct}%</div>
            <div style={{ fontSize: 15, color: 'var(--c-muted)' }}>집중 효율</div>
          </div>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <MetricRow color="#5f95ff" label="집중 시간" value={`${Math.floor(focusMinutes / 60)}h ${focusMinutes % 60}m`} />
          <MetricRow color="#88a67d" label="방해 시간" value={`${distractionMinutes}m`} />
          <MetricRow color="#8c63ec" label="전환 횟수" value={`${switchCount}회`} />
        </div>
      </div>

      <div style={{
        padding: '16px 18px',
        borderRadius: 20,
        border: '1px solid var(--c-border)',
        background: 'rgba(255,255,255,0.64)',
        color: 'var(--c-muted)',
        fontSize: 15,
        lineHeight: 1.6,
      }}>
        <span style={{ color: 'var(--c-success)', fontWeight: 700 }}>연속 집중 시간이 어제보다 23분 길어요.</span>
        <br />
        {active ? '좋은 페이스를 유지하고 있어요.' : '다음 세션을 시작하면 흐름을 다시 이어갈 수 있어요.'}
      </div>
    </div>
  );
}

function MetricRow({ color, label, value }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      minWidth: 0,
      padding: '2px 0',
    }}>
      <span style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0, fontSize: 16, color: 'var(--c-muted)', fontWeight: 600 }}>
        {label}
      </span>
      <span style={{ fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
        {value}
      </span>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div style={{
      padding: '18px 0 20px',
      color: 'var(--c-muted)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
      {description && (
        <div style={{ fontSize: 15, lineHeight: 1.55 }}>
          {description}
        </div>
      )}
    </div>
  );
}
