import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";

const [, , rootArg, portArg, prefixArg] = process.argv;

if (!rootArg || !portArg) {
  console.error("usage: static-server.ts <dir> <port> [prefix]");
  process.exit(1);
}

const root = normalize(rootArg);
const port = Number(portArg);
const prefix = normalizePrefix(prefixArg ?? "/");

function normalizePrefix(raw: string): string {
  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
  ".ico": "image/x-icon",
};

function contentType(path: string): string {
  return MIME_TYPES[extname(path)] ?? "application/octet-stream";
}

async function resolveFile(urlPath: string): Promise<string | undefined> {
  if (!urlPath.startsWith(prefix)) {
    return undefined;
  }
  const relative = decodeURIComponent(urlPath.slice(prefix.length));
  const target = relative === "" || relative.endsWith("/") ? `${relative}index.html` : relative;
  const resolved = normalize(join(root, target));
  const boundary = root + sep;
  if (resolved !== root && !resolved.startsWith(boundary)) {
    return undefined;
  }
  try {
    const info = await stat(resolved);
    return info.isFile() ? resolved : undefined;
  } catch {
    return undefined;
  }
}

const server = createServer((req, res) => {
  const urlPath = (req.url ?? "/").split("?")[0];
  resolveFile(urlPath)
    .then(async (filePath) => {
      if (!filePath) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      const body = await readFile(filePath);
      res.writeHead(200, { "content-type": contentType(filePath) });
      res.end(body);
    })
    .catch(() => {
      res.writeHead(500);
      res.end("internal error");
    });
});

server.listen(port);
