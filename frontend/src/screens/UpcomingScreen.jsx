import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FreshnessBadge from '../components/FreshnessBadge';
import Btn from '../components/Btn';
import { api, MOCK, shouldUseMockFallback } from '../api';
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

function scheduledDate(task) {
  return task.scheduled_date ?? task.scheduledDate ?? null;
}

function normalizeTasks(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.tasks)) return data.tasks;
  return [];
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateLabel(value) {
  if (!value) return '날짜 없음';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
}

export default function UpcomingScreen({
  active,
  planned = [],
  blocked = [],
  carryOverPending = [],
  onGoToday,
}) {
  const queryClient = useQueryClient();
  const compact = typeof window !== 'undefined' && window.innerWidth < 980;
  const { data: upcomingData, isLoading: upcomingLoading, isError: upcomingError, error: upcomingErrorValue } = useQuery({
    queryKey: ['upcoming'],
    queryFn: () => apiOrMock(() => api.getUpcoming(), MOCK.upcoming),
    retry: false,
  });
  const futureTasks = normalizeTasks(upcomingData);
  const hasPlanned = planned.length > 0;
  const hasBlocked = blocked.length > 0;
  const hasCarryOver = carryOverPending.length > 0;
  const totalPending = planned.length + blocked.length + carryOverPending.length;
  const totalTracked = totalPending + futureTasks.length;
  const staleCount = planned.filter(task => task.freshness === 'STALE').length;
  const warningCount = planned.filter(task => task.freshness === 'WARNING').length;
  const sendToSomedayMutation = useMutation({
    mutationFn: (id) => api.sendTaskToSomeday(id),
    onSuccess: () => {
      toast('언젠가로 보냈어요', 'success');
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['someday'] });
    },
    onError: (e) => toast(e.message, 'error'),
  });
  const moveTodayMutation = useMutation({
    mutationFn: (id) => api.rescheduleTask(id, { scheduledDate: formatLocalDate(new Date()) }),
    onSuccess: () => {
      toast('오늘 계획으로 가져왔어요', 'success');
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming'] });
    },
    onError: (e) => {
      const message = e.code === 'DAILY_TASK_LIMIT' ? '오늘 할 일 한도를 초과했어요' : e.message;
      toast(message, 'error');
    },
  });
  const sendingToSomedayId = sendToSomedayMutation.isPending ? sendToSomedayMutation.variables : null;
  const movingTodayId = moveTodayMutation.isPending ? moveTodayMutation.variables : null;

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: compact ? '24px 18px 24px' : '30px 34px 34px',
    }}>
      <div style={{
        maxWidth: 980,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? 20 : 24,
      }}>
        <section style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : 'minmax(0, 1fr) auto',
          gap: 18,
          alignItems: 'end',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: compact ? 28 : 34, lineHeight: 1.04, fontWeight: 780 }}>
              예정
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--c-muted)', maxWidth: 620 }}>
              오늘 시작할 수 있는 작업과 이후로 잡아둔 일정을 함께 검토합니다. 시작과 전환은 오늘 화면에서 진행합니다.
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: compact ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, 88px)',
            gap: 10,
          }}>
            <StatTile label="예정" value={planned.length} tone="accent" />
            <StatTile label="차단" value={blocked.length} tone="warn" />
            <StatTile label="대기" value={carryOverPending.length} tone="muted" />
            <StatTile label="이후" value={futureTasks.length} tone="accent" />
          </div>
        </section>

        {active && (
          <section style={{
            display: 'flex',
            alignItems: compact ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexDirection: compact ? 'column' : 'row',
            padding: compact ? '18px 18px' : '18px 22px',
            borderRadius: 26,
            border: '1px solid rgba(74,144,217,0.18)',
            background: 'linear-gradient(135deg, rgba(234,243,252,0.82) 0%, rgba(255,255,255,0.78) 100%)',
            boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--c-accent-strong)' }}>
                현재 집중 중
              </div>
              <div style={{
                fontSize: 17,
                lineHeight: 1.4,
                fontWeight: 800,
                color: 'var(--c-text)',
                wordBreak: 'break-word',
              }}>
                {active.title}
              </div>
            </div>
            <Btn variant="secondary" onClick={onGoToday} fullWidth={compact}>오늘 화면으로</Btn>
          </section>
        )}

        <section style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : 'minmax(0, 1.18fr) minmax(300px, 0.82fr)',
          gap: 24,
          alignItems: 'start',
        }}>
          <Panel
            title="시작 대기"
            count={planned.length}
            action={
              staleCount > 0 ? (
                <StatusPill tone="danger">{staleCount}개 방치됨</StatusPill>
              ) : warningCount > 0 ? (
                <StatusPill tone="warn">{warningCount}개 이월</StatusPill>
              ) : (
                <StatusPill tone="accent">시작 가능</StatusPill>
              )
            }
          >
            {hasPlanned ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {planned.map((task, index) => (
                  <PlannedRow
                    key={task.id}
                    task={task}
                    last={index === planned.length - 1}
                    onSendToSomeday={() => sendToSomedayMutation.mutate(task.id)}
                    somedayLoading={sendingToSomedayId === task.id}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="예정된 작업이 없습니다."
                description={hasCarryOver ? '이월 결정 대기 작업을 먼저 처리하면 오늘 계획에 다시 올라옵니다.' : '오늘 화면에서 새 작업을 추가하면 이곳에 PLANNED 작업으로 표시됩니다.'}
              />
            )}
          </Panel>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Panel title="차단됨" count={blocked.length}>
              {hasBlocked ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {blocked.map((task, index) => (
                    <BlockedRow key={task.id} task={task} last={index === blocked.length - 1} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="차단된 작업이 없습니다."
                  description="막힌 작업은 PLANNED와 분리해 두고, 해제되면 다시 오늘 할 일로 돌아옵니다."
                />
              )}
            </Panel>

            <Panel
              title="이월 결정 대기"
              count={carryOverPending.length}
              action={hasCarryOver ? <StatusPill tone="warn">Day Start</StatusPill> : null}
            >
              {hasCarryOver ? (
                <>
                  <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--c-muted)', marginBottom: 8 }}>
                    어제 남은 작업은 아직 오늘 계획에 포함되지 않았습니다. 오늘 화면에서 이월하거나 제거해 주세요.
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {carryOverPending.map((task, index) => (
                      <PendingRow key={task.id} task={task} last={index === carryOverPending.length - 1} />
                    ))}
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <Btn variant="secondary" onClick={onGoToday} fullWidth>오늘에서 결정하기</Btn>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="처리 대기 중인 이월이 없습니다."
                  description="하루 시작 처리가 필요한 작업이 생기면 이곳에 따로 표시됩니다."
                />
              )}
            </Panel>
          </div>
        </section>

        <Panel title="이후 일정" count={futureTasks.length} action={<StatusPill tone="accent">이후</StatusPill>}>
          {upcomingLoading ? (
            <EmptyState title="이후 일정을 불러오는 중입니다." />
          ) : upcomingError ? (
            <EmptyState
              title="이후 일정을 불러오지 못했습니다."
              description={upcomingErrorValue?.message || '잠시 후 다시 시도해 주세요.'}
            />
          ) : futureTasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {futureTasks.map((task, index) => (
                <FutureRow
                  key={task.id}
                  task={task}
                  last={index === futureTasks.length - 1}
                  onMoveToday={() => moveTodayMutation.mutate(task.id)}
                  onSendToSomeday={() => sendToSomedayMutation.mutate(task.id)}
                  todayLoading={movingTodayId === task.id}
                  somedayLoading={sendingToSomedayId === task.id}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="이후로 잡아둔 일정이 없습니다."
              description="미룬 작업이나 다음 날 이후로 배치한 작업이 생기면 이곳에 표시됩니다."
            />
          )}
        </Panel>

        {totalTracked === 0 && (
          <section style={{
            padding: compact ? '24px 20px' : '28px 30px',
            borderRadius: 30,
            border: '1px solid var(--c-border)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(247,250,245,0.92) 100%)',
            boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ fontSize: 20, lineHeight: 1.25, fontWeight: 800, marginBottom: 8 }}>
              오늘 계획이 비어 있습니다.
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--c-muted)', marginBottom: 18, maxWidth: 560 }}>
              새 작업을 만들거나 바로 시작하려면 오늘 화면에서 집중 흐름을 시작하세요.
            </div>
            <Btn onClick={onGoToday} fullWidth={compact}>오늘 화면으로 이동</Btn>
          </section>
        )}
      </div>
    </div>
  );
}

function Panel({ title, count, action, children }) {
  return (
    <section style={{
      padding: '24px 26px',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(252,252,250,0.88) 100%)',
      borderRadius: 30,
      border: '1px solid var(--c-border)',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <h2 style={{ fontSize: 20, lineHeight: 1.2, fontWeight: 800, whiteSpace: 'nowrap' }}>{title}</h2>
          {count != null && (
            <span style={{
              minWidth: 30,
              height: 30,
              padding: '0 10px',
              borderRadius: 999,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(123, 137, 112, 0.08)',
              color: 'var(--c-muted)',
              fontSize: 15,
              fontWeight: 700,
            }}>
              {count}
            </span>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function PlannedRow({ task, last, onSendToSomeday, somedayLoading }) {
  const compact = typeof window !== 'undefined' && window.innerWidth < 720;

  return (
    <div style={{
      display: 'flex',
      alignItems: compact ? 'flex-start' : 'center',
      gap: 14,
      flexWrap: compact ? 'wrap' : 'nowrap',
      padding: '17px 0',
      borderBottom: last ? 'none' : '1px solid rgba(123, 137, 112, 0.12)',
    }}>
      <div style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: task.freshness === 'STALE' ? 'var(--c-danger-bg)' : task.freshness === 'WARNING' ? 'var(--c-warn-bg)' : 'var(--c-accent-faint)',
        color: task.freshness === 'STALE' ? 'var(--c-danger)' : task.freshness === 'WARNING' ? 'var(--c-warn)' : 'var(--c-accent-strong)',
      }}>
        <CalendarIcon />
      </div>

      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 17, lineHeight: 1.4, fontWeight: 750, color: 'var(--c-text)', wordBreak: 'break-word' }}>
            {task.title}
          </span>
          <FreshnessBadge freshness={task.freshness} count={carryOverCount(task)} />
        </div>
        <div style={{ fontSize: 14, color: 'var(--c-muted)', lineHeight: 1.45 }}>
          {carryOverCount(task) > 0 ? `${carryOverCount(task)}회 이월된 PLANNED 작업` : '오늘 시작 가능한 PLANNED 작업'}
        </div>
      </div>
      <div style={{
        display: 'flex',
        flexShrink: 0,
        justifyContent: compact ? 'flex-end' : 'flex-start',
        width: compact ? '100%' : 'auto',
      }}>
        <Btn size="sm" variant="secondary" onClick={onSendToSomeday} loading={somedayLoading}>
          언젠가로
        </Btn>
      </div>
    </div>
  );
}

function FutureRow({ task, last, onMoveToday, onSendToSomeday, todayLoading, somedayLoading }) {
  const compact = typeof window !== 'undefined' && window.innerWidth < 720;
  const status = task.status || task.task_status || task.taskStatus || 'PLANNED';
  const planned = status === 'PLANNED';

  return (
    <div style={{
      display: 'flex',
      alignItems: compact ? 'flex-start' : 'center',
      gap: 14,
      flexWrap: compact ? 'wrap' : 'nowrap',
      padding: '17px 0',
      borderBottom: last ? 'none' : '1px solid rgba(123, 137, 112, 0.12)',
    }}>
      <div style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: planned ? 'var(--c-accent-faint)' : 'var(--c-warn-bg)',
        color: planned ? 'var(--c-accent-strong)' : 'var(--c-warn)',
      }}>
        {planned ? <CalendarIcon /> : <LockIcon />}
      </div>

      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 17, lineHeight: 1.4, fontWeight: 750, color: 'var(--c-text)', wordBreak: 'break-word' }}>
            {task.title}
          </span>
          <StatusPill tone={planned ? 'accent' : 'warn'}>{status}</StatusPill>
          <FreshnessBadge freshness={task.freshness} count={carryOverCount(task)} />
        </div>
        <div style={{ fontSize: 14, color: 'var(--c-muted)', lineHeight: 1.45 }}>
          {formatDateLabel(scheduledDate(task))}
        </div>
      </div>

      {planned && (
        <div style={{
          display: 'flex',
          gap: 8,
          flexShrink: 0,
          flexWrap: 'wrap',
          justifyContent: compact ? 'flex-end' : 'flex-start',
          width: compact ? '100%' : 'auto',
        }}>
          <Btn size="sm" variant="secondary" onClick={onMoveToday} loading={todayLoading}>오늘로</Btn>
          <Btn size="sm" variant="secondary" onClick={onSendToSomeday} loading={somedayLoading}>언젠가로</Btn>
        </div>
      )}
    </div>
  );
}

