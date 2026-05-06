const NAV_ITEMS = [
  { id: 'today', label: '오늘', icon: 'sun' },
  { id: 'upcoming', label: '예정', icon: 'calendar' },
  { id: 'anytime', label: '언젠가', icon: 'circle' },
  { id: 'logbook', label: '완료됨', icon: 'check' },
];

export default function Sidebar({ activeNav, onNav, completedCount, pendingCount, onDayEnd, onSettings }) {
  const compact = typeof window !== 'undefined' && window.innerWidth < 980;
  const dayEndSel = activeNav === 'day-end';
  const iconButtonStyle = {
    width: 38,
    height: 38,
    borderRadius: 19,
    border: '1px solid rgba(255,255,255,0.16)',
    background: 'rgba(255,255,255,0.1)',
    color: 'var(--sidebar-text)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
  };
  const dayEndIconButtonStyle = {
    ...iconButtonStyle,
    background: dayEndSel ? 'var(--sidebar-sel)' : iconButtonStyle.background,
    boxShadow: dayEndSel ? 'inset 0 1px 0 rgba(255,255,255,0.16)' : 'none',
  };

  return (
    <div style={{
      width: compact ? '100%' : 266,
      background: 'var(--sidebar-bg)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      userSelect: 'none',
      padding: compact ? '10px 10px 9px' : '18px 18px 20px',
      borderRight: compact ? 'none' : '1px solid rgba(255,255,255,0.18)',
      borderBottom: compact ? '1px solid rgba(255,255,255,0.18)' : 'none',
      gap: compact ? 9 : 0,
    }}>
      <div style={{
        padding: compact ? '2px 2px 0' : '10px 12px 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: compact ? 'space-between' : 'flex-start',
        gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c, i) => (
              <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
            ))}
          </div>
          {compact && (
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--sidebar-text)' }}>Flow</div>
          )}
        </div>

        {compact && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              aria-label="하루 종료"
              onClick={onDayEnd}
              style={dayEndIconButtonStyle}
              onMouseEnter={e => { if (!dayEndSel) e.currentTarget.style.background = 'var(--sidebar-hover)'; }}
              onMouseLeave={e => { if (!dayEndSel) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            >
              <SidebarIcon icon="stop" />
            </button>
            <button
              aria-label="설정"
              onClick={onSettings}
              style={iconButtonStyle}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--sidebar-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <SidebarIcon icon="settings" />
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: '12px 12px 20px', display: compact ? 'none' : 'block' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--sidebar-text)', letterSpacing: '-0.04em' }}>Flow</div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: compact ? 'row' : 'column',
        flexWrap: compact ? 'wrap' : 'nowrap',
        gap: compact ? 5 : 6,
        padding: compact ? '0' : '0 0 10px',
        flex: compact ? '0 0 auto' : 1,
        overflowX: 'visible',
      }}>
        {NAV_ITEMS.map(item => {
          const sel = item.id === activeNav;
          const badge = item.id === 'today' ? pendingCount : item.id === 'logbook' ? completedCount : null;
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                justifyContent: compact ? 'center' : 'flex-start',
                padding: compact ? '9px 6px' : '14px 16px', borderRadius: compact ? 16 : 18, border: '1px solid transparent',
                background: sel ? 'var(--sidebar-sel)' : 'transparent',
                cursor: 'pointer', width: compact ? 'auto' : '100%', textAlign: 'left',
                minWidth: compact ? 72 : 'auto',
                flex: compact ? '1 1 72px' : '0 0 auto',
                fontFamily: 'inherit', transition: 'all 0.16s',
                backdropFilter: sel ? 'blur(8px)' : 'none',
                boxShadow: sel ? 'inset 0 1px 0 rgba(255,255,255,0.16)' : 'none',
              }}
              onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'var(--sidebar-hover)'; }}
              onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{
                width: compact ? 22 : 26,
                height: compact ? 22 : 26,
                borderRadius: compact ? 11 : 13,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--sidebar-text)',
                background: sel ? 'rgba(255,255,255,0.18)' : 'transparent',
              }}>
                <SidebarIcon icon={item.icon} />
              </span>
              <span style={{
                fontSize: compact ? 12.5 : 15,
                fontWeight: sel ? 700 : 600,
                color: 'var(--sidebar-text)',
                flex: compact ? '0 1 auto' : 1,
                whiteSpace: 'nowrap',
              }}>{item.label}</span>
              {badge > 0 && (
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--sidebar-text)',
                  minWidth: 28,
                  textAlign: 'center',
                  padding: '4px 8px',
                  borderRadius: 999,
                  background: sel ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)',
                }}>{badge}</span>
              )}
            </button>
          );
        })}

        {!compact && <div style={{ height: 1, background: 'rgba(255,255,255,0.18)', margin: '10px 8px 14px' }} />}

        {!compact && <button
          onClick={onDayEnd}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 16px', borderRadius: 18, border: '1px solid transparent',
            background: dayEndSel ? 'var(--sidebar-sel)' : 'transparent',
            cursor: 'pointer', width: '100%',
            textAlign: 'left', fontFamily: 'inherit',
            transition: 'all 0.16s',
            backdropFilter: dayEndSel ? 'blur(8px)' : 'none',
            boxShadow: dayEndSel ? 'inset 0 1px 0 rgba(255,255,255,0.16)' : 'none',
          }}
          onMouseEnter={e => { if (!dayEndSel) e.currentTarget.style.background = 'var(--sidebar-hover)'; }}
          onMouseLeave={e => { if (!dayEndSel) e.currentTarget.style.background = 'transparent'; }}
        >
          <span style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--sidebar-text)',
            background: dayEndSel ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
          }}>
            <SidebarIcon icon="stop" />
          </span>
          <span style={{ fontSize: 15, fontWeight: dayEndSel ? 700 : 600, color: 'var(--sidebar-text)' }}>하루 종료</span>
        </button>}
      </div>

      <div style={{ padding: '12px 0 0', display: compact ? 'none' : 'block' }}>
        <button
          onClick={onSettings}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 16px', borderRadius: 18, border: 'none',
            background: 'transparent', cursor: 'pointer', width: '100%', fontFamily: 'inherit',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--sidebar-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--sidebar-text)',
            background: 'rgba(255,255,255,0.08)',
          }}>
            <SidebarIcon icon="settings" />
          </span>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--sidebar-text)' }}>설정</span>
        </button>
      </div>
    </div>
  );
}

