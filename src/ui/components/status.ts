import * as blessed from 'blessed';
import { ApiClient } from '../../api/client';
import { showError, waitForKeyPress, clearScreen } from './common';

/**
 * System status display component
 */

export async function showStatus(screen: blessed.Widgets.Screen, api: ApiClient): Promise<void> {
    try {
        const status = await api.getSystemStatus();
        const content = `
 📊 System Status
 
 Running Nodes:    ${status.runningNodes}
 Running Heads:    ${status.runningHeads}
 Total Heads:      ${status.totalHeads}
 
 Status: ${status.status === 'healthy' ? '{green-fg}✓ Healthy{/}' : '{red-fg}✗ Error{/}'}
 `;

        // Clear UI to avoid destroying the terminal (prevents flicker)
        clearScreen(screen);
        blessed.box({
            parent: screen,
            content,
            top: 'center',
            left: 'center',
            width: 40,
            height: 12,
            border: 'line',
            tags: true,
            style: { fg: 'white' },
        });
        screen.render();
        await waitForKeyPress(screen);
    } catch (error) {
        showError(screen, (error as Error).message);
    }
}
