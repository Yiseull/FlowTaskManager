import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import TodayScreen from './TodayScreen';
import { renderWithClient } from '../test/test-utils';

const todayData = {
  active: null,
  planned: [
    {
      id: 'today-plan',
      title: '오늘 정리할 작업',
      carryOverCount: 0,
      freshness: 'NORMAL',
    },
  ],
  completed: [],
  blocked: [],
  cancelled: [],
  carry_over_pending: [],
};

function renderToday() {
  vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(700);
  vi.spyOn(api, 'getToday').mockResolvedValue(todayData);
  vi.spyOn(api, 'getInterrupts').mockResolvedValue([]);
  return renderWithClient(<TodayScreen onDayEnd={vi.fn()} onOpenSettings={vi.fn()} />);
}

describe('TodayScreen task movement', () => {
  it('moves a planned task to someday', async () => {
    const sendTaskToSomeday = vi
      .spyOn(api, 'sendTaskToSomeday')
      .mockResolvedValue({ id: 'today-plan', status: 'PLANNED', scheduledDate: null });

    const { user } = renderToday();

    await screen.findByText('오늘 정리할 작업');
    await user.click(screen.getByRole('button', { name: '언젠가로' }));

    await waitFor(() => {
      expect(sendTaskToSomeday).toHaveBeenCalledWith('today-plan');
    });
  });

  it('confirms before cancelling a planned task', async () => {
    const cancelTask = vi.spyOn(api, 'cancelTask').mockResolvedValue({ id: 'today-plan', status: 'CANCELLED' });

    const { user } = renderToday();

    await screen.findByText('오늘 정리할 작업');
    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(screen.getByText('오늘 정리할 작업을 취소할까요?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '취소하기' }));

    await waitFor(() => {
      expect(cancelTask).toHaveBeenCalledWith('today-plan');
    });
  });
});
