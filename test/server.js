const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.PORT || 3009;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Special route to serve config with .env values
    if (req.url === '/config.js') {
        const tbClientUrl = process.env.TB_CLIENT_URL || 'demo.thingsboard.io';
        
        const configContent = `// Configuration file - Auto-generated from .env
// This file is dynamically served by server.js

const CONFIG = {
    // Loaded from .env TB_CLIENT_URL
    TB_CLIENT_URL: '${tbClientUrl}',
};

console.log('Configuration loaded:', CONFIG);
`;
        
        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.end(configContent);
        return;
    }

    // Determine the file path
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    // Get the file extension
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // Read and serve the file
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🚀 ThingsBoard JS SDK Test Server');
    console.log('='.repeat(60));
    console.log(`📡 Server running at: http://localhost:${PORT}/`);
    console.log(`🔧 TB_CLIENT_URL: ${process.env.TB_CLIENT_URL || 'Not set in .env'}`);
    console.log('='.repeat(60));
    console.log('\n✨ Open your browser and navigate to the URL above\n');
});
