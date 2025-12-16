#!/usr/bin/env node

import { Command } from 'commander';
import { ApiClient } from './api/client';
import { Dashboard } from './ui/dashboard';
import { version } from '../package.json';

const program = new Command();

program.version(version).description('Hydra Node Manager CLI');
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

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
