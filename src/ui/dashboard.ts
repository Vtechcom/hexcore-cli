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
            if (this.currentView === 'menu') {
                this.menuSelection = Math.max(1, this.menuSelection - 1);
                if (this.menuControls) this.menuControls.updateMenuSelection(this.menuSelection);
            }
        });

        this.screen.key(['down', 'j'], () => {
            if (this.currentView === 'menu') {
                this.menuSelection = Math.min(6, this.menuSelection + 1);
                if (this.menuControls) this.menuControls.updateMenuSelection(this.menuSelection);
            }
        });

        this.screen.key(['enter', 'space'], () => {
            if (this.currentView === 'menu') {
                this.handleMenuSelection(this.menuSelection);
            }
        });

        this.screen.key(['1', '2', '3', '4', '5', '6'], ch => {
            if (this.currentView === 'menu') {
                this.menuSelection = parseInt(ch);
                this.handleMenuSelection(this.menuSelection);
            }
        });
    }

    private async renderMenu(): Promise<void> {
        // Avoid recreating the screen (prevents flicker). Clear children instead and reuse keybindings.
        // screen is created at construction-time and key bindings are already set.
        // clearScreen will detach existing boxes without destroying the terminal.
        clearScreen(this.screen);

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
                // update only
                this.menuControls.updateStatus(status, this.lastUpdate);
                this.menuControls.updateMenuSelection(this.menuSelection);
                this.lastStatusSnapshot = {
                    runningNodes: status.runningNodes,
                    runningHeads: status.runningHeads,
                    totalHeads: status.totalHeads,
                    status: status.status,
                };
            }
        } catch (error) {
            showError(this.screen, 'Connection failed');
        }
    }

    private async handleMenuSelection(selection: number): Promise<void> {
        this.currentView = 'menu';
        switch (selection) {
            case 1:
                await showCreateHeadFlow(this.screen, this.api);
                break;
            case 2:
                await showHeadsList(this.screen, this.api);
                break;
            case 3:
                await showStopHeadFlow(this.screen, this.api);
                break;
            case 4:
                await showAccountsFlow(this.screen, this.api);
                break;
            case 5:
                await showNodesList(this.screen, this.api);
                break;
            case 6:
                await showStatus(this.screen, this.api);
                break;
        }
        await this.renderMenu();
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
