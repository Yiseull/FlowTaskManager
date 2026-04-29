import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Modal from '../components/Modal';
import Btn from '../components/Btn';
import { api, MOCK, shouldUseMockFallback } from '../api';
import { toast } from '../components/toastStore';

async function apiOrMock(fn, mockData) {
  try { return await fn(); }
  catch (e) {
    if (shouldUseMockFallback(e)) return mockData;
    throw e;
  }
}

export default function SettingsModal({ open, onClose }) {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiOrMock(() => api.getSettings(), { dailyTaskLimit: 5 }),
    enabled: open,
  });
  const [draftDailyTaskLimit, setDraftDailyTaskLimit] = useState(null);
  const dailyTaskLimit = draftDailyTaskLimit ?? settings?.dailyTaskLimit ?? settings?.daily_task_limit ?? 5;

  const mutation = useMutation({
    mutationFn: (payload) => apiOrMock(() => api.updateSettings(payload), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast('설정을 저장했어요', 'success');
      onClose();
    },
    onError: (e) => toast(e.message || '설정 저장 중 오류가 발생했어요', 'error'),
  });

  return (
    <Modal open={open} onClose={onClose} title="설정" width={420}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>하루 작업 한도</div>
          <div style={{ fontSize: 13, color: 'var(--c-muted)', lineHeight: 1.5 }}>
            오늘 생성하거나 이월해서 유지할 수 있는 작업 수입니다.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="range"
            min="1"
            max="10"
            value={dailyTaskLimit}
            onChange={(e) => setDraftDailyTaskLimit(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <div style={{
            minWidth: 54,
            height: 42,
            borderRadius: 12,
            border: '1px solid var(--c-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            background: 'rgba(255,255,255,0.78)',
          }}>
            {dailyTaskLimit}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" onClick={onClose} fullWidth>닫기</Btn>
          <Btn onClick={() => mutation.mutate({ dailyTaskLimit })} loading={mutation.isPending} fullWidth>저장</Btn>
        </div>
      </div>
    </Modal>
  );
}
