import { useState } from 'react';
import Spinner from './Spinner';

export default function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, loading, fullWidth }) {
  const [hover, setHover] = useState(false);

  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    fontFamily: 'inherit', fontWeight: 600, border: 'none', borderRadius: 8,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : undefined,
    fontSize: size === 'sm' ? 12 : 14,
    padding: size === 'sm' ? '5px 11px' : '9px 18px',
  };

  const variants = {
    primary:      { background: hover ? 'var(--c-accent-hover)' : 'var(--c-accent)', color: '#fff' },
    secondary:    { background: hover ? 'var(--c-hover)' : '#fff', color: 'var(--c-text)', border: '1px solid var(--c-border)' },
    ghost:        { background: hover ? 'var(--c-hover)' : 'transparent', color: 'var(--c-text)' },
    'danger-ghost': { background: hover ? 'var(--c-danger-bg)' : 'transparent', color: 'var(--c-danger)' },
  };

  return (
    <button
      disabled={disabled || loading}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...variants[variant] }}
    >
      {loading ? <Spinner size={13} /> : children}
    </button>
  );
}
