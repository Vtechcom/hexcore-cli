import * as blessed from 'blessed';
import { ApiClient } from '../../api/client';
import { formatTime } from '../../utils/validators';
import { displayList, showError, showMessage, waitForKeyPress, clearScreen } from './common';

/**
 * Heads management component
 */

export async function showCreateHeadFlow(screen: blessed.Widgets.Screen, api: ApiClient): Promise<void> {
    try {
        const accounts = await api.getAccounts();
        if (accounts.length === 0) {
            showError(screen, 'No accounts available. Go to [4] Wallet Accounts');
            return;
        }

        // Show account selection UI
        showMessage(screen, 'Account selection (Space: select, Enter: confirm, ESC: cancel)');
    } catch (error) {
        showError(screen, (error as Error).message);
    }
}

export async function showHeadsList(screen: blessed.Widgets.Screen, api: ApiClient): Promise<void> {
    try {
        const heads = await api.getHeads();
        // Clear UI to avoid destroying the terminal (prevents flicker)
        clearScreen(screen);

        displayList(
            screen,
            'Heads List',
            [
                { label: 'HeadID', width: 15 },
                { label: 'Status', width: 12 },
                { label: 'Created Time', width: 20 },
            ],
            heads.map(h => [h.id, h.status, formatTime(h.createdAt)]),
        );

        await waitForKeyPress(screen);
        // clear the list to return to menu without destroying the terminal
        clearScreen(screen);
    } catch (error) {
        showError(screen, (error as Error).message);
    }
}

export async function showStopHeadFlow(screen: blessed.Widgets.Screen, api: ApiClient): Promise<void> {
    try {
        const heads = await api.getHeads();
        if (heads.length === 0) {
            showError(screen, 'No heads available');
            return;
        }

        showMessage(screen, 'Stop head flow (select a head)');
    } catch (error) {
        showError(screen, (error as Error).message);
    }
}
