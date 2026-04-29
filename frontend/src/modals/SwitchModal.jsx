import { useState } from 'react';
import Modal from '../components/Modal';
import Btn from '../components/Btn';
import { toast } from '../components/toastStore';

const SWITCH_REASONS = [
  { id: 'URGENT',       label: '긴급',          desc: '더 급한 일이 생겼어요' },
  { id: 'BLOCKED',      label: '차단됨',         desc: '진행이 막혀서 전환해요' },
  { id: 'REPRIORITIZED', label: '우선순위 변경', desc: '계획이 바뀌었어요' },
  { id: 'AI_DELEGATED', label: 'AI 위임',        desc: '이 작업을 AI에게 맡겼어요' },
  { id: 'OTHER',        label: '기타',           desc: '직접 입력할게요' },
];

export default function SwitchModal({ open, onClose, onConfirm, targetTask, activeTask }) {
  return (
    <Modal open={open} onClose={onClose} title="태스크 전환" width={440}>
      {open && (
        <SwitchModalContent
          onClose={onClose}
          onConfirm={onConfirm}
          targetTask={targetTask}
          activeTask={activeTask}
        />
      )}
    </Modal>
  );
}

function SwitchModalContent({ onClose, onConfirm, targetTask, activeTask }) {
  const [reason, setReason] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!reason) { toast('전환 사유를 선택해 주세요', 'error'); return; }
    setLoading(true);
    try {
      await onConfirm({ switchReason: reason, switchNote: note || undefined });
    } catch (e) {
      toast(e.message || '전환 중 오류 발생', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {activeTask && (
        <div style={{ background: 'var(--c-hover)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--c-muted)' }}>
          <span style={{ fontWeight: 600, color: 'var(--c-text)' }}>현재: </span>{activeTask.title}
        </div>
      )}
      {targetTask && (
        <div style={{ background: 'var(--c-accent-faint)', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
          <span style={{ fontWeight: 600, color: 'var(--c-accent)' }}>전환: </span>{targetTask.title}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {SWITCH_REASONS.map(r => (
          <button
            key={r.id}
            onClick={() => setReason(r.id)}
            style={{
              padding: '9px 12px', borderRadius: 8, textAlign: 'left',
              border: `1.5px solid ${reason === r.id ? 'var(--c-accent)' : 'var(--c-border)'}`,
              background: reason === r.id ? 'var(--c-accent-faint)' : '#fff',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              color: reason === r.id ? 'var(--c-accent)' : 'var(--c-text)',
              fontFamily: 'inherit',
              gridColumn: r.id === 'OTHER' ? '1 / -1' : undefined,
            }}
          >
            {r.label}
          </button>
        ))}
      </div>
      {reason === 'OTHER' && (
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="전환 사유 입력..."
          rows={2}
          style={{
            resize: 'none', fontFamily: 'inherit', fontSize: 13,
            padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--c-border)', outline: 'none', width: '100%',
          }}
        />
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn variant="secondary" onClick={onClose} fullWidth>취소</Btn>
        <Btn onClick={handleConfirm} loading={loading} fullWidth>전환</Btn>
      </div>
    </div>
  );
}
