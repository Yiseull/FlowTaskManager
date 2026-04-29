import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { renderWithClient } from '../test/test-utils';
import DayStartScreen from './DayStartScreen';

const carryOverPending = [
  { id: 'carry-task', title: '오늘로 이월할 작업', carryOverCount: 1 },
  { id: 'dismiss-task', title: '제거할 작업', carryOverCount: 0 },
];

describe('DayStartScreen', () => {
  it('starts the day with backend camelCase carryOver payload', async () => {
    const startDay = vi.spyOn(api, 'startDay').mockResolvedValue({});
    const onComplete = vi.fn();

    const { user } = renderWithClient(
      <DayStartScreen carryOverPending={carryOverPending} onComplete={onComplete} />,
    );

    await user.click(screen.getByRole('button', { name: /제거할 작업/ }));
    await user.click(screen.getByRole('button', { name: '오늘 시작하기 →' }));

    await waitFor(() => {
      expect(startDay).toHaveBeenCalledWith({
        carryOver: ['carry-task'],
        dismiss: ['dismiss-task'],
      });
      expect(onComplete).toHaveBeenCalled();
    });
  });
});
