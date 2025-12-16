#!/usr/bin/env node

import { Command } from 'commander';
import { ApiClient } from './api/client';
import { Dashboard } from './ui/dashboard';

const program = new Command();

program.version('1.0.0').description('Hydra Node Manager CLI');

program
    .command('start')
    .description('Start the interactive dashboard')
    .requiredOption('--url <url>', 'API server URL (e.g., https://api.hexcore.io.vn)')
    .option('-u, --username <username>', 'Username for authentication')
    .option('-p, --password <password>', 'Password for authentication')
    .option('-bf, --blockfrost-api-key <key>', 'Blockfrost API key for Cardano network access')
    .action(async options => {
        try {
            const url = options.url;
            // Create API client with URL configuration
            const apiClient = new ApiClient({
                url: url,
                username: options.username,
                password: options.password,
                blockfrostApiKey: options.blockfrostApiKey,
            });

            // Login if credentials provided
            if (options.username && options.password) {
                console.log('Authenticating...');
                await apiClient.login();
            }

            const dashboard = new Dashboard({
                api: apiClient,
            });

            await dashboard.start();
        } catch (error) {
            console.error(`Error: ${(error as Error).message}`);
            process.exit(1);
        }
    });

program
    .command('head')
    .description('Manage Hydra heads')
    .addCommand(
        new Command('create')
            .description('Create a new Hydra head')
            .requiredOption('--url <url>', 'API server URL (e.g., https://api.hexcore.io.vn)')
            .option('-u, --username <username>', 'Username for authentication')
            .option('-p, --password <password>', 'Password for authentication')
            .requiredOption('--accounts <ids>', 'Comma-separated account IDs')
            .action(async options => {
                try {
                    const apiClient = new ApiClient({
                        url: options.url,
                        username: options.username,
                        password: options.password,
                    });
                    const accountIds = options.accounts.split(',').map((id: string) => id.trim());
                    const head = await apiClient.createHead(accountIds);
                    console.log(`✓ Head created: ${head.id}`);
                } catch (error) {
                    console.error(`Error: ${(error as Error).message}`);
                    process.exit(1);
                }
            }),
    )
    .addCommand(
        new Command('list')
            .alias('ls')
            .description('List all Hydra heads')
            .requiredOption('--url <url>', 'API server URL (e.g., https://api.hexcore.io.vn)')
            .option('-u, --username <username>', 'Username for authentication')
            .option('-p, --password <password>', 'Password for authentication')
            .action(async options => {
                try {
                    const apiClient = new ApiClient({
                        url: options.url,
                        username: options.username,
                        password: options.password,
                    });
                    const heads = await apiClient.getHeads();
                    console.log('\n📋 Hydra Heads:\n');
                    console.log('HeadID'.padEnd(20) + 'Status'.padEnd(15) + 'Created');
                    console.log('─'.repeat(55));
                    heads.forEach(head => {
                        const status = head.status.padEnd(15);
                        const created = new Date(head.createdAt).toLocaleString();
                        console.log(head.id + status + created);
                    });
                    console.log();
                } catch (error) {
                    console.error(`Error: ${(error as Error).message}`);
                    process.exit(1);
                }
            }),
    )
    .addCommand(
        new Command('stop <head-id>')
            .description('Stop a Hydra head')
            .requiredOption('--url <url>', 'API server URL (e.g., https://api.hexcore.io.vn)')
            .option('-u, --username <username>', 'Username for authentication')
            .option('-p, --password <password>', 'Password for authentication')
            .option('--force', 'Skip confirmation')
            .action(async (headId: string, options) => {
                try {
                    const apiClient = new ApiClient({
                        url: options.url,
                        username: options.username,
                        password: options.password,
                    });
                    await apiClient.stopHead(headId);
                    console.log(`✓ Head '${headId}' stopped`);
                } catch (error) {
                    console.error(`Error: ${(error as Error).message}`);
                    process.exit(1);
                }
            }),
    )
    .addCommand(
        new Command('info <head-id>')
            .description('Show Hydra head details')
            .requiredOption('--url <url>', 'API server URL (e.g., https://api.hexcore.io.vn)')
            .option('-u, --username <username>', 'Username for authentication')
            .option('-p, --password <password>', 'Password for authentication')
            .action(async (headId: string, options) => {
                try {
                    const apiClient = new ApiClient({
                        url: options.url,
                        username: options.username,
                        password: options.password,
                    });
                    const head = await apiClient.getHeadInfo(headId);
                    console.log(`\n📋 Head: ${head.id}`);
                    console.log(`Status: ${head.status}`);
                    console.log(`Created: ${new Date(head.createdAt).toLocaleString()}`);
                } catch (error) {
                    console.error(`Error: ${(error as Error).message}`);
                    process.exit(1);
                }
            }),
    );

