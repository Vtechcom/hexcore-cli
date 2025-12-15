import { validateMnemonic, generateMnemonic } from 'bip39';

export function validateBIP39Mnemonic(mnemonic: string): boolean {
    return validateMnemonic(mnemonic.trim());
}

export function formatStatus(status: string): string {
    const statusColors: { [key: string]: string } = {
        running: '{green-fg}✓ running{/}',
        stopped: '{red-fg}✗ stopped{/}',
        error: '{red-fg}✗ error{/}',
        active: '{green-fg}✓ active{/}',
        inactive: '{yellow-fg}⚠ inactive{/}',
    };
    return statusColors[status] || status;
}

export function formatTime(dateString: string): string {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString;
        }
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    } catch {
        return dateString;
    }
}

export function getTimeSinceUpdate(seconds: number): string {
    if (seconds < 2) return 'now';
    if (seconds < 60) return `${Math.floor(seconds)}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
}

export function truncate(str: string, length: number): string {
    return str.length > length ? str.substring(0, length - 3) + '...' : str;
}
