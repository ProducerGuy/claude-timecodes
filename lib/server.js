import { createServer } from "http";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  getAllSessions,
  enrichSession,
  loadSession,
  extractText,
  findSessionFile,
} from "./sessions.js";
import { getDisplayName } from "./config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function startServer(port) {
  const viewerHtml = readFileSync(
    join(__dirname, "..", "viewer.html"),
    "utf-8"
  );

  const server = createServer((req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    const path = url.pathname;

    if (path === "/" || path === "/index.html") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(viewerHtml);
      return;
    }

    if (path === "/api/config") {
      jsonResponse(res, { displayName: getDisplayName() });
      return;
    }

    if (path === "/api/sessions") {
      const sessions = getAllSessions();
      const enriched = sessions
        .map(enrichSession)
        .filter((e) => e && e.firstTs)
        .map((e) => ({
          session_id: e.sessionId,
          first_ts: e.firstTs.toISOString(),
          last_ts: e.lastTs?.toISOString() || null,
          message_count: e.messageCount,
          preview: e.preview,
        }))
        .sort((a, b) => (b.first_ts > a.first_ts ? 1 : -1));
      jsonResponse(res, enriched);
      return;
    }

    if (path.startsWith("/api/session/")) {
      const sessionId = path.slice("/api/session/".length);
      const file = findSessionFile(sessionId);
      if (!file) {
        jsonResponse(res, [], 404);
        return;
      }
      const messages = loadSession(file).map((msg) => ({
        type: msg.type,
        timestamp: msg.timestamp,
        message: { content: msg.message?.content || "" },
      }));
      jsonResponse(res, messages);
      return;
    }

    if (path === "/api/search") {
      const query = (url.searchParams.get("q") || "").toLowerCase();
      const results = [];
      for (const info of getAllSessions()) {
        for (const msg of loadSession(info.path)) {
          const content = extractText(msg.message?.content || "");
          if (query && !content.toLowerCase().includes(query)) continue;
          results.push({
            timestamp: msg.timestamp,
            type: msg.type,
            content: content.slice(0, 300),
            session_id: info.sessionId,
          });
        }
      }
      results.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
      jsonResponse(res, results.slice(0, 200));
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  });

  server.listen(port, "127.0.0.1", () => {
    const url = `http://127.0.0.1:${port}`;
    console.log(`Claude Timecodes viewer running at ${url}`);
    console.log("Press Ctrl+C to stop");
    const openCmd = process.platform === "darwin" ? "open"
      : process.platform === "win32" ? "start"
      : "xdg-open";
    import("child_process").then(({ exec }) => exec(`${openCmd} ${url}`));
  });
}

function jsonResponse(res, data, code = 200) {
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(data));
}
