import { useState } from 'react';
import CircleCheck from './CircleCheck';
import FreshnessBadge from './FreshnessBadge';
import Btn from './Btn';

function carryOverCount(task) {
  return task.carry_over_count ?? task.carryOverCount ?? 0;
}

export default function TaskRow({ task, status, onStart, onCancel, onUnblock, onSendToSomeday, loading, somedayLoading }) {
  const [hover, setHover] = useState(false);
  const compact = typeof window !== 'undefined' && window.innerWidth < 720;
  const showActions = hover || compact;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        flexWrap: compact ? 'wrap' : 'nowrap',
        padding: '16px 0', minHeight: 68, borderRadius: 8,
        background: hover ? 'var(--c-hover)' : 'transparent',
        transition: 'background 0.1s', cursor: 'default',
        borderBottom: '1px solid rgba(123, 137, 112, 0.12)',
      }}
    >
      <CircleCheck blocked={status === 'BLOCKED'} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 17, fontWeight: 600, color: status === 'BLOCKED' ? 'var(--c-muted)' : 'var(--c-text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {task.title}
          </span>
          {task.freshness && task.freshness !== 'NORMAL' && (
            <FreshnessBadge freshness={task.freshness} count={carryOverCount(task)} />
          )}
        </div>
      </div>
      {showActions && (
        <div style={{
          display: 'flex',
          gap: 8,
          flexShrink: 0,
          flexWrap: 'wrap',
          justifyContent: compact ? 'flex-end' : 'flex-start',
          marginLeft: compact ? 44 : 0,
          width: compact ? 'calc(100% - 44px)' : 'auto',
          animation: 'fadeUp 0.1s ease',
        }}>
          {status === 'PLANNED' && <Btn size="sm" onClick={onStart} loading={loading}>시작</Btn>}
          {status === 'PLANNED' && onSendToSomeday && (
            <Btn size="sm" variant="secondary" onClick={onSendToSomeday} loading={somedayLoading}>언젠가로</Btn>
          )}
          {status === 'BLOCKED' && <Btn size="sm" variant="secondary" onClick={onUnblock} loading={loading}>해제</Btn>}
          <Btn size="sm" variant="danger-ghost" onClick={onCancel}>취소</Btn>
        </div>
      )}
    </div>
  );
}
