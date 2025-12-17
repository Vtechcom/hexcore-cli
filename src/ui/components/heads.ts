import * as blessed from 'blessed';
import { ApiClient, Head } from '../../api/client';
import { formatTime } from '../../utils/validators';
import { displayList, showError, showMessage, waitForKeyPress, clearScreen, showProgressBox } from './common';
import { formatDate, formatId } from '../../utils/format';
import { Converter } from '@hydra-sdk/core';
import { BigNumber } from 'bignumber.js';

/**
 * Heads management component
 */

export async function showCreateHeadFlow(screen: blessed.Widgets.Screen, api: ApiClient): Promise<void> {
    try {
        const accounts = await api.getAccounts();

        // Check if accounts exist
        if (accounts.length === 0) {
            clearScreen(screen);

            blessed.box({
                parent: screen,
                content:
                    '\n\n {red-fg}✗ No Account Available{/}\n\n Please go to [3] Wallet Accounts to create accounts first.',
                top: 'center',
                left: 'center',
                width: 60,
                height: 7,
                border: 'line',
                tags: true,
                style: { fg: 'white', border: { fg: 'red' } },
            });

            screen.render();
            await waitForKeyPress(screen);
            clearScreen(screen);
            return;
        }

        // Account selection UI
        let selectedIndex = 0;
        const selectedAccounts = new Set<number>();
        let shouldExit = false;
        let shouldConfirm = false;

        while (!shouldExit && !shouldConfirm) {
            clearScreen(screen);

            // Build account selection table
            let content = '\n Create New Head - Select Accounts\n\n';
            content += ' Use ↑↓ to navigate, Space to select/deselect, Enter to confirm\n\n';

            const header = [
                { label: '⌥', width: 1 },
                { label: '[ ]', width: 3 },
                { label: 'ID', width: 12 },
                { label: 'Base Address', width: 24 },
                { label: 'Enterprise Address', width: 64 },
                { label: 'Created', width: 20 },
            ];
            const headerLine = header.map(c => c.label.padEnd(c.width)).join(' ');
            const separator = header.map(c => '─'.repeat(c.width)).join(' ');

            const rows = accounts
                .sort((a, b) => b.id - a.id)
                .map((account, index) => {
                    const isSelected = index === selectedIndex;
                    const isChecked = selectedAccounts.has(account.id);
                    const cursor = isSelected ? '>' : ' ';
                    const checkbox = isChecked ? '[✓]' : '[ ]';
                    return [
                        cursor,
                        checkbox,
                        isChecked
                            ? `{green-fg}${account.id.toString().padEnd(header[2].width)}{/}`
                            : account.id.toString(),
                        isChecked
                            ? `{green-fg}${formatId(account.baseAddress, 8, 8).padEnd(header[3].width)}{/}`
                            : formatId(account.baseAddress, 8, 8),
                        isChecked
                            ? `{green-fg}${account.pointerAddress.padEnd(header[4].width)}{/}`
                            : account.pointerAddress,
                        isChecked
                            ? `{green-fg}${formatDate(account.createdAt).padEnd(header[5].width)}{/}`
                            : formatDate(account.createdAt),
                    ];
                });
            content += `\n ${headerLine}\n ${separator}\n`;
            rows.forEach(row => {
                const line = header.map((c, i) => (row[i] || '').toString().padEnd(c.width)).join(' ');
                content += ` ${line}\n`;
            });

            content += `\n Selected: ${selectedAccounts.size} account(s)\n`;

            blessed.box({
                parent: screen,
                content,
                top: 0,
                left: 0,
                width: '100%',
                height: '100%-2',
                scrollable: true,
                tags: true,
                style: { fg: 'white' },
            });

            blessed.box({
                parent: screen,
                content: 'Space: Select | Enter: Confirm | ESC: Cancel',
                bottom: 0,
                left: 0,
                width: '100%',
                height: 1,
                style: { bg: 'blue', fg: 'white' },
            });

            screen.render();

            // Handle key presses
            const action = await new Promise<string>(resolve => {
                screen.once('keypress', (_ch: any, key: any) => {
                    resolve(key?.name || 'exit');
                });
            });

            if (action === 'up' || action === 'k') {
                selectedIndex = Math.max(0, selectedIndex - 1);
            } else if (action === 'down' || action === 'j') {
                selectedIndex = Math.min(accounts.length - 1, selectedIndex + 1);
            } else if (action === 'space') {
                const accountId = accounts[selectedIndex].id;
                if (selectedAccounts.has(accountId)) {
                    selectedAccounts.delete(accountId);
                } else {
                    selectedAccounts.add(accountId);
                }
            } else if (action === 'enter' || action === 'return') {
                if (selectedAccounts.size > 0) {
                    shouldConfirm = true;
                }
            } else if (action === 'escape') {
                shouldExit = true;
            }
        }

        if (shouldConfirm && selectedAccounts.size > 0) {
            // Call API to create head
            const progress = showProgressBox(screen, 'Creating new head...', true);

            try {
                const accountIds = Array.from(selectedAccounts);
                const newHead = await api.createCluster(accountIds);

                progress.setMessage('✓ Head created successfully!');
                progress.updateProgress(100);
                await new Promise(resolve => setTimeout(resolve, 1500));
                progress.close();

                // Show success message with recommendation
                clearScreen(screen);

                blessed.box({
                    parent: screen,
                    content: `\n\n {green-fg}✓ Head Created Successfully!{/}\n\n Head ID: ${newHead.id}\n Accounts: ${selectedAccounts.size}\n\n {yellow-fg}→ Go to [2] Heads Management to manage this head{/}`,
                    top: 'center',
                    left: 'center',
                    width: 60,
                    height: 11,
                    border: 'line',
                    tags: true,
                    style: { fg: 'white', border: { fg: 'green' } },
                });

                screen.render();
                await waitForKeyPress(screen);
            } catch (error) {
                progress.setMessage(`✗ Error: ${(error as Error).message}`);
                await new Promise(resolve => setTimeout(resolve, 2500));
                progress.close();
            }
        }

        clearScreen(screen);
    } catch (error) {
        showError(screen, (error as Error).message);
        await waitForKeyPress(screen);
        clearScreen(screen);
    }
}

