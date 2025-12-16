import * as blessed from 'blessed';
import { ApiClient, SystemStatus } from '../api/client';
import {
    createMenuScreen,
    showCreateHeadFlow,
    showHeadsList,
    showStopHeadFlow,
    showAccountsFlow,
    showNodesList,
    showStatus,
    showError,
    waitForKeyPress,
    clearScreen,
} from './components';
import { WalletAccount } from '../interfaces/wallet-account.type';

export interface DashboardConfig {
    api: ApiClient;
    host?: string;
    port?: number;
}

export class Dashboard {
    private screen: blessed.Widgets.Screen;
    private api: ApiClient;
    private updateInterval: NodeJS.Timeout | null = null;
    private lastStatusPoll: NodeJS.Timeout | null = null;
    private lastUpdate: Date = new Date();
    private currentView: 'menu' | 'heads' | 'accounts' | 'nodes' | 'status' = 'menu';
    private menuSelection: number = 1;
    private suppressNextKeypress: boolean = false;
    private selectedHeadId: string | null = null;
    private menuControls?: {
        updateMenuSelection: (selection: number) => void;
        updateStatus: (s: SystemStatus, t: Date) => void;
    };
    private lastStatusSnapshot?: {
        runningNodes: number;
        runningHeads: number;
        totalHeads: number;
        status: string;
    } | null = null;

    // Setup datasource
    private walletAccounts: WalletAccount[] = [];

    constructor(config: DashboardConfig) {
        this.api = config.api;
        this.screen = blessed.screen({
            mouse: true,
            title: 'hexcore-cli - Hydra Node Manager',
            smartCSR: true,
        });

        this.setupKeyBindings();
    }

    async start(): Promise<void> {
        await this.renderMenu();
        this.startAutoUpdate();
    }

    private setupKeyBindings(): void {
        this.screen.key(['escape', 'q', 'C-c'], () => {
            this.screen.destroy();
            console.log('✓ CLI exited (processes continue)');
            process.exit(0);
        });

        this.screen.key(['up', 'k'], () => {
            if (this.currentView !== 'menu') return;
            if (this.suppressNextKeypress) {
                this.suppressNextKeypress = false;
                return;
            }
            this.menuSelection = Math.max(1, this.menuSelection - 1);
            if (this.menuControls) this.menuControls.updateMenuSelection(this.menuSelection);
        });

        this.screen.key(['down', 'j'], () => {
            if (this.currentView !== 'menu') return;
            if (this.suppressNextKeypress) {
                this.suppressNextKeypress = false;
                return;
            }
            this.menuSelection = Math.min(6, this.menuSelection + 1);
            if (this.menuControls) this.menuControls.updateMenuSelection(this.menuSelection);
        });

        this.screen.key(['enter', 'space'], () => {
            if (this.currentView !== 'menu') return;
            if (this.suppressNextKeypress) {
                this.suppressNextKeypress = false;
                return;
            }
            this.handleMenuSelection(this.menuSelection);
        });

        this.screen.key(['1', '2', '3', '4', '5', '6'], ch => {
            if (this.currentView !== 'menu') return;
            if (this.suppressNextKeypress) {
                this.suppressNextKeypress = false;
                return;
            }
            this.menuSelection = parseInt(ch);
            this.handleMenuSelection(this.menuSelection);
        });
    }

    private async renderMenu(): Promise<void> {
        // Avoid recreating the screen (prevents flicker). Clear children instead and reuse keybindings.
        // screen is created at construction-time and key bindings are already set.
        // clearScreen will detach existing boxes without destroying the terminal.
        clearScreen(this.screen);

        // Show an immediate loading indicator to avoid a blank screen while
        // we fetch status from the API (network delays can leave the UI empty).
        const loading = blessed.box({
            parent: this.screen,
            content: '\n   Loading...',
            top: 'center',
            left: 'center',
            width: 24,
            height: 5,
            border: 'line',
            style: { fg: 'white' },
        });
        this.screen.render();

        try {
            const status = await this.api.getSystemStatus();
            this.lastUpdate = new Date();
            if (!this.menuControls) {
                // initial render
                clearScreen(this.screen);
                this.menuControls = createMenuScreen(this.screen, status, this.menuSelection, this.lastUpdate);
                this.lastStatusSnapshot = {
                    runningNodes: status.runningNodes,
                    runningHeads: status.runningHeads,
                    totalHeads: status.totalHeads,
                    status: status.status,
                };
            } else {
                // Re-render menu because clearScreen() detached everything
                clearScreen(this.screen);
                this.menuControls = createMenuScreen(this.screen, status, this.menuSelection, this.lastUpdate);
                this.lastStatusSnapshot = {
                    runningNodes: status.runningNodes,
                    runningHeads: status.runningHeads,
                    totalHeads: status.totalHeads,
                    status: status.status,
                };
            }
        } catch (error) {
            // Remove loading box before showing error
            try {
                loading.detach();
            } catch (e) {
                // ignore
            }
            clearScreen(this.screen);
            showError(this.screen, 'Connection failed');
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Retry rendering menu without loading
            if (!this.menuControls) {
                // If we never got initial menu, we need to exit
                this.screen.destroy();
                console.error('Failed to connect to Hexcore API');
                process.exit(1);
            }
        } finally {
            // Ensure the transient loading indicator is removed after the fetch.
            try {
                loading.detach();
            } catch (e) {
                // ignore
            }
            this.screen.render();
        }
    }

    private async handleMenuSelection(selection: number): Promise<void> {
        try {
            switch (selection) {
                case 1:
                    this.currentView = 'heads';
                    await showCreateHeadFlow(this.screen, this.api);
                    break;
                case 2:
                    this.currentView = 'heads';
                    await showHeadsList(this.screen, this.api);
                    break;
                case 3:
                    this.currentView = 'heads';
                    await showStopHeadFlow(this.screen, this.api);
                    break;
                case 4:
                    this.currentView = 'accounts';
                    await showAccountsFlow(this.screen, this.api);
                    break;
                case 5:
                    this.currentView = 'nodes';
                    await showNodesList(this.screen, this.api);
                    break;
                case 6:
                    this.currentView = 'status';
                    await showStatus(this.screen, this.api);
                    break;
            }
        } finally {
            // Prevent the key that closed the view from immediately retriggering
            // a menu action (e.g., pressing Enter/Space which also acts as "select").
            this.suppressNextKeypress = true;
            this.currentView = 'menu';
            await this.renderMenu();
        }
    }

    private startAutoUpdate(): void {
        // Full render less frequently
        this.updateInterval = setInterval(async () => {
            if (this.currentView === 'menu') {
                await this.renderMenu();
            }
        }, 30000);

        // Background status poller (runs more often and updates only status if changed)
        this.lastStatusPoll = setInterval(async () => {
            if (this.currentView !== 'menu') return;
            try {
                const status = await this.api.getSystemStatus();
                const snapshot = {
                    runningNodes: status.runningNodes,
                    runningHeads: status.runningHeads,
                    totalHeads: status.totalHeads,
                    status: status.status,
                };
                const changed = JSON.stringify(snapshot) !== JSON.stringify(this.lastStatusSnapshot);
                if (changed && this.menuControls) {
                    this.lastUpdate = new Date();
                    this.menuControls.updateStatus(status, this.lastUpdate);
                    this.lastStatusSnapshot = snapshot;
                }
            } catch (e) {
                // ignore background errors to avoid UI disruptions
            }
        }, 5000);
    }

    destroy(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.screen) {
            this.screen.destroy();
        }
    }
}
