import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { renderWithClient } from '../test/test-utils';
import DayEndScreen from './DayEndScreen';

const summary = {
  completedCount: 1,
  switchCount: 2,
  focusMinutes: 45,
  carryOverCount: 1,
};

const carryOverPending = [
  { id: 'carry-task', title: '내일로 보낼 작업', carryOverCount: 2 },
  { id: 'dismiss-task', title: '마감에서 제거할 작업', carryOverCount: 0 },
];

describe('DayEndScreen', () => {
  it('finishes the day with backend camelCase carryOver payload', async () => {
    const startDay = vi.spyOn(api, 'startDay').mockResolvedValue({});
    const onDayStart = vi.fn();

    const { user } = renderWithClient(
      <DayEndScreen
        summary={summary}
        carryOverPending={carryOverPending}
        onDayStart={onDayStart}
        onBack={vi.fn()}
      />,
    );

    expect(await screen.findByText('45분')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /마감에서 제거할 작업/ }));
    await user.click(screen.getByRole('button', { name: '완료 →' }));

    await waitFor(() => {
      expect(startDay).toHaveBeenCalledWith({
        carryOver: ['carry-task'],
        dismiss: ['dismiss-task'],
      });
      expect(onDayStart).toHaveBeenCalled();
    });
  });
});
