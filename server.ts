import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { createProxyMiddleware } from "http-proxy-middleware";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Helper function for configuring proxies (SSE friendly)
  const buildProxyOpts = (target: string, prefix: string) => ({
    target,
    changeOrigin: true,
    pathRewrite: { [`^${prefix}`]: '' },
    onProxyRes: (proxyRes: any) => {
      // Non-aktifkan buffering Nginx agar SSE stream dapat berjalan lancar tanpa terputus/ditampung dahulu
      proxyRes.headers['x-accel-buffering'] = 'no';
    }
  });

  // IMPORTANT: Proxies MUST be registered BEFORE express.json()
  // Otherwise body-parser consumes the stream and the proxy hangs waiting for body data, causing 504 Timeout.
  app.use('/api/proxy/groq', createProxyMiddleware(buildProxyOpts('https://api.groq.com/openai/v1', '/api/proxy/groq')));
  app.use('/api/proxy/mistral', createProxyMiddleware(buildProxyOpts('https://api.mistral.ai/v1', '/api/proxy/mistral')));
  app.use('/api/proxy/deepseek', createProxyMiddleware(buildProxyOpts('https://api.deepseek.com/v1', '/api/proxy/deepseek')));
  app.use('/api/proxy/openai', createProxyMiddleware(buildProxyOpts('https://api.openai.com/v1', '/api/proxy/openai')));
  app.use('/api/proxy/anthropic', createProxyMiddleware(buildProxyOpts('https://api.anthropic.com', '/api/proxy/anthropic')));

  // Middleware to parse JSON bodies
  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Fullstack server is running!" });
  });

  app.post("/api/terminal", (req, res) => {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ error: "Command is required" });
    }

    exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
      res.json({
        stdout: stdout || "",
        stderr: stderr || "",
        error: error ? error.message : null
      });
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