export async function showHeadsList(screen: blessed.Widgets.Screen, api: ApiClient): Promise<void> {
    try {
        const heads = await api.getHeads();
        if (heads.length === 0) {
            showError(screen, 'No heads available');
            await waitForKeyPress(screen);
            clearScreen(screen);
            return;
        }

        let selectedIndex = 0;
        let shouldExit = false;
        let scrollOffset = 0;

        while (!shouldExit) {
            // Clear UI
            clearScreen(screen);

            // Build tree-style content with selection
            const header = [
                { label: 'Head ID', width: 15 },
                { label: 'Status', width: 15 },
                { label: 'Created At', width: 24 },
                { label: 'Nodes', width: 38 },
            ];
            const headerLine = header.map(c => c.label.padEnd(c.width)).join(' ');
            const separator = header.map(c => '─'.repeat(c.width)).join(' ');
            let content = `\n Heads List\n\n ${headerLine}\n ${separator}\n`;

            // Calculate line count per head for scroll calculation
            const linesPerHead: number[] = [];
            heads.forEach((head, index) => {
                const nodes = head.hydraNodes || [];
                const isSelected = index === selectedIndex;
                const selectionMarker = isSelected ? '>' : ' ';

                // Format status with color
                const statusColor = head.status === 'ACTIVE' ? 'green' : 'red';
                const statusText = ` {${statusColor}-fg}${head.status.padEnd(15)}{/} `;
                const createdAtText = formatTime(head.createdAt).padEnd(24);

                let headLines = 0;
                if (nodes.length === 0) {
                    content += `${selectionMarker}${head.id.toString().padEnd(15)}${statusText}${createdAtText}-\n`;
                    headLines = 1;
                } else {
                    const firstNode = nodes[0];
                    const firstNodeText = ` - ws://localhost:${firstNode.port} | #${firstNode.id}`;
                    content += `${selectionMarker}${head.id.toString().padEnd(15)}${statusText}${createdAtText}${firstNodeText}\n`;
                    headLines = 1;

                    for (let i = 1; i < nodes.length; i++) {
                        const node = nodes[i];
                        const nodeText = `  - ws://localhost:${node.port} | #${node.id}`;
                        content += ` ${''.padEnd(15)}${''.padEnd(15)}${''.padEnd(24)} ${nodeText}\n`;
                        headLines++;
                    }
                }

                if (index < heads.length - 1) {
                    content += '\n ';
                    content += separator + '\n';
                    headLines += 2;
                }

                linesPerHead.push(headLines);
            });

            // Calculate scroll position based on selected index
            const screenHeight = typeof screen.height === 'number' ? screen.height : 24;
            const visibleLines = screenHeight - 8; // Subtract header and footer
            const selectedLinePosition = linesPerHead.slice(0, selectedIndex).reduce((sum, lines) => sum + lines, 0);

            // Auto-scroll to keep selected item visible
            if (selectedLinePosition < scrollOffset) {
                scrollOffset = selectedLinePosition;
            } else if (selectedLinePosition >= scrollOffset + visibleLines) {
                scrollOffset = selectedLinePosition - visibleLines + 1;
            }

            const listBox = blessed.box({
                parent: screen,
                content,
                top: 0,
                left: 0,
                width: '100%',
                height: '100%-2',
                scrollable: true,
                alwaysScroll: true,
                scrollbar: {
                    ch: '█',
                    style: { fg: 'blue' },
                },
                keys: true,
                vi: true,
                mouse: true,
                tags: true,
                style: { fg: 'white' },
            });

            // Set scroll position
            listBox.setScrollPerc(scrollOffset > 0 ? (scrollOffset / content.split('\n').length) * 100 : 0);

            blessed.box({
                parent: screen,
                content: 'Use ↑↓ to select | Enter to view details | Any other key to return...',
                bottom: 0,
                left: 0,
                width: '100%',
                height: 1,
                style: { bg: 'blue', fg: 'white' },
            });

            listBox.focus();
            screen.render();

            // Handle key presses
            const action = await new Promise<'up' | 'down' | 'enter' | 'exit'>(resolve => {
                screen.once('keypress', (_ch: any, key: any) => {
                    if (!key) return resolve('exit');
                    if (key.name === 'up' || key.name === 'k') return resolve('up');
                    if (key.name === 'down' || key.name === 'j') return resolve('down');
                    if (key.name === 'enter' || key.name === 'return') return resolve('enter');
                    return resolve('exit');
                });
            });

            if (action === 'up') {
                selectedIndex = Math.max(0, selectedIndex - 1);
            } else if (action === 'down') {
                selectedIndex = Math.min(heads.length - 1, selectedIndex + 1);
            } else if (action === 'enter') {
                await showHeadDetail(screen, api, heads[selectedIndex]);
            } else {
                shouldExit = true;
            }
        }

        clearScreen(screen);
    } catch (error) {
        showError(screen, (error as Error).message);
    }
}

