import { useQuery } from '@tanstack/react-query';
import { api, MOCK, shouldUseSomedayMockFallback } from '../api';
import FreshnessBadge from '../components/FreshnessBadge';
import Spinner from '../components/Spinner';

async function apiOrMock(fn, mockData) {
  try { return await fn(); }
  catch (e) {
    if (shouldUseSomedayMockFallback(e)) return mockData;
    throw e;
  }
}

function normalizeTasks(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.tasks)) return data.tasks;
  return [];
}

function taskStatus(task) {
  return task.status || task.task_status || task.taskStatus || 'PLANNED';
}

function carryOverCount(task) {
  return task.carry_over_count ?? task.carryOverCount ?? 0;
}

function scheduledDate(task) {
  return task.scheduled_date ?? task.scheduledDate ?? null;
}

const STATUS_COPY = {
  PLANNED: {
    label: 'PLANNED',
    description: '시작 후보',
    helper: '오늘 계획 밖에 보관된 작업',
    tone: 'accent',
  },
  BLOCKED: {
    label: 'BLOCKED',
    description: '차단됨',
    helper: '막힌 이유가 풀릴 때까지 보관',
    tone: 'warn',
  },
  IN_PROGRESS: {
    label: 'IN_PROGRESS',
    description: '진행 중',
    helper: '현재 집중 흐름은 오늘 화면에서만 관리합니다.',
    tone: 'accent',
  },
  COMPLETED: {
    label: 'COMPLETED',
    description: '완료됨',
    helper: '완료된 기록',
    tone: 'success',
  },
  CANCELLED: {
    label: 'CANCELLED',
    description: '취소됨',
    helper: '취소된 기록',
    tone: 'muted',
  },
};

