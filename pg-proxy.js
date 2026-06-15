/**
 * pg-proxy.js - PostgreSQL TCP proxy via WSL2 bridge
 * 
 * For each incoming connection on Windows localhost:5432,
 * spawns a WSL2 netcat process that connects to PostgreSQL
 * running inside WSL2 at localhost:5432.
 * 
 * This bypasses the Windows-to-WSL2 IP routing restriction.
 * WSL2 processes CAN connect to WSL2 localhost — Windows processes cannot.
 */
const net = require('net');
const { spawn } = require('child_process');

const LISTEN_HOST = '127.0.0.1';
const LISTEN_PORT = 5432;

// Check if wsl is available and nc is in WSL2
const { execSync } = require('child_process');
try {
    execSync('wsl -d Ubuntu -- bash -c "which nc"', { encoding: 'utf8', timeout: 5000 });
    console.log('[pg-relay] nc found in WSL2, using WSL2 bridge mode');
} catch(e) {
    // Install netcat-openbsd if not present
    try {
        execSync('wsl -d Ubuntu -u root -- bash -c "apt-get install -y netcat-openbsd > /dev/null 2>&1"', { timeout: 30000 });
    } catch(_) {}
}

const server = net.createServer((clientSocket) => {
    // Spawn nc inside WSL2 — it can connect to 127.0.0.1:5432 within WSL2
    const nc = spawn('wsl', ['-d', 'Ubuntu', '--', 'nc', '127.0.0.1', '5432'], {
        stdio: ['pipe', 'pipe', 'ignore']
    });
    
    if (!nc.pid) {
        console.error('[pg-relay] Failed to spawn wsl nc');
        clientSocket.destroy();
        return;
    }

    // Pipe: clientSocket <-> WSL2 nc <-> PostgreSQL
    clientSocket.pipe(nc.stdin);
    nc.stdout.pipe(clientSocket);
    
    const cleanup = () => {
        try { nc.kill(); } catch(_) {}
        try { clientSocket.destroy(); } catch(_) {}
    };
    
    clientSocket.on('error', cleanup);
    clientSocket.on('close', cleanup);
    nc.on('error', (e) => { console.error('[pg-relay] nc error:', e.message); cleanup(); });
    nc.on('close', () => { try { clientSocket.destroy(); } catch(_) {} });
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.log(`[pg-relay] Port ${LISTEN_PORT} in use (wslrelay.exe may be holding it)`);
        console.log('[pg-relay] Waiting for port to be free...');
        setTimeout(() => {
            server.close();
            server.listen(LISTEN_PORT, LISTEN_HOST);
        }, 3000);
    } else {
        console.error('[pg-relay] Error:', e.message);
    }
});

server.listen(LISTEN_PORT, LISTEN_HOST, () => {
    console.log(`[pg-relay] Listening on ${LISTEN_HOST}:${LISTEN_PORT}`);
    console.log('[pg-relay] Routing via WSL2 nc bridge to PostgreSQL');
    console.log('[pg-relay] Keep this running while using MR-Fit.');
});
