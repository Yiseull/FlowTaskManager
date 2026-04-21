import { useState } from 'react';

export default function CircleCheck({ checked, blocked, onCheck }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onCheck}
      style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
        cursor: onCheck ? 'pointer' : 'default',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1.5px solid ${checked ? 'var(--c-success)' : blocked ? 'var(--c-danger)' : hover ? 'var(--c-accent)' : '#C7C7CC'}`,
        background: checked ? 'var(--c-success)' : hover && !blocked ? 'var(--c-accent-faint)' : 'transparent',
        transition: 'all 0.15s',
      }}
    >
      {checked && (
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M2.5 5.5l2.5 2.5 3.5-4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {blocked && !checked && (
        <div style={{ width: 8, height: 1.5, background: 'var(--c-danger)', borderRadius: 1 }} />
      )}
    </div>
  );
}
