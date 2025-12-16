import * as blessed from 'blessed';
import { ApiClient } from '../../api/client';
import {
    displayList,
    showError,
    showMessage,
    waitForKeyPress,
    clearScreen,
    showProgressBox,
    ProgressBoxControls,
} from './common';
import { formatDate, formatId } from '../../utils/format';
import { WalletAccount } from '../../interfaces/wallet-account.type';
import { Converter } from '@hydra-sdk/core';
import { BigNumber } from 'bignumber.js';

/**
 * Accounts management component
 */

export async function showAccountsFlow(screen: blessed.Widgets.Screen, api: ApiClient): Promise<void> {
    try {
        let shouldExit = false;
        let accounts: WalletAccount[] = [];
        accounts = await api.getAccounts();

        while (!shouldExit) {
            // Clear UI to avoid destroying the terminal (prevents flicker)
            clearScreen(screen);
            // Render accounts table
            renderTable(accounts);

            // Wait for keypress
            const shouldFetch = await new Promise<boolean>(resolve => {
                screen.once('keypress', (_ch: any, key: any) => {
                    if (key && key.name === 'u') {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                });
            });

            if (shouldFetch) {
                // Show progress box
                const progress = showProgressBox(screen, 'Fetching UTxO from blockchain...', true);
                await fetchUtxo(accounts, progress);
            } else {
                shouldExit = true;
            }
        }

        // clear the list to return to menu without destroying the terminal
        clearScreen(screen);
    } catch (error) {
        showError(screen, (error as Error).message);
    }

    function renderTable(accounts: WalletAccount[]): void {
        // Create list content
        const header = [
            { label: 'Account ID', width: 12 },
            { label: 'Base Address', width: 24 },
            { label: 'Enterprise Address', width: 64 },
            { label: 'Ada', width: 16 },
            { label: 'Created', width: 20 },
        ];
        const rows = accounts
            .sort((a, b) => b.id - a.id)
            .map(a => {
                const utxos = Converter.convertUTxOObjectToUTxO(a.utxo || {});
                const totalLovelace = utxos.reduce((sum, u) => sum + Number(u.output.amount[0]?.quantity || 0), 0);
                return [
                    a.id.toString(),
                    formatId(a.baseAddress, 8, 8),
                    a.pointerAddress,
                    BigNumber(totalLovelace).dividedBy(1_000_000).toFormat(6),
                    formatDate(a.createdAt),
                ];
            });

        const headerLine = header.map(c => c.label.padEnd(c.width)).join(' ');
        const separator = header.map(c => '─'.repeat(c.width)).join(' ');

        let content = `\n Accounts\n\n ${headerLine}\n ${separator}\n`;
        rows.forEach(row => {
            const line = header.map((c, i) => (row[i] || '').toString().padEnd(c.width)).join(' ');
            content += ` ${line}\n`;
        });

        blessed.box({
            parent: screen,
            content,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%-2',
            scrollable: true,
            style: { fg: 'white' },
        });

        // Custom footer with 'u' instruction
        blessed.box({
            parent: screen,
            content: "Press 'u' to fetch UTxO | Any other key to return...",
            bottom: 0,
            left: 0,
            width: '100%',
            height: 1,
            style: { bg: 'blue', fg: 'white' },
        });

        screen.render();
    }

    async function fetchUtxo(accounts: WalletAccount[], progress: ProgressBoxControls) {
        const totalAccounts = accounts.length;
        let doneAccounts = 0;

        const tasks = accounts.map((account, index) => {
            return new Promise<WalletAccount>(resolve => {
                // Simulate network delay
                api.fetchUtxoByAddress(account.pointerAddress)
                    .then(utxo => {
                        // Here you would normally process the UTxO data
                        // For this example, we just log the count
                        account.utxo = utxo;
                        const utxos = Converter.convertUTxOObjectToUTxO(utxo);
                        const totalLovelace = utxos.reduce(
                            (sum, u) => sum + Number(u.output.amount[0]?.quantity || 0),
                            0,
                        );
                        progress.setMessage(
                            `Fetched UTxO for account ${account.id} (${utxos.length} UTxOs, ${BigNumber(totalLovelace).dividedBy(1_000_000).toString()} ADA)`,
                        );
                    })
                    .catch(err => {
                        progress.setMessage(
                            `Failed to fetch UTxO for account ${account.id}: ${(err as Error).message}`,
                        );
                    })
                    .finally(() => {
                        doneAccounts++;
                        const progressPercent = Math.floor((doneAccounts / totalAccounts) * 100);
                        renderTable(accounts);
                        progress.updateProgress(progressPercent);
                        resolve(account);
                    });
            });
        });

        accounts = await Promise.all(tasks);
        progress.updateProgress(100);

        // Small delay to allow user to see 100% completion
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}
