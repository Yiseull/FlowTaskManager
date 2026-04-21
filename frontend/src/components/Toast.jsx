import { useState, useCallback } from 'react';

let _addToast = null;

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  _addToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);
  return toasts;
}

export function toast(msg, type = 'info') {
  _addToast?.(msg, type);
}

export function ToastContainer({ toasts }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === 'error' ? 'var(--c-danger)' : '#1D1D1F',
          color: '#fff', padding: '9px 16px', borderRadius: 10,
          fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          animation: 'fadeUp 0.2s ease', whiteSpace: 'nowrap',
        }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
