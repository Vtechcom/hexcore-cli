#!/usr/bin/env node
const { ApiClient } = require('../dist/src/api/client.js');
const { Dashboard } = require('../dist/src/ui/dashboard.js');

(async function () {
    const api = new ApiClient({ url: 'http://localhost:3456' });
    const dashboard = new Dashboard({ api });
    await dashboard.start();

    const screen = dashboard.screen;

    console.log('Starting smoke flow: selecting 6 (Status)');
    const promise = dashboard.handleMenuSelection(6);

    // Simulate pressing a key to close the status view, then a follow-up press
    setImmediate(() => screen.emit('keypress', 'enter', { name: 'enter' }));
    setImmediate(() => screen.emit('keypress', 'enter', { name: 'enter' }));

    await promise;
    console.log('Smoke flow complete. Current view:', dashboard.currentView);
    dashboard.destroy();
    process.exit(0);
})();
