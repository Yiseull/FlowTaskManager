import { useState } from 'react';
import CircleCheck from './CircleCheck';
import FreshnessBadge from './FreshnessBadge';
import Btn from './Btn';

export default function TaskRow({ task, status, onStart, onCancel, onUnblock, loading }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
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
            <FreshnessBadge freshness={task.freshness} count={task.carry_over_count} />
          )}
        </div>
      </div>
      {hover && (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, animation: 'fadeUp 0.1s ease' }}>
          {status === 'PLANNED' && <Btn size="sm" onClick={onStart} loading={loading}>시작</Btn>}
          {status === 'BLOCKED' && <Btn size="sm" variant="secondary" onClick={onUnblock} loading={loading}>해제</Btn>}
          <Btn size="sm" variant="danger-ghost" onClick={onCancel}>취소</Btn>
        </div>
      )}
    </div>
  );
}
