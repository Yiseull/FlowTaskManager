import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import SomedayScreen from './SomedayScreen';
import { formatLocalDate, renderWithClient } from '../test/test-utils';

const somedayTasks = {
  tasks: [
    {
      id: 'someday-plan',
      title: '언젠가 기획 정리',
      description: '다음 집중 슬롯 후보',
      status: 'PLANNED',
      carryOverCount: 0,
      freshness: 'NORMAL',
      scheduledDate: null,
    },
    {
      id: 'someday-blocked',
      title: '차단된 외부 연동 조사',
      status: 'BLOCKED',
      carryOverCount: 1,
      freshness: 'NORMAL',
      scheduledDate: null,
    },
  ],
};

function mockSomedayQuery() {
  vi.spyOn(api, 'getSomeday').mockResolvedValue(somedayTasks);
}

describe('SomedayScreen task movement', () => {
  it('moves a planned someday task to today with the local date', async () => {
    mockSomedayQuery();
    const rescheduleTask = vi
      .spyOn(api, 'rescheduleTask')
      .mockResolvedValue({ id: 'someday-plan', status: 'PLANNED', scheduledDate: formatLocalDate() });

    const { user } = renderWithClient(<SomedayScreen />);

    await screen.findByText('언젠가 기획 정리');
    await user.click(screen.getByRole('button', { name: '오늘로' }));

    await waitFor(() => {
      expect(rescheduleTask).toHaveBeenCalledWith('someday-plan', { scheduledDate: formatLocalDate() });
    });
  });

  it('shows the daily limit message when moving to today is rejected', async () => {
    mockSomedayQuery();
    const error = new Error('daily limit');
    error.code = 'DAILY_TASK_LIMIT';
    vi.spyOn(api, 'rescheduleTask').mockRejectedValue(error);

    const { user } = renderWithClient(<SomedayScreen />);

    await screen.findByText('언젠가 기획 정리');
    await user.click(screen.getByRole('button', { name: '오늘로' }));

    expect(await screen.findByText('오늘 할 일 한도를 초과했어요')).toBeInTheDocument();
  });

  it('confirms before cancelling a stored task', async () => {
    mockSomedayQuery();
    const cancelTask = vi.spyOn(api, 'cancelTask').mockResolvedValue({ id: 'someday-plan', status: 'CANCELLED' });

    const { user } = renderWithClient(<SomedayScreen />);

    await screen.findByText('언젠가 기획 정리');
    await user.click(screen.getAllByRole('button', { name: '취소' })[0]);

    expect(screen.getByText('언젠가 기획 정리을 취소할까요?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '취소하기' }));

    await waitFor(() => {
      expect(cancelTask).toHaveBeenCalledWith('someday-plan');
    });
  });
});
