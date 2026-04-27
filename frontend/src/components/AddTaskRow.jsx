import { useState, useRef } from 'react';
import Btn from './Btn';

export default function AddTaskRow({ onAdd }) {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  async function submit() {
    if (!value.trim()) return;
    await onAdd(value.trim());
    setValue('');
    setFocused(false);
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      minHeight: 72,
      marginTop: 6,
      padding: '0 4px',
      borderRadius: 20,
    }}>
      <div
        style={{
          width: 38, height: 38, borderRadius: '50%',
          border: '1.5px dashed rgba(123, 137, 112, 0.32)', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          background: 'rgba(255,255,255,0.62)',
        }}
        onClick={() => { setFocused(true); setTimeout(() => inputRef.current?.focus(), 50); }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M5 2v6M2 5h6" stroke="var(--c-accent)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      {focused ? (
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') { setFocused(false); setValue(''); }
          }}
          onBlur={() => { if (!value) setFocused(false); }}
          placeholder="새 태스크..."
          autoFocus
          style={{
            flex: 1, fontSize: 16, border: 'none', outline: 'none',
            fontFamily: 'inherit', background: 'transparent', color: 'var(--c-text)',
          }}
        />
      ) : (
        <span
          style={{ fontSize: 16, color: 'var(--c-soft)', cursor: 'text' }}
          onClick={() => { setFocused(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        >
          새 태스크 추가...
        </span>
      )}
      {focused && value && <Btn size="sm" onClick={submit}>추가</Btn>}
    </div>
  );
}
