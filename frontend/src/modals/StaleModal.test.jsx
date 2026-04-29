import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { formatLocalDate, renderWithClient } from '../test/test-utils';
import StaleModal from './StaleModal';

const staleTask = {
  id: 'stale-task',
  title: '오래 미룬 작업',
  carryOverCount: 4,
};

describe('StaleModal', () => {
  it('postpones a stale task to tomorrow with the backend scheduledDate payload', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const rescheduleTask = vi.spyOn(api, 'rescheduleTask').mockResolvedValue({});
    const onResolved = vi.fn();

    const { user } = renderWithClient(<StaleModal tasks={[staleTask]} onResolved={onResolved} />);

    await user.click(screen.getByRole('button', { name: '미루기' }));

    await waitFor(() => {
      expect(rescheduleTask).toHaveBeenCalledWith('stale-task', { scheduledDate: formatLocalDate(tomorrow) });
      expect(onResolved).toHaveBeenCalled();
    });
  });
});
