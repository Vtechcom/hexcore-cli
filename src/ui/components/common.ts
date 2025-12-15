import * as blessed from 'blessed';

/**
 * Shared UI components for blessed-based dashboard
 */

export function displayList(
    screen: blessed.Widgets.Screen,
    title: string,
    columns: { label: string; width: number }[],
    rows: (string | number)[][],
): void {
    const header = columns.map(c => c.label.padEnd(c.width)).join(' ');
    const separator = columns.map(c => '─'.repeat(c.width)).join(' ');

    let content = `\n ${title}\n\n ${header}\n ${separator}\n`;
    rows.forEach(row => {
        const line = columns.map((c, i) => (row[i] || '').toString().padEnd(c.width)).join(' ');
        content += ` ${line}\n`;
    });

    blessed.box({
        parent: screen,
        content,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        scrollable: true,
        style: { fg: 'white' },
    });

    blessed.box({
        parent: screen,
        content: 'Press any key to return...',
        bottom: 0,
        left: 0,
        width: '100%',
        height: 1,
        style: { bg: 'blue', fg: 'white' },
    });

    screen.render();
}

export function showMessage(screen: blessed.Widgets.Screen, message: string): void {
    blessed.box({
        parent: screen,
        content: `\n {yellow-fg}${message}{/}`,
        top: 'center',
        left: 'center',
        width: 50,
        height: 5,
        border: 'line',
        tags: true,
        style: { fg: 'white' },
    });
    screen.render();
}

export function showError(screen: blessed.Widgets.Screen, message: string): void {
    blessed.box({
        parent: screen,
        content: `\n {red-fg}✗ ${message}{/}`,
        top: 'center',
        left: 'center',
        width: 50,
        height: 5,
        border: 'line',
        tags: true,
        style: { fg: 'white', border: { fg: 'red' } },
    });
    screen.render();
}

export async function waitForKeyPress(screen: blessed.Widgets.Screen): Promise<void> {
    return new Promise(resolve => {
        screen.once('keypress', () => resolve());
    });
}

export function clearScreen(screen: blessed.Widgets.Screen): void {
    // Detach all children without destroying the terminal
    while (screen.children && screen.children.length) {
        const child = screen.children[0];
        child.detach();
    }
    screen.render();
}
