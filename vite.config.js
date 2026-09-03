import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function imageUploadPlugin() {
  return {
    name: 'image-upload-handler',
    configureServer(server) {
      // 1. Banner Upload Endpoint
      server.middlewares.use('/api/upload-banner', (req, res) => {
        handleUpload(req, res, 'image promotion', 'promo');
      });

      // 2. Product Image Upload Endpoint
      server.middlewares.use('/api/upload-product-image', (req, res) => {
        handleUpload(req, res, 'image prodacts', 'prd');
      });

      // 3. Delivery Evidence Image Upload Endpoint
      server.middlewares.use('/api/upload-delivery-image', (req, res) => {
        handleUpload(req, res, 'image delivery', 'delivery');
      });

      function handleUpload(req, res, targetFolderName, prefix) {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', () => {
          try {
            const { imageBase64, fileName } = JSON.parse(body);
            if (!imageBase64) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing imageBase64' }));
              return;
            }

            // Extract base64 data
            const matches = imageBase64.match(/^data:([A-Za-z\-+\/]+);base64,(.+)$/);
            const ext = matches ? (matches[1].split('/')[1] || 'jpg').replace('jpeg', 'jpg') : 'jpg';
            const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(imageBase64, 'base64');
            
            const sanitizedName = fileName 
              ? fileName.replace(/[^a-zA-Z0-9_-]/g, '_') + '.' + ext
              : `${prefix}_${Date.now()}.${ext}`;

            // 1. Save into project root target folder
            const rootDir = path.resolve(__dirname, targetFolderName);
            if (!fs.existsSync(rootDir)) {
              fs.mkdirSync(rootDir, { recursive: true });
            }
            const targetRootPath = path.join(rootDir, sanitizedName);
            fs.writeFileSync(targetRootPath, buffer);

            // 2. Also save into "public/<targetFolder>" folder for live static URL access
            const publicDir = path.resolve(__dirname, 'public', targetFolderName);
            if (!fs.existsSync(publicDir)) {
              fs.mkdirSync(publicDir, { recursive: true });
            }
            const targetPublicPath = path.join(publicDir, sanitizedName);
            fs.writeFileSync(targetPublicPath, buffer);

            const fileUrl = `/${targetFolderName}/${sanitizedName}`;

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              url: fileUrl,
              fileName: sanitizedName,
              savedTo: targetRootPath
            }));
          } catch (err) {
            console.error(`Error saving image to ${targetFolderName}:`, err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      }
    }
  };
}
function sharedDataStorePlugin() {
  const dbDir = path.resolve(__dirname, 'server_data');
  const dbFile = path.join(dbDir, 'store_db.json');

  const readDb = () => {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    if (!fs.existsSync(dbFile)) {
      return null;
    }
    try {
      const content = fs.readFileSync(dbFile, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Error reading store_db.json:', e);
      return null;
    }
  };

  const writeDb = (data) => {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const payload = {
      ...data,
      lastUpdated: Date.now()
    };
    fs.writeFileSync(dbFile, JSON.stringify(payload, null, 2), 'utf-8');
    return payload;
  };

  return {
    name: 'shared-datastore-handler',
    configureServer(server) {
      server.middlewares.use('/api/db', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'GET') {
          const currentDb = readDb();
          res.statusCode = 200;
          res.end(JSON.stringify(currentDb || { empty: true }));
          return;
        }

        if (req.method === 'POST' || req.method === 'PUT') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const incoming = JSON.parse(body);
              const existing = readDb() || {};
              const merged = {
                ...existing,
                ...incoming
              };
              const saved = writeDb(merged);
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, lastUpdated: saved.lastUpdated }));
            } catch (err) {
              console.error('Error in /api/db write:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      });
    }
  };
}

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/v8onlinemart.github.io/' : '/',
  plugins: [react(), imageUploadPlugin(), sharedDataStorePlugin()],
  server: {
    host: true, // Exposes server to local network (0.0.0.0) for phone access
    port: 3000,
    open: true
  }
}));



