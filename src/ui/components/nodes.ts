import * as blessed from 'blessed';
import { ApiClient } from '../../api/client';
import { displayList, showError, waitForKeyPress, clearScreen } from './common';

/**
 * Nodes management component
 */

export async function showNodesList(screen: blessed.Widgets.Screen, api: ApiClient): Promise<void> {
    try {
        const nodes = await api.getNodes();
        // Clear UI to avoid destroying the terminal (prevents flicker)
        clearScreen(screen);

        displayList(
            screen,
            'Nodes List',
            [
                { label: 'Node ID', width: 12 },
                { label: 'Description', width: 36 },
                { label: 'Port', width: 8 },
                { label: 'Account', width: 44 },
                { label: 'Status', width: 10 },
            ],
            nodes.map(n => [
                n.id.toString(),
                n.description || '',
                n.port.toString(),
                n.cardanoAccount?.baseAddress || '-',
                n.status,
            ]),
        );

        await waitForKeyPress(screen);
        // clear the list to return to menu without destroying the terminal
        clearScreen(screen);
    } catch (error) {
        showError(screen, (error as Error).message);
    }
}