function SidebarIcon({ icon }) {
  const props = { width: 15, height: 15, viewBox: '0 0 20 20', fill: 'none' };

  if (icon === 'sun') {
    return (
      <svg {...props}>
        <circle cx="10" cy="10" r="3.2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10 2.5v2.1M10 15.4v2.1M17.5 10h-2.1M4.6 10H2.5M15.3 4.7l-1.5 1.5M6.2 13.8l-1.5 1.5M15.3 15.3l-1.5-1.5M6.2 6.2L4.7 4.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === 'calendar') {
    return (
      <svg {...props}>
        <rect x="3.5" y="4.5" width="13" height="12" rx="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M6.5 2.8v3M13.5 2.8v3M3.5 8h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === 'check') {
    return (
      <svg {...props}>
        <path d="M5.3 10.3 8.6 13.5 14.8 6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (icon === 'stop') {
    return (
      <svg {...props}>
        <rect x="5" y="5" width="10" height="10" rx="2.4" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (icon === 'settings') {
    return (
      <svg {...props}>
        <path d="M8.1 3.6h3.8l.5 2a5.1 5.1 0 0 1 1.3.8l1.9-.8 1.9 3.2-1.4 1.5c.1.4.1.8.1 1.2s0 .8-.1 1.2l1.4 1.5-1.9 3.2-1.9-.8c-.4.3-.8.5-1.3.8l-.5 2H8.1l-.5-2a5.1 5.1 0 0 1-1.3-.8l-1.9.8-1.9-3.2 1.4-1.5a6 6 0 0 1 0-2.4L2.5 8.8l1.9-3.2 1.9.8c.4-.3.8-.5 1.3-.8l.5-2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <circle cx="10" cy="10" r="6.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
