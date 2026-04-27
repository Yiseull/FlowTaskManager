export default function FreshnessBadge({ freshness, count }) {
  if (!freshness || freshness === 'NORMAL') return null;
  const stale = freshness === 'STALE';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 99,
      background: stale ? 'var(--c-danger-bg)' : 'var(--c-warn-bg)',
      color: stale ? 'var(--c-danger)' : 'var(--c-warn)',
      border: `1px solid ${stale ? '#F9C0C0' : 'var(--c-warn-border)'}`,
    }}>
      {stale ? '방치됨' : `${count}회 이월`}
    </span>
  );
}
