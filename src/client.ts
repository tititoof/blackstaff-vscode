// src/client.ts
import * as https from 'https';
import * as http  from 'http';

export interface BlackstaffRequest {
  project:     string;
  instruction: string;
  mode:        string;
  type:        string;
}

export interface BlackstaffFileResult {
  file:   string;
  status: string;
  errors: string[];
}

export interface BlackstaffResponse {
  ok:       boolean;
  total:    number;
  success:  number;
  warnings: number;
  failed:   number;
  files:    BlackstaffFileResult[];
  message:  string;
  // Pour le mode thinking : tâches décomposées
  tasks?:   BlackstaffTask[];
}

export interface BlackstaffTask {
  id:          number;
  title:       string;
  instruction: string;
  status:      'pending' | 'done' | 'error';
  files?:      BlackstaffFileResult[];
}

export async function sendToN8n(
  webhookUrl: string,
  payload: BlackstaffRequest,
  onProgress?: (msg: string) => void
): Promise<BlackstaffResponse> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const url  = new URL(webhookUrl);

    const options: http.RequestOptions = {
      hostname: url.hostname,
      port:     url.port || (url.protocol === 'https:' ? 443 : 80),
      path:     url.pathname + url.search,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 300_000,
    };

    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
        onProgress?.('Réception des données...');
      });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`n8n a retourné une erreur ${res.statusCode}: ${data}`));
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const result = Array.isArray(parsed) ? parsed[0] : parsed;
          resolve(result as BlackstaffResponse);
        } catch {
          reject(new Error(`Réponse n8n invalide: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error',   (err) => reject(new Error(`Impossible de joindre n8n: ${err.message}`)));
    req.on('timeout', ()    => { req.destroy(); reject(new Error('Timeout — n8n n\'a pas répondu dans les 5 minutes')); });

    req.write(body);
    req.end();
  });
}