export default function SomedayScreen() {
  const compact = typeof window !== 'undefined' && window.innerWidth < 980;
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['someday'],
    queryFn: () => apiOrMock(() => api.getSomeday(), MOCK.someday),
    retry: false,
  });

  const tasks = normalizeTasks(data);
  const plannedCount = tasks.filter(task => taskStatus(task) === 'PLANNED').length;
  const blockedCount = tasks.filter(task => taskStatus(task) === 'BLOCKED').length;
  const otherCount = Math.max(0, tasks.length - plannedCount - blockedCount);

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: compact ? '24px 18px 24px' : '30px 34px 34px',
    }}>
      <div style={{
        maxWidth: 940,
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
              언젠가
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--c-muted)', maxWidth: 620 }}>
              오늘 시작하지 않을 작업을 보관합니다. 급하지 않은 후보와 막힌 작업을 현재 집중 흐름과 분리해 둡니다.
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: compact ? 'repeat(3, minmax(0, 1fr))' : 'repeat(3, 92px)',
            gap: 10,
          }}>
            <StatTile label="전체" value={tasks.length} tone="muted" />
            <StatTile label="계획" value={plannedCount} tone="accent" />
            <StatTile label="차단" value={blockedCount} tone="warn" />
          </div>
        </section>

        <section style={{
          padding: compact ? '18px 18px' : '20px 24px',
          borderRadius: 28,
          border: '1px solid rgba(74,144,217,0.16)',
          background: 'linear-gradient(135deg, rgba(234,243,252,0.78) 0%, rgba(255,255,255,0.82) 100%)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          alignItems: compact ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: 14,
          flexDirection: compact ? 'column' : 'row',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ fontSize: 14, fontWeight: 850, color: 'var(--c-accent-strong)' }}>
              보관함 모드
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--c-muted)' }}>
              상태와 맥락만 가볍게 확인합니다. 오늘 할 일은 오늘 화면에서 별도로 관리합니다.
            </div>
          </div>
          <StatusPill tone="accent">보관함</StatusPill>
        </section>

        <Panel
          title="보관된 작업"
          count={tasks.length}
          action={otherCount > 0 ? <StatusPill tone="muted">기타 {otherCount}</StatusPill> : null}
        >
          {isLoading ? (
            <LoadingState />
          ) : isError ? (
            <EmptyState
              title="언젠가 작업을 불러오지 못했습니다."
              description={error?.message || '잠시 후 다시 시도해 주세요.'}
            />
          ) : tasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {tasks.map((task, index) => (
                <SomedayRow key={task.id || `${task.title}-${index}`} task={task} last={index === tasks.length - 1} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="보관된 작업이 없습니다."
              description="오늘 처리하지 않을 아이디어나 다음 집중 후보가 생기면 이곳에 PLANNED 또는 BLOCKED 상태로 표시됩니다."
              spacious
            />
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, count, action, children }) {
  return (
    <section style={{
      padding: '24px 26px',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(252,252,250,0.9) 100%)',
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

function SomedayRow({ task, last }) {
  const status = taskStatus(task);
  const copy = STATUS_COPY[status] || {
    label: status,
    description: '상태 확인',
    helper: '보관된 상태',
    tone: 'muted',
  };
  const date = scheduledDate(task);
  const description = task.description || task.note || null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      padding: '18px 0',
      borderBottom: last ? 'none' : '1px solid rgba(123, 137, 112, 0.12)',
    }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: iconBackground(copy.tone),
        color: iconColor(copy.tone),
      }}>
        {status === 'BLOCKED' ? <LockIcon /> : <CircleIcon />}
      </div>

      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 17,
            lineHeight: 1.4,
            fontWeight: 760,
            color: 'var(--c-text)',
            wordBreak: 'break-word',
          }}>
            {task.title}
          </span>
          <StatusPill tone={copy.tone}>{copy.label}</StatusPill>
          <FreshnessBadge freshness={task.freshness} count={carryOverCount(task)} />
        </div>

        {description && (
          <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--c-muted)', wordBreak: 'break-word' }}>
            {description}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <MetaPill>{copy.description}</MetaPill>
          <MetaPill>{copy.helper}</MetaPill>
          {date && <MetaPill>{date}</MetaPill>}
          {carryOverCount(task) > 0 && <MetaPill>{carryOverCount(task)}회 이월</MetaPill>}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{
      minHeight: 180,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--c-muted)',
    }}>
      <Spinner size={22} color="var(--c-accent)" />
    </div>
  );
}

function EmptyState({ title, description, spacious }) {
  return (
    <div style={{
      padding: spacious ? '28px 0 32px' : '18px 0 20px',
      color: 'var(--c-muted)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ fontSize: 16, fontWeight: 750, color: 'var(--c-text)' }}>{title}</div>
      {description && (
        <div style={{ fontSize: 15, lineHeight: 1.55, maxWidth: 620 }}>
          {description}
        </div>
      )}
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
    success: ['rgba(127,160,111,0.12)', 'var(--c-success)', 'rgba(127,160,111,0.22)'],
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

function MetaPill({ children }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      minHeight: 28,
      padding: '5px 10px',
      borderRadius: 999,
      background: 'rgba(123,137,112,0.07)',
      color: 'var(--c-muted)',
      fontSize: 13,
      fontWeight: 700,
      lineHeight: 1.25,
    }}>
      {children}
    </span>
  );
}

function iconBackground(tone) {
  if (tone === 'warn') return 'rgba(174,138,61,0.11)';
  if (tone === 'success') return 'rgba(127,160,111,0.12)';
  if (tone === 'accent') return 'var(--c-accent-faint)';
  return 'rgba(123,137,112,0.08)';
}

function iconColor(tone) {
  if (tone === 'warn') return 'var(--c-warn)';
  if (tone === 'success') return 'var(--c-success)';
  if (tone === 'accent') return 'var(--c-accent-strong)';
  return 'var(--c-muted)';
}

function CircleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="6.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="10" cy="10" r="2" fill="currentColor" />
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
