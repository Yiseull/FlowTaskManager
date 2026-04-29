import Modal from './Modal';
import Btn from './Btn';

export default function ConfirmCancelModal({ task, open, loading, onClose, onConfirm }) {
  return (
    <Modal open={open} onClose={loading ? undefined : onClose} title="작업 취소" width={420}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 17, lineHeight: 1.4, fontWeight: 800, color: 'var(--c-text)', wordBreak: 'break-word' }}>
            {task?.title || '이 작업'}을 취소할까요?
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--c-muted)' }}>
            취소한 작업은 현재 계획 목록에서 빠집니다. 다시 이어갈 작업이라면 취소 대신 언젠가로 보내거나 날짜를 조정하세요.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Btn variant="secondary" onClick={onClose} disabled={loading}>돌아가기</Btn>
          <Btn variant="danger-ghost" onClick={onConfirm} loading={loading}>취소하기</Btn>
        </div>
      </div>
    </Modal>
  );
}