async function showHeadDetail(screen: blessed.Widgets.Screen, api: ApiClient, head: Head): Promise<void> {
    let shouldExit = false;

    while (!shouldExit) {
        clearScreen(screen);

        const nodes = head.hydraNodes || [];
        const statusColor = head.status === 'ACTIVE' ? 'green' : 'red';

        let content = `\n Cluster Detail - ID: ${head.id}\n\n`;
        content += ` Status: {${statusColor}-fg}${head.status}{/}\n`;
        content += ` Created: ${formatTime(head.createdAt)}\n`;
        content += ` Nodes: ${nodes.length}\n\n`;

        if (nodes.length > 0) {
            content += ` Nodes List:\n`;
            nodes.forEach(node => {
                content += `  - ws://localhost:${node.port} | #${node.id} | ${node.description}\n`;
            });
        }

        content += `\n\n Actions:\n`;
        content += `  [S] Stop Cluster\n`;
        content += `  [C] Clear Persistence Data\n`;
        content += `  [R] Start/Restart Cluster\n`;

        blessed.box({
            parent: screen,
            content,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%-2',
            tags: true,
            style: { fg: 'white' },
        });

        blessed.box({
            parent: screen,
            content: 'Press S/C/R for actions | Any other key to return...',
            bottom: 0,
            left: 0,
            width: '100%',
            height: 1,
            style: { bg: 'blue', fg: 'white' },
        });

        screen.render();

        const action = await new Promise<string>(resolve => {
            screen.once('keypress', (_ch: any, key: any) => {
                resolve(key?.name || 'exit');
            });
        });

        if (action === 's') {
            const progress = showProgressBox(screen, 'Stopping cluster...', true);
            try {
                await api.deactiveCluster(head.id);
                progress.setMessage('✓ Cluster stopped successfully');
                progress.updateProgress(100);
                head.status = 'INACTIVE';
                await new Promise(resolve => setTimeout(resolve, 1500));
            } catch (error) {
                progress.setMessage(`✗ Error: ${(error as Error).message}`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            } finally {
                progress.close();
            }
        } else if (action === 'c') {
            const progress = showProgressBox(screen, 'Clearing cluster persistence data...', true);
            try {
                await api.clearClusterPersistence([head.id]);
                progress.setMessage('✓ Cluster persistence data cleared successfully');
                progress.updateProgress(100);
                await new Promise(resolve => setTimeout(resolve, 1500));
            } catch (error) {
                progress.setMessage(`✗ Error: ${(error as Error).message}`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            } finally {
                progress.close();
            }
        } else if (action === 'r') {
            const progress = showProgressBox(screen, 'Starting cluster...', true);
            try {
                await api.activeCluster(head.id);
                progress.setMessage('✓ Cluster started successfully');
                progress.updateProgress(100);
                head.status = 'ACTIVE';
                await new Promise(resolve => setTimeout(resolve, 1500));
            } catch (error) {
                progress.setMessage(`✗ Error: ${(error as Error).message}`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            } finally {
                progress.close();
            }
        } else {
            shouldExit = true;
        }
    }

    clearScreen(screen);
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