function BlockedRow({ task, last }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 13,
      padding: '16px 0',
      borderBottom: last ? 'none' : '1px solid rgba(123, 137, 112, 0.12)',
    }}>
      <div style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(174,138,61,0.11)',
        color: 'var(--c-warn)',
      }}>
        <LockIcon />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 16, lineHeight: 1.4, fontWeight: 720, color: 'var(--c-text)', wordBreak: 'break-word' }}>
          {task.title}
        </div>
        <div style={{ fontSize: 14, color: 'var(--c-muted)', lineHeight: 1.45, marginTop: 4 }}>
          차단 해제 전까지 시작 목록과 분리됩니다.
        </div>
      </div>
    </div>
  );
}

function PendingRow({ task, last }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 0',
      borderBottom: last ? 'none' : '1px solid rgba(123, 137, 112, 0.12)',
    }}>
      <div style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(123, 137, 112, 0.08)',
        color: 'var(--c-muted)',
        fontSize: 13,
        fontWeight: 900,
      }}>
        ?
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 15, lineHeight: 1.45, fontWeight: 720, color: 'var(--c-text)', wordBreak: 'break-word' }}>
          {task.title}
        </div>
        {task.freshness && task.freshness !== 'NORMAL' && (
          <div style={{ marginTop: 6 }}>
            <FreshnessBadge freshness={task.freshness} count={carryOverCount(task)} />
          </div>
        )}
      </div>
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
      {description && <div style={{ fontSize: 15, lineHeight: 1.55 }}>{description}</div>}
    </div>
  );
}

