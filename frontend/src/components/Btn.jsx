import { useState } from 'react';
import Spinner from './Spinner';

export default function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, loading, fullWidth, type = 'button' }) {
  const [hover, setHover] = useState(false);

  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    fontFamily: 'inherit', fontWeight: 700, border: '1px solid transparent', borderRadius: 16,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : undefined,
    fontSize: size === 'sm' ? 13 : 14,
    padding: size === 'sm' ? '9px 14px' : '12px 18px',
    boxShadow: variant === 'primary' ? '0 12px 24px rgba(133, 160, 120, 0.16)' : 'none',
  };

  const variants = {
    primary: { background: hover ? 'var(--c-accent-hover)' : 'var(--c-accent)', color: '#fff' },
    secondary: { background: hover ? 'var(--c-hover)' : 'rgba(255,255,255,0.76)', color: 'var(--c-text)', border: '1px solid var(--c-border)' },
    ghost: { background: hover ? 'var(--c-hover)' : 'transparent', color: 'var(--c-text)' },
    'danger-ghost': { background: hover ? 'var(--c-danger-bg)' : 'transparent', color: 'var(--c-danger)' },
  };

  return (
    <button
      type={type}
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
