import { describe, it, expect, vi } from 'vitest';
import * as blessed from 'blessed';
import { Dashboard } from '../src/ui/dashboard';

describe('Dashboard UI flow', () => {
    it('start -> select 6 -> show status -> press any key -> back to menu', async () => {
        const mockStatus = { runningNodes: 2, runningHeads: 1, totalHeads: 3, status: 'healthy' } as const;
        const api = {
            getSystemStatus: vi.fn().mockResolvedValue(mockStatus),
        } as any;

        const dashboard = new Dashboard({ api });
        await dashboard.start();

        const screen = (dashboard as any).screen as blessed.Widgets.Screen;

        // Directly invoke the menu selection for '6' and schedule two keypresses
        // to simulate a user pressing a key to close the status view and the
        // potential follow-up key event that previously retriggered the menu.
        const promise = (dashboard as any).handleMenuSelection(6);
        // First keypress closes the status view
        setImmediate(() => screen.emit('keypress', 'enter', { name: 'enter' }));
        // Second keypress (e.g., key release or accidental repeat) should be
        // suppressed and not reopen the status view.
        setImmediate(() => screen.emit('keypress', 'enter', { name: 'enter' }));
        await promise;

        expect((dashboard as any).currentView).toBe('menu');
        expect((dashboard as any).menuControls).toBeDefined();

        dashboard.destroy();
    });
});
