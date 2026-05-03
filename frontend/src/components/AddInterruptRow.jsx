import { useRef, useState } from 'react';
import Btn from './Btn';

const PRIORITIES = [
  { value: 'LOW', label: '낮음' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'HIGH', label: '높음' },
];

export default function AddInterruptRow({ onAdd }) {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState('');
  const [priority, setPriority] = useState('LOW');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  async function submit() {
    const title = value.trim();
    if (!title || submitting) return;
    setSubmitting(true);
    try {
      await onAdd({ title, priority });
      setValue('');
      setPriority('LOW');
      setFocused(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      minHeight: 66,
      padding: '12px 14px',
      borderRadius: 20,
      border: '1px dashed var(--c-warn-border)',
      background: 'linear-gradient(180deg, rgba(250,243,223,0.72) 0%, rgba(255,255,255,0.92) 100%)',
    }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '1px solid rgba(174,138,61,0.24)',
          background: 'rgba(255,255,255,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--c-warn)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        onClick={() => { setFocused(true); setTimeout(() => inputRef.current?.focus(), 50); }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 2.2v9.6M2.2 7h9.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </div>

      {focused ? (
        <>
          <input
            ref={inputRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
              if (e.key === 'Escape') {
                setFocused(false);
                setValue('');
                setPriority('LOW');
              }
            }}
            onBlur={() => {
              if (!value) {
                setFocused(false);
                setPriority('LOW');
              }
            }}
            placeholder="생긴 interrupt를 짧게 적어두기"
            autoFocus
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 15,
              border: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              background: 'transparent',
              color: 'var(--c-text)',
            }}
          />
          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            disabled={submitting}
            style={{
              border: '1px solid var(--c-warn-border)',
              borderRadius: 12,
              padding: '8px 10px',
              background: '#fff',
              color: 'var(--c-text)',
            }}
          >
            {PRIORITIES.map(item => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          {value && <Btn size="sm" onClick={submit} loading={submitting}>기록</Btn>}
        </>
      ) : (
        <span
          style={{ fontSize: 15, color: 'var(--c-muted)', cursor: 'text' }}
          onClick={() => { setFocused(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        >
          interrupt 남기기...
        </span>
      )}
    </div>
  );
}
