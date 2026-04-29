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

const emptyTodayData = {
  active: null,
  planned: [],
  completed: [],
  blocked: [],
  cancelled: [],
  carryOverPending: [],
};

const activeTodayData = {
  active: { id: 'active-task', title: '진행 중 작업', carryOverCount: 0 },
  planned: [],
  completed: [],
  blocked: [],
  cancelled: [],
  carryOverPending: [],
};

const pendingInterrupts = [
  {
    id: 'interrupt-task',
    title: 'QA interrupt',
    priority: 'LOW',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  },
];

function renderToday(data = todayData, interrupts = []) {
  vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(700);
  vi.spyOn(api, 'getToday').mockResolvedValue(data);
  vi.spyOn(api, 'getCurrentSession').mockResolvedValue({
    id: 'session-id',
    startedAt: new Date().toISOString(),
    elapsedSeconds: 0,
  });
  vi.spyOn(api, 'getInterrupts').mockResolvedValue(interrupts);
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

  it('shows the daily limit message when adding a task is rejected', async () => {
    const error = new Error('daily limit');
    error.code = 'DAILY_TASK_LIMIT';
    vi.spyOn(api, 'createTask').mockRejectedValue(error);

    const { user } = renderToday(emptyTodayData);

    await user.click(await screen.findByText('새 태스크 추가...'));
    await user.type(screen.getByPlaceholderText('새 태스크...'), '한도 초과 작업');
    await user.keyboard('{Enter}');

    expect(await screen.findByText('일일 태스크 한도를 초과했어요')).toBeInTheDocument();
  });

  it('converts an interrupt with backend camelCase startImmediately payload', async () => {
    const convertInterrupt = vi
      .spyOn(api, 'convertInterrupt')
      .mockResolvedValue({ interruptId: 'interrupt-task', taskId: 'converted-task', taskStatus: 'PLANNED' });

    const { user } = renderToday(activeTodayData, pendingInterrupts);

    await screen.findByText('QA interrupt');
    await user.click(screen.getByRole('button', { name: '목록에 추가' }));

    await waitFor(() => {
      expect(convertInterrupt).toHaveBeenCalledWith('interrupt-task', { startImmediately: false });
    });
  });
});
