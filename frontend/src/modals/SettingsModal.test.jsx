import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { renderWithClient } from '../test/test-utils';
import SettingsModal from './SettingsModal';

describe('SettingsModal', () => {
  it('reads and saves the backend dailyTaskLimit field', async () => {
    vi.spyOn(api, 'getSettings').mockResolvedValue({ dailyTaskLimit: 6 });
    const updateSettings = vi.spyOn(api, 'updateSettings').mockResolvedValue({ dailyTaskLimit: 6 });
    const onClose = vi.fn();

    const { user } = renderWithClient(<SettingsModal open onClose={onClose} />);

    expect(await screen.findByText('6')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(updateSettings).toHaveBeenCalledWith({ dailyTaskLimit: 6 });
      expect(onClose).toHaveBeenCalled();
    });
  });
});
