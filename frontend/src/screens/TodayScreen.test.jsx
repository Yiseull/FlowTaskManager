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

const activeWithPlannedTodayData = {
  ...activeTodayData,
  planned: [
    {
      id: 'switch-target',
      title: '전환 대상 작업',
      carryOverCount: 0,
      freshness: 'NORMAL',
    },
  ],
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
  vi.spyOn(api, 'getDaySummary').mockResolvedValue({
    date: '2026-05-03',
    completedCount: 0,
    switchCount: 7,
    focusMinutes: 12,
    carryOverCount: 0,
  });
  return renderWithClient(<TodayScreen onDayEnd={vi.fn()} onOpenSettings={vi.fn()} />);
}

function deferred() {
  let resolve;
  const promise = new Promise(res => {
    resolve = res;
  });
  return { promise, resolve };
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

  it('starts an interrupt immediately with backend camelCase startImmediately payload', async () => {
    const convertInterrupt = vi
      .spyOn(api, 'convertInterrupt')
      .mockResolvedValue({ interruptId: 'interrupt-task', taskId: 'converted-task', taskStatus: 'IN_PROGRESS' });

    const { user } = renderToday(activeTodayData, pendingInterrupts);

    await screen.findByText('QA interrupt');
    await user.click(screen.getByRole('button', { name: '지금 시작' }));

    await waitFor(() => {
      expect(convertInterrupt).toHaveBeenCalledWith('interrupt-task', { startImmediately: true });
    });
  });

  it('dismisses an interrupt from the queue', async () => {
    const dismissInterrupt = vi.spyOn(api, 'dismissInterrupt').mockResolvedValue({ id: 'interrupt-task', status: 'DISMISSED' });

    const { user } = renderToday(activeTodayData, pendingInterrupts);

    await screen.findByText('QA interrupt');
    await user.click(screen.getByRole('button', { name: '닫기' }));

    await waitFor(() => {
      expect(dismissInterrupt).toHaveBeenCalledWith('interrupt-task');
    });
  });

  it('creates one interrupt when enter is pressed repeatedly while saving', async () => {
    const pendingCreate = deferred();
    const createInterrupt = vi.spyOn(api, 'createInterrupt').mockReturnValue(pendingCreate.promise);

    const { user } = renderToday(activeTodayData);

    await user.click(await screen.findByText('interrupt 남기기...'));
    await user.type(screen.getByPlaceholderText('생긴 interrupt를 짧게 적어두기'), '중복 방지 확인');
    await user.keyboard('{Enter}{Enter}');

    expect(createInterrupt).toHaveBeenCalledTimes(1);
    expect(createInterrupt).toHaveBeenCalledWith({ title: '중복 방지 확인', priority: 'LOW' });

    pendingCreate.resolve({ id: 'new-interrupt', title: '중복 방지 확인', priority: 'LOW', status: 'PENDING' });
  });

  it('shows the switch count from the day summary in focus analytics', async () => {
    renderToday(activeTodayData);

    expect(await screen.findByText('7회')).toBeInTheDocument();
  });

  it('starts a planned task through the switch reason flow when another task is active', async () => {
    const startTask = vi.spyOn(api, 'startTask').mockResolvedValue({ taskId: 'switch-target', sessionId: 'session-2' });

    const { user } = renderToday(activeWithPlannedTodayData);

    await screen.findByText('전환 대상 작업');
    await user.click(screen.getByRole('button', { name: '시작' }));
    expect(screen.getByText('태스크 전환')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '긴급' }));
    await user.click(screen.getByRole('button', { name: '전환' }));

    await waitFor(() => {
      expect(startTask).toHaveBeenCalledWith('switch-target', {
        switchReason: 'URGENT',
        switchNote: undefined,
      });
    });
  });
});
