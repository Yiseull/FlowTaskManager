import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithClient } from '../test/test-utils';
import SwitchModal from './SwitchModal';

describe('SwitchModal', () => {
  it('confirms with the backend camelCase switch payload', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    const { user } = renderWithClient(
      <SwitchModal
        open
        onClose={vi.fn()}
        onConfirm={onConfirm}
        activeTask={{ id: 'active-task', title: '진행 중 작업' }}
        targetTask={{ id: 'target-task', title: '다음 작업' }}
      />,
    );

    await user.click(screen.getByRole('button', { name: '긴급' }));
    await user.click(screen.getByRole('button', { name: '전환' }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith({ switchReason: 'URGENT', switchNote: undefined });
    });
  });

  it('includes switchNote when other reason is used', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    const { user } = renderWithClient(
      <SwitchModal
        open
        onClose={vi.fn()}
        onConfirm={onConfirm}
        activeTask={{ id: 'active-task', title: '진행 중 작업' }}
        targetTask={{ id: 'target-task', title: '다음 작업' }}
      />,
    );

    await user.click(screen.getByRole('button', { name: '기타' }));
    await user.type(screen.getByPlaceholderText('전환 사유 입력...'), '맥락 변경');
    await user.click(screen.getByRole('button', { name: '전환' }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith({ switchReason: 'OTHER', switchNote: '맥락 변경' });
    });
  });
});
