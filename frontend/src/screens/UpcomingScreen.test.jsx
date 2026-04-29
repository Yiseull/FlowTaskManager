import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import UpcomingScreen from './UpcomingScreen';
import { formatLocalDate, renderWithClient } from '../test/test-utils';

const plannedFutureTask = {
  id: 'future-plan',
  title: '다음 주 릴리즈 준비',
  status: 'PLANNED',
  scheduledDate: '2026-05-04',
  carryOverCount: 0,
  freshness: 'NORMAL',
};

const blockedFutureTask = {
  id: 'future-blocked',
  title: '외부 승인 대기',
  status: 'BLOCKED',
  scheduledDate: '2026-05-05',
  carryOverCount: 0,
  freshness: 'NORMAL',
};

function renderUpcomingWith(tasks) {
  vi.spyOn(api, 'getUpcoming').mockResolvedValue({ tasks });
  return renderWithClient(
    <UpcomingScreen
      active={null}
      planned={[]}
      blocked={[]}
      carryOverPending={[]}
      onGoToday={vi.fn()}
    />,
  );
}

describe('UpcomingScreen task movement', () => {
  it('moves a future planned task to today with the local date', async () => {
    const rescheduleTask = vi
      .spyOn(api, 'rescheduleTask')
      .mockResolvedValue({ id: 'future-plan', status: 'PLANNED', scheduledDate: formatLocalDate() });

    const { user } = renderUpcomingWith([plannedFutureTask]);

    await screen.findByText('다음 주 릴리즈 준비');
    await user.click(screen.getByRole('button', { name: '오늘로' }));

    await waitFor(() => {
      expect(rescheduleTask).toHaveBeenCalledWith('future-plan', { scheduledDate: formatLocalDate() });
    });
  });

  it('moves a future planned task to someday', async () => {
    const sendTaskToSomeday = vi
      .spyOn(api, 'sendTaskToSomeday')
      .mockResolvedValue({ id: 'future-plan', status: 'PLANNED', scheduledDate: null });

    const { user } = renderUpcomingWith([plannedFutureTask]);

    await screen.findByText('다음 주 릴리즈 준비');
    await user.click(screen.getByRole('button', { name: '언젠가로' }));

    await waitFor(() => {
      expect(sendTaskToSomeday).toHaveBeenCalledWith('future-plan');
    });
  });

  it('confirms before cancelling a future blocked task', async () => {
    const cancelTask = vi.spyOn(api, 'cancelTask').mockResolvedValue({ id: 'future-blocked', status: 'CANCELLED' });

    const { user } = renderUpcomingWith([blockedFutureTask]);

    await screen.findByText('외부 승인 대기');
    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(screen.getByText('외부 승인 대기을 취소할까요?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '취소하기' }));

    await waitFor(() => {
      expect(cancelTask).toHaveBeenCalledWith('future-blocked');
    });
  });
});
