"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToN8n = sendToN8n;
// src/client.ts
const https = require("https");
const http = require("http");
async function sendToN8n(webhookUrl, payload, onProgress) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(payload);
        const url = new URL(webhookUrl);
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
            timeout: 300000, // 5min — génération peut être longue avec qwen2.5:3b
        };
        const lib = url.protocol === 'https:' ? https : http;
        const req = lib.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
                // Parser les chunks pour progress live si n8n streame
                onProgress?.(`Réception des données...`);
            });
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 400) {
                    reject(new Error(`n8n a retourné une erreur ${res.statusCode}: ${data}`));
                    return;
                }
                try {
                    // n8n retourne parfois un tableau
                    const parsed = JSON.parse(data);
                    const result = Array.isArray(parsed) ? parsed[0] : parsed;
                    resolve(result);
                }
                catch {
                    reject(new Error(`Réponse n8n invalide: ${data.slice(0, 200)}`));
                }
            });
        });
        req.on('error', (err) => {
            reject(new Error(`Impossible de joindre n8n: ${err.message}`));
        });
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Timeout — n8n n\'a pas répondu dans les 5 minutes'));
        });
        req.write(body);
        req.end();
    });
}
//# sourceMappingURL=client.js.map