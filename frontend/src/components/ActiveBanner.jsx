import Spinner from './Spinner';

export default function ActiveBanner({ task, elapsed, onComplete, onBlock, loading }) {
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const pad = n => String(n).padStart(2, '0');
  const timeStr = h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;

  return (
    <div style={{
      margin: '0 0 8px', padding: '14px 20px',
      background: 'var(--c-accent-faint)', borderRadius: 12,
      border: '1px solid rgba(74,144,217,0.18)',
      display: 'flex', alignItems: 'center', gap: 16,
      animation: 'slideIn 0.2s ease',
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: 'var(--c-accent)', animation: 'pulse 2s infinite', flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {task.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--c-accent)', fontWeight: 600, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
          {timeStr} 집중 중
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={onComplete}
          disabled={loading === 'complete'}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8, border: 'none',
            background: 'var(--c-accent)', color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {loading === 'complete' ? (
            <Spinner size={12} color="#fff" />
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l2.8 3L10 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              완료
            </>
          )}
        </button>
        <button
          onClick={onBlock}
          disabled={loading === 'block'}
          style={{
            padding: '6px 12px', borderRadius: 8,
            border: '1px solid var(--c-border)', background: '#fff',
            color: 'var(--c-muted)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {loading === 'block' ? <Spinner size={12} /> : '차단됨'}
        </button>
      </div>
    </div>
  );
}
