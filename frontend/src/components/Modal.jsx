import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, width = 440 }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 1000, padding: 20,
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: width,
        boxShadow: '0 8px 40px rgba(0,0,0,0.16)', animation: 'modalIn 0.18s ease',
        border: '1px solid var(--c-border)',
      }}>
        {title && (
          <div style={{ padding: '18px 22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
            {onClose && (
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-muted)', fontSize: 20, padding: 2 }}>×</button>
            )}
          </div>
        )}
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}
