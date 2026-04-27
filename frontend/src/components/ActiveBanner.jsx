import Spinner from './Spinner';

export default function ActiveBanner({ task, elapsed, onComplete, onBlock, onSwitch, loading }) {
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const pad = n => String(n).padStart(2, '0');
  const timeStr = h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;

  return (
    <div style={{
      padding: '24px',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(248,251,246,0.86) 100%)',
      borderRadius: 30,
      border: '1px solid var(--c-border)',
      boxShadow: 'var(--shadow-card)',
      display: 'flex',
      flexDirection: typeof window !== 'undefined' && window.innerWidth < 1160 ? 'column' : 'row',
      alignItems: 'stretch',
      gap: 18,
      animation: 'slideIn 0.2s ease',
    }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 999, background: 'var(--c-accent-faint)', color: 'var(--c-accent-strong)', width: 'fit-content', fontSize: 14, fontWeight: 700 }}>
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--c-success)', animation: 'pulse 2s infinite', flexShrink: 0 }} />
          집중 중
        </div>
        <div style={{ fontSize: 22, lineHeight: 1.32, fontWeight: 800, letterSpacing: '-0.04em' }}>
          {task.title}
        </div>
        <div style={{ fontSize: 60, lineHeight: 1, letterSpacing: '-0.06em', color: 'var(--c-accent)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{timeStr}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320 }}>
          <div style={{ height: 8, borderRadius: 999, background: 'rgba(120, 149, 108, 0.14)', overflow: 'hidden' }}>
            <div style={{ width: '53%', height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, var(--c-accent) 0%, #a7bc9b 100%)' }} />
          </div>
          <span style={{ fontSize: 15, color: 'var(--c-muted)' }}>53% 진행</span>
        </div>
      </div>
      <div style={{ width: typeof window !== 'undefined' && window.innerWidth < 1160 ? '100%' : 230, display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
        <ActionButton primary onClick={onComplete} loading={loading === 'complete'} icon="check">완료</ActionButton>
        <ActionButton onClick={onBlock} loading={loading === 'block'} icon="ban">차단됨</ActionButton>
        <ActionButton icon="switch" onClick={onSwitch}>다른 작업으로 전환</ActionButton>
      </div>
    </div>
  );
}

function ActionButton({ children, onClick, loading, icon, primary, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        minHeight: 54,
        padding: '0 18px',
        borderRadius: 18,
        border: primary ? 'none' : '1px solid var(--c-border)',
        background: primary ? 'linear-gradient(180deg, #9eb391 0%, #88a37e 100%)' : 'rgba(255,255,255,0.76)',
        color: primary ? '#fff' : 'var(--c-text)',
        fontSize: 15,
        fontWeight: 700,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        boxShadow: primary ? '0 16px 30px rgba(137, 165, 125, 0.22)' : 'none',
      }}
    >
      {loading ? <Spinner size={14} color={primary ? '#fff' : 'var(--c-text)'} /> : <ActionIcon icon={icon} primary={primary} />}
      {children}
    </button>
  );
}

function ActionIcon({ icon, primary }) {
  const color = primary ? '#fff' : 'currentColor';
  if (icon === 'check') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 8.2 6.3 11.4 13 4.8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (icon === 'ban') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.8" />
        <path d="M4.8 11.2 11.2 4.8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4.2 2.8 7.5 6 10.8M10 5.2l3.2 3.3-3.2 3.3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
