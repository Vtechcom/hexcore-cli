import * as blessed from 'blessed';
import { SystemStatus } from '../../api/client';
import { getTimeSinceUpdate } from '../../utils/validators';

/**
 * Menu component for dashboard
 */

export function createMenuScreen(
    screen: blessed.Widgets.Screen,
    status: SystemStatus,
    menuSelection: number,
    lastUpdate: Date,
): {
    updateMenuSelection: (selection: number) => void;
    updateStatus: (s: SystemStatus, t: Date) => void;
} {
    // Main container
    const main = blessed.box({
        parent: screen,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        style: {
            bg: 'default',
            fg: 'white',
        },
    });

    // Header
    blessed.box({
        parent: main,
        top: 0,
        left: 0,
        width: '100%',
        height: 1,
        content: ' hexcore-cli - Hydra Node Manager',
        tags: true,
        style: {
            bg: 'blue',
            fg: 'white',
            bold: true,
        },
    });

    // Separator
    blessed.box({
        parent: main,
        top: 1,
        left: 0,
        width: '100%',
        height: 1,
        content: '─'.repeat(typeof screen.width === 'number' ? screen.width : 50),
        style: { fg: 'gray' },
    });

    // Overview section (updatable)
    const overviewBox = blessed.box({
        parent: main,
        top: 2,
        left: 0,
        width: '100%',
        height: 4,
        content: `\n ⭐︎ OVERVIEW\n Running Nodes: ${status.runningNodes} | Running Heads: ${status.runningHeads} | Total: ${status.totalHeads}\n`,
        style: { fg: 'white' },
    });

    // Separator
    blessed.box({
        parent: main,
        top: 6,
        left: 0,
        width: '100%',
        height: 1,
        content: '─'.repeat(typeof screen.width === 'number' ? screen.width : 50),
        style: { fg: 'gray' },
    });

    // Menu section (updatable)
    const buildMenuContent = (sel: number) =>
        ` ⚡︎ QUICK ACTIONS\n 
    ${sel === 1 ? '>' : ' '}[1] Create New Head 
    ${sel === 2 ? '>' : ' '}[2] Heads Management 
    ${sel === 3 ? '>' : ' '}[3] Wallet Accounts 
    ${sel === 4 ? '>' : ' '}[4] Nodes List 
    ${sel === 5 ? '>' : ' '}[5] Health Status\n 
    Enter selection (1-5): `;

    const menuBox = blessed.box({
        parent: main,
        top: 7,
        left: 0,
        width: '100%',
        height: 10,
        content: buildMenuContent(menuSelection),
        tags: true,
        style: {
            fg: 'white',
            focus: { bg: 'blue' },
        },
    });

    // Separator
    blessed.box({
        parent: main,
        top: 17,
        left: 0,
        width: '100%',
        height: 1,
        content: '─'.repeat(typeof screen.width === 'number' ? screen.width : 50),
        style: { fg: 'gray' },
    });

    // Status bar (updatable)
    const statusBox = blessed.box({
        parent: main,
        bottom: 0,
        left: 0,
        width: '100%',
        height: 1,
        content:
            status.status === 'healthy'
                ? `✓ All systems operational | Last update: ${getTimeSinceUpdate(Math.floor((Date.now() - lastUpdate.getTime()) / 1000))}`
                : `✗ Connection failed | Last update: ${getTimeSinceUpdate(Math.floor((Date.now() - lastUpdate.getTime()) / 1000))}`,
        style: {
            bg: status.status === 'healthy' ? 'green' : 'red',
            fg: 'white',
        },
    });

    screen.render();

    return {
        updateMenuSelection: (selection: number) => {
            menuBox.setContent(buildMenuContent(selection));
            screen.render();
        },
        updateStatus: (s: SystemStatus, t: Date) => {
            overviewBox.setContent(
                `\n ⭐︎ OVERVIEW\n Running Nodes: ${s.runningNodes} | Running Heads: ${s.runningHeads} | Total: ${s.totalHeads}\n`,
            );
            statusBox.setContent(
                s.status === 'healthy'
                    ? `✓ All systems operational | Last update: ${getTimeSinceUpdate(Math.floor((Date.now() - t.getTime()) / 1000))}`
                    : `✗ Connection failed | Last update: ${getTimeSinceUpdate(Math.floor((Date.now() - t.getTime()) / 1000))}`,
            );
            statusBox.style.bg = s.status === 'healthy' ? 'green' : 'red';
            screen.render();
        },
    };
}
