#!/usr/bin/env node
const http = require('http');

const PORT = process.env.PORT || 3456;

const json = obj => JSON.stringify(obj);

const nodes = [
    {
        id: 1,
        description: 'node-1',
        port: 3001,
        vkey: 'v1',
        createdAt: new Date().toISOString(),
        cardanoAccount: { id: 1, baseAddress: 'addr1', pointerAddress: 'ptr1', createdAt: new Date().toISOString() },
        status: 'ACTIVE',
    },
    {
        id: 2,
        description: 'node-2',
        port: 3002,
        vkey: 'v2',
        createdAt: new Date().toISOString(),
        cardanoAccount: { id: 2, baseAddress: 'addr2', pointerAddress: 'ptr2', createdAt: new Date().toISOString() },
        status: 'ACTIVE',
    },
    {
        id: 3,
        description: 'node-3',
        port: 3003,
        vkey: 'v3',
        createdAt: new Date().toISOString(),
        cardanoAccount: { id: 3, baseAddress: 'addr3', pointerAddress: 'ptr3', createdAt: new Date().toISOString() },
        status: 'INACTIVE',
    },
];

const activeNodes = [
    { hydraNodeId: '1', hydraPartyId: 'p1', container: {}, isActive: true },
    { hydraNodeId: '2', hydraPartyId: 'p2', container: {}, isActive: true },
];

const heads = [{ id: '1' }, { id: '2' }, { id: '3' }];

const server = http.createServer((req, res) => {
    const { method, url } = req;

    if (method === 'GET' && url.startsWith('/hydra-main/hydra-nodes')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        // Return a wrapper similar to what ApiClient expects
        res.end(json({ data: { data: nodes } }));
        return;
    }

    if (method === 'GET' && url === '/hydra-main/active-nodes') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(json({ data: activeNodes }));
        return;
    }

    if (method === 'GET' && url === '/hydra-main/list-party') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(json({ data: heads }));
        return;
    }

    if (method === 'POST' && url === '/hydra-main/login') {
        // Simple login stub
        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(json({ data: { accessToken: 'mock-token' }, statusCode: 200, message: 'ok', status: 'success' }));
        });
        return;
    }

    // Default - not found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(json({ message: 'Not found' }));
});

server.listen(PORT, () => {
    console.log(`Mock server listening on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
    server.close(() => process.exit(0));
});