function StatTile({ label, value, tone }) {
  const colors = {
    accent: ['var(--c-accent-faint)', 'var(--c-accent-strong)'],
    warn: ['var(--c-warn-bg)', 'var(--c-warn)'],
    muted: ['rgba(123,137,112,0.08)', 'var(--c-muted)'],
  };
  const [background, color] = colors[tone] || colors.muted;

  return (
    <div style={{
      minWidth: 0,
      padding: '14px 12px',
      borderRadius: 22,
      background,
      border: '1px solid rgba(126, 141, 116, 0.12)',
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
    }}>
      <div style={{ fontSize: 24, lineHeight: 1, fontWeight: 850, color }}>
        {value}
      </div>
      <div style={{ fontSize: 13, fontWeight: 750, color: 'var(--c-muted)' }}>
        {label}
      </div>
    </div>
  );
}

function StatusPill({ tone = 'muted', children }) {
  const styles = {
    accent: ['var(--c-accent-faint)', 'var(--c-accent-strong)', 'rgba(74,144,217,0.18)'],
    warn: ['var(--c-warn-bg)', 'var(--c-warn)', 'var(--c-warn-border)'],
    danger: ['var(--c-danger-bg)', 'var(--c-danger)', '#F9C0C0'],
    muted: ['rgba(123,137,112,0.08)', 'var(--c-muted)', 'rgba(126,141,116,0.14)'],
  };
  const [background, color, border] = styles[tone] || styles.muted;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 32,
      padding: '0 12px',
      borderRadius: 999,
      border: `1px solid ${border}`,
      background,
      color,
      fontSize: 12,
      fontWeight: 850,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

function CalendarIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <rect x="3.5" y="4.5" width="13" height="12" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M6.5 2.9v3M13.5 2.9v3M3.5 8.2h13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <rect x="4.5" y="8.3" width="11" height="8" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7.1 8.3V6.6a2.9 2.9 0 0 1 5.8 0v1.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
