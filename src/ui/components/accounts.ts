import * as blessed from 'blessed';
import { ApiClient } from '../../api/client';
import { displayList, showError, showMessage, waitForKeyPress, clearScreen } from './common';

/**
 * Accounts management component
 */

export async function showAccountsFlow(screen: blessed.Widgets.Screen, api: ApiClient): Promise<void> {
    try {
        const accounts = await api.getAccounts();
        // Clear UI to avoid destroying the terminal (prevents flicker)
        clearScreen(screen);

        displayList(
            screen,
            'Accounts',
            [
                { label: 'Account ID', width: 20 },
                { label: 'Address', width: 45 },
                { label: 'Status', width: 10 },
            ],
            accounts.map(a => [a.id, a.address, a.status]),
        );

        showMessage(screen, 'Press Space to add new account');
        await waitForKeyPress(screen);
        // clear the list to return to menu without destroying the terminal
        clearScreen(screen);
    } catch (error) {
        showError(screen, (error as Error).message);
    }
}
