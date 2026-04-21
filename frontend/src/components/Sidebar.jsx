const NAV_ITEMS = [
  { id: 'today',    label: '오늘',   icon: '☀' },
  { id: 'upcoming', label: '예정',   icon: '□' },
  { id: 'anytime',  label: '언젠가', icon: '○' },
  { id: 'logbook',  label: '완료됨', icon: '✓' },
];

export default function Sidebar({ activeNav, onNav, completedCount, pendingCount, onDayEnd }) {
  return (
    <div style={{ width: 220, background: 'var(--sidebar-bg)', display: 'flex', flexDirection: 'column', flexShrink: 0, userSelect: 'none' }}>
      {/* Traffic lights */}
      <div style={{ padding: '20px 20px 8px', display: 'flex', gap: 8 }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
        ))}
      </div>

      {/* App title */}
      <div style={{ padding: '10px 20px 18px' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--sidebar-text)' }}>Flow</div>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 10px', flex: 1 }}>
        {NAV_ITEMS.map(item => {
          const sel = item.id === activeNav;
          const badge = item.id === 'today' ? pendingCount : item.id === 'logbook' ? completedCount : null;
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 12px', borderRadius: 8, border: 'none',
                background: sel ? 'var(--sidebar-sel)' : 'transparent',
                cursor: 'pointer', width: '100%', textAlign: 'left',
                fontFamily: 'inherit', transition: 'background 0.12s',
              }}
              onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'var(--sidebar-hover)'; }}
              onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 14, opacity: 0.85, width: 18, textAlign: 'center', color: 'var(--sidebar-text)' }}>{item.icon}</span>
              <span style={{ fontSize: 14, fontWeight: sel ? 600 : 500, color: 'var(--sidebar-text)', flex: 1 }}>{item.label}</span>
              {badge > 0 && (
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--sidebar-text)', opacity: 0.75, minWidth: 20, textAlign: 'right' }}>{badge}</span>
              )}
            </button>
          );
        })}

        <div style={{ height: 1, background: 'rgba(255,255,255,0.18)', margin: '10px 4px' }} />

        <button
          onClick={onDayEnd}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 12px', borderRadius: 8, border: 'none',
            background: 'transparent', cursor: 'pointer', width: '100%',
            textAlign: 'left', fontFamily: 'inherit',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ fontSize: 14, width: 18, textAlign: 'center', color: 'var(--sidebar-text)', opacity: 0.7 }}>⏹</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--sidebar-text)' }}>하루 종료</span>
        </button>
      </div>

      {/* Settings */}
      <div style={{ padding: '10px 10px 20px' }}>
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 12px', borderRadius: 8, border: 'none',
            background: 'transparent', cursor: 'pointer', width: '100%', fontFamily: 'inherit',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ fontSize: 14, width: 18, textAlign: 'center', color: 'var(--sidebar-text)', opacity: 0.7 }}>⚙</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--sidebar-text)' }}>설정</span>
        </button>
      </div>
    </div>
  );
}