program
    .command('account')
    .description('Manage wallet accounts')
    .addCommand(
        new Command('add')
            .description('Add a new wallet account')
            .requiredOption('--url <url>', 'API server URL (e.g., https://api.hexcore.io.vn)')
            .option('-u, --username <username>', 'Username for authentication')
            .option('-p, --password <password>', 'Password for authentication')
            .requiredOption('--mnemonic <phrase>', 'BIP39 mnemonic phrase')
            .action(async options => {
                try {
                    const apiClient = new ApiClient({
                        url: options.url,
                        username: options.username,
                        password: options.password,
                    });
                    const account = await apiClient.addAccount(options.mnemonic);
                    console.log(`✓ Account added: ${account.id}`);
                } catch (error) {
                    console.error(`Error: ${(error as Error).message}`);
                    process.exit(1);
                }
            }),
    )
    .addCommand(
        new Command('list')
            .alias('ls')
            .description('List all accounts')
            .requiredOption('--url <url>', 'API server URL (e.g., https://api.hexcore.io.vn)')
            .option('-u, --username <username>', 'Username for authentication')
            .option('-p, --password <password>', 'Password for authentication')
            .action(async options => {
                try {
                    const apiClient = new ApiClient({
                        url: options.url,
                        username: options.username,
                        password: options.password,
                    });
                    const accounts = await apiClient.getAccounts();
                    console.log('\n💰 Wallet Accounts:\n');
                    console.log('ID'.padEnd(12) + 'Base Address'.padEnd(68) + 'Created');
                    console.log('─'.repeat(100));
                    accounts.forEach(account => {
                        console.log(
                            account.id.toString().padEnd(12) +
                                account.baseAddress.padEnd(68) +
                                new Date(account.createdAt).toLocaleString(),
                        );
                    });
                    console.log();
                } catch (error) {
                    console.error(`Error: ${(error as Error).message}`);
                    process.exit(1);
                }
            }),
    );

program
    .command('node')
    .description('View node information')
    .addCommand(
        new Command('list')
            .alias('ls')
            .description('List all nodes')
            .requiredOption('--url <url>', 'API server URL (e.g., https://api.hexcore.io.vn)')
            .option('-u, --username <username>', 'Username for authentication')
            .option('-p, --password <password>', 'Password for authentication')
            .action(async options => {
                try {
                    const apiClient = new ApiClient({
                        url: options.url,
                        username: options.username,
                        password: options.password,
                    });
                    const nodes = await apiClient.getNodes();
                    console.log('\n🔗 Nodes:\n');
                    console.log(
                        'Node ID'.padEnd(12) +
                            'Description'.padEnd(36) +
                            'Port'.padEnd(8) +
                            'Account'.padEnd(44) +
                            'Status',
                    );
                    console.log('─'.repeat(110));
                    nodes.forEach(node => {
                        console.log(
                            node.id.toString().padEnd(12) +
                                (node.description || '').padEnd(36) +
                                node.port.toString().padEnd(8) +
                                (node.cardanoAccount?.baseAddress || '-').padEnd(44) +
                                node.status,
                        );
                    });
                    console.log();
                } catch (error) {
                    console.error(`Error: ${(error as Error).message}`);
                    process.exit(1);
                }
            }),
    );

program
    .command('status')
    .description('Show system health status')
    .requiredOption('--url <url>', 'API server URL (e.g., https://api.hexcore.io.vn)')
    .option('-u, --username <username>', 'Username for authentication')
    .option('-p, --password <password>', 'Password for authentication')
    .action(async options => {
        try {
            const apiClient = new ApiClient({
                url: options.url,
                username: options.username,
                password: options.password,
            });
            const status = await apiClient.getSystemStatus();
            console.log('\n📊 System Status:\n');
            console.log(`Running Nodes: ${status.runningNodes}`);
            console.log(`Running Heads: ${status.runningHeads}`);
            console.log(`Total Heads:   ${status.totalHeads}`);
            console.log(`Status:        ${status.status === 'healthy' ? '✓ Healthy' : '✗ Error'}`);
            console.log();
        } catch (error) {
            console.error(`Error: ${(error as Error).message}`);
            process.exit(1);
        }
    });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
