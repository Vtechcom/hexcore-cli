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

export interface ProgressBoxControls {
    updateProgress: (percent: number) => void;
    setMessage: (message: string) => void;
    close: () => void;
}

/**
 * Show a progress box with message, progress bar, and spinner
 */
export function showProgressBox(
    screen: blessed.Widgets.Screen,
    message: string,
    showSpinner: boolean = true,
): ProgressBoxControls {
    const box = blessed.box({
        parent: screen,
        top: 'center',
        left: 'center',
        width: 60,
        height: 10,
        border: 'line',
        style: { fg: 'white', border: { fg: 'blue' } },
        tags: true,
    });

    const messageText = blessed.text({
        parent: box,
        top: 1,
        left: 2,
        width: '100%-4',
        content: message,
        style: { fg: 'white' },
        tags: true,
    });

    const progressBar = blessed.progressbar({
        parent: box,
        top: 4,
        left: 2,
        width: '100%-4',
        height: 1,
        orientation: 'horizontal',
        style: {
            bar: { bg: 'blue' },
            fg: 'white',
        },
        filled: 0,
    });

    let spinnerText: blessed.Widgets.TextElement | null = null;
    let spinnerInterval: NodeJS.Timeout | null = null;

    if (showSpinner) {
        const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let frameIndex = 0;

        spinnerText = blessed.text({
            parent: box,
            top: 6,
            left: 'center',
            content: spinnerFrames[0],
            style: { fg: 'cyan' },
        });

        spinnerInterval = setInterval(() => {
            frameIndex = (frameIndex + 1) % spinnerFrames.length;
            if (spinnerText) {
                spinnerText.setContent(spinnerFrames[frameIndex]);
                screen.render();
            }
        }, 80);
    }

    screen.render();

    return {
        updateProgress: (percent: number) => {
            progressBar.setProgress(percent);
            screen.render();
        },
        setMessage: (newMessage: string) => {
            messageText.setContent(newMessage);
            screen.render();
        },
        close: () => {
            if (spinnerInterval) {
                clearInterval(spinnerInterval);
            }
            box.detach();
            screen.render();
        },
    };
}
