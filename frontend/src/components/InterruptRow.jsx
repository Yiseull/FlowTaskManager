import { useState } from 'react';
import Btn from './Btn';

const PRIORITY_META = {
  HIGH: { label: '높음', color: 'var(--c-danger)', bg: 'rgba(199,104,104,0.1)' },
  MEDIUM: { label: '보통', color: 'var(--c-warn)', bg: 'rgba(174,138,61,0.12)' },
  LOW: { label: '낮음', color: 'var(--c-accent-strong)', bg: 'rgba(137,165,125,0.12)' },
};

export default function InterruptRow({ interrupt, onConvert, onStartNow, onDismiss, loadingAction }) {
  const [hover, setHover] = useState(false);
  const meta = PRIORITY_META[interrupt.priority] || PRIORITY_META.LOW;
  const compact = typeof window !== 'undefined' && window.innerWidth < 720;
  const showActions = hover || compact || loadingAction;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 0',
        minHeight: 68,
        borderBottom: '1px solid rgba(174,138,61,0.12)',
      }}
    >
      <div style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: meta.color,
        boxShadow: `0 0 0 5px ${meta.bg}`,
        flexShrink: 0,
        marginLeft: 6,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--c-text)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {interrupt.title}
          </span>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: meta.color,
            background: meta.bg,
            borderRadius: 999,
            padding: '4px 8px',
            flexShrink: 0,
          }}>
            {meta.label}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>
          {formatRelative(interrupt.createdAt)}
        </div>
      </div>
      {showActions && (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, animation: 'fadeUp 0.12s ease' }}>
          <Btn size="sm" variant="secondary" onClick={onConvert} loading={loadingAction === 'plan'}>목록에 추가</Btn>
          <Btn size="sm" onClick={onStartNow} loading={loadingAction === 'start'}>지금 시작</Btn>
          <Btn size="sm" variant="danger-ghost" onClick={onDismiss} loading={loadingAction === 'dismiss'}>닫기</Btn>
        </div>
      )}
    </div>
  );
}

function formatRelative(value) {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (diffSeconds < 60) return '방금 기록됨';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}분 전 기록`;
  return `${Math.floor(diffSeconds / 3600)}시간 전 기록`;
}
