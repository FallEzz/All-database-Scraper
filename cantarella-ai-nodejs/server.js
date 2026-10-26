const http = require("http");
const { MultiProviderChatbot, PROVIDERS } = require("./chatbot");

const PUBLIC_HOST = process.env.PUBLIC_HOST || "213.163.205.9";
const PORT = parseInt(process.env.PORT || "80", 10);
const ALT_PORT = parseInt(process.env.ALT_PORT || "8000", 10);

// Menyimpan sesi chatbot berdasarkan session_id
const SESSIONS = new Map();

function getOrCreateSession(sessionId, systemPrompt = "") {
  if (!SESSIONS.has(sessionId)) {
    SESSIONS.set(
      sessionId,
      systemPrompt
        ? new MultiProviderChatbot(systemPrompt)
        : new MultiProviderChatbot()
    );
  }
  return SESSIONS.get(sessionId);
}

const HTML_PAGE = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cantarella - Ai | by FallZx Infinity</title>
  <style>
    :root {
      --bg: #09090b;
      --surface: #121215;
      --surface-hover: #1a1a1f;
      --border: #232329;
      --text: #fafafa;
      --muted: #8e8e98;
      --user-bg: #1e1e24;
      --code-bg: #141418;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      height: 100%;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    body {
      display: flex;
      flex-direction: column;
    }
    header {
      height: 54px;
      border-bottom: 1px solid var(--border);
      padding: 0 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(9, 9, 11, 0.85);
      backdrop-filter: blur(8px);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 9px;
      font-weight: 600;
      font-size: 0.92rem;
      letter-spacing: -0.01em;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
    }
    .runtime-tag {
      font-size: 0.7rem;
      color: var(--muted);
      border: 1px solid var(--border);
      padding: 1px 7px;
      border-radius: 999px;
      font-weight: 500;
    }
    .nav-actions {
      display: flex;
      gap: 6px;
    }
    .btn-ghost {
      background: transparent;
      color: var(--muted);
      border: 1px solid transparent;
      padding: 6px 11px;
      border-radius: 7px;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-ghost:hover {
      color: var(--text);
      background: var(--surface);
      border-color: var(--border);
    }
    #chat-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 28px 16px 16px;
      scroll-behavior: smooth;
    }
    .chat-inner {
      max-width: 680px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    #empty-state {
      margin: 12vh auto 0;
      text-align: center;
      max-width: 460px;
      padding: 0 12px;
    }
    #empty-state h2 {
      font-size: 1.35rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      margin-bottom: 6px;
    }
    #empty-state p {
      color: var(--muted);
      font-size: 0.88rem;
      margin-bottom: 22px;
    }
    .suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
    }
    .chip {
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--muted);
      padding: 7px 13px;
      border-radius: 999px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .chip:hover {
      color: var(--text);
      background: var(--surface-hover);
      border-color: #34343d;
    }
    .row {
      display: flex;
      flex-direction: column;
      animation: fadeIn 0.18s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .row.user { align-items: flex-end; }
    .row.bot { align-items: flex-start; }
    .bubble {
      max-width: 85%;
      word-wrap: break-word;
    }
    .row.user .bubble {
      background: var(--user-bg);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 10px 15px;
      border-radius: 16px 16px 4px 16px;
      white-space: pre-wrap;
    }
    .row.bot .bubble {
      max-width: 100%;
      color: #e4e4e7;
      padding: 2px 0;
    }
    .meta {
      font-size: 0.72rem;
      color: var(--muted);
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .bot-content p { margin-bottom: 10px; }
    .bot-content p:last-child { margin-bottom: 0; }
    .bot-content code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 1px 5px;
      border-radius: 5px;
      font-size: 0.84em;
    }
    .bot-content pre {
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 9px;
      padding: 12px 14px;
      overflow-x: auto;
      margin: 10px 0;
    }
    .bot-content pre code {
      background: none;
      border: none;
      padding: 0;
      font-size: 0.83rem;
      color: #d4d4d8;
    }
    .typing {
      display: inline-flex;
      gap: 4px;
      padding: 8px 2px;
    }
    .typing span {
      width: 5px;
      height: 5px;
      background: var(--muted);
      border-radius: 50%;
      animation: pulse 1.2s infinite ease-in-out;
    }
    .typing span:nth-child(2) { animation-delay: 0.2s; }
    .typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes pulse {
      0%, 80%, 100% { opacity: 0.25; transform: scale(0.9); }
      40% { opacity: 1; transform: scale(1.1); }
    }
    footer {
      padding: 12px 16px 20px;
      background: var(--bg);
    }
    .composer {
      max-width: 680px;
      margin: 0 auto;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 8px 10px 8px 14px;
      display: flex;
      align-items: flex-end;
      gap: 8px;
      transition: border-color 0.15s ease;
    }
    .composer:focus-within {
      border-color: #3f3f46;
    }
    textarea {
      flex: 1;
      background: transparent;
      border: none;
      color: var(--text);
      font-family: inherit;
      font-size: 0.94rem;
      line-height: 1.5;
      resize: none;
      max-height: 140px;
      height: 24px;
      outline: none;
      padding: 2px 0;
    }
    textarea::placeholder { color: #63636e; }
    .send-btn {
      width: 32px;
      height: 32px;
      border-radius: 9px;
      border: none;
      background: var(--text);
      color: var(--bg);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      transition: opacity 0.15s ease;
    }
    .send-btn:disabled {
      opacity: 0.25;
      cursor: default;
    }
    .send-btn svg {
      width: 15px;
      height: 15px;
    }
    #api-modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 50;
    }
    .modal {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      max-width: 540px;
      width: 100%;
      padding: 20px;
    }
    .modal-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .modal-head h3 { font-size: 0.95rem; font-weight: 600; }
    .modal p { font-size: 0.82rem; color: var(--muted); margin-bottom: 8px; }
    .modal pre {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 11px;
      font-size: 0.78rem;
      overflow-x: auto;
      color: #d4d4d8;
      margin-bottom: 12px;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <span class="status-dot"></span>
      <span>Venice Lite</span>
      <span class="runtime-tag">Node.js</span>
    </div>
    <div class="nav-actions">
      <button class="btn-ghost" onclick="toggleModal()">API</button>
      <button class="btn-ghost" onclick="resetChat()">Bersihkan</button>
    </div>
  </header>

  <main id="chat-scroll">
    <div class="chat-inner" id="chat-list">
      <div id="empty-state">
        <h2>Ada yang bisa dibantu?</h2>
        <p>Ringan, tanpa batas, dan langsung terhubung.</p>
        <div class="suggestions">
          <button class="chip" onclick="usePrompt('Buatkan contoh REST API sederhana dengan Node.js')">Contoh API Node.js</button>
          <button class="chip" onclick="usePrompt('Jelaskan cara kerja async/await di JavaScript')">Konsep async/await</button>
          <button class="chip" onclick="usePrompt('Berikan 3 ide project web minimalis')">Ide project web</button>
        </div>
      </div>
    </div>
  </main>

  <footer>
    <div class="composer">
      <textarea id="input" rows="1" placeholder="Tulis pesan..."></textarea>
      <button id="send" class="send-btn" onclick="sendMessage()" title="Kirim">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="19" x2="12" y2="5"></line>
          <polyline points="5 12 12 5 19 12"></polyline>
        </svg>
      </button>
    </div>
  </footer>

  <div id="api-modal" onclick="if(event.target===this)toggleModal()">
    <div class="modal">
      <div class="modal-head">
        <h3>Endpoint REST API (Node.js)</h3>
        <button class="btn-ghost" onclick="toggleModal()">Tutup</button>
      </div>
      <p>Kirim request <code>POST</code> ke <code>/api/chat</code>:</p>
      <pre>curl -X POST http://${PUBLIC_HOST}/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Halo!", "session_id": "user-1"}'</pre>
      <p>Contoh panggil dari JavaScript (<code>fetch</code>):</p>
      <pre>const res = await fetch("http://${PUBLIC_HOST}/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: "Halo!", session_id: "user-1" })
});
const data = await res.json();
console.log(data.reply);</pre>
    </div>
  </div>

  <script>
    const sessionId = "s-" + Math.random().toString(36).slice(2, 9);
    const chatScroll = document.getElementById("chat-scroll");
    const chatList = document.getElementById("chat-list");
    const input = document.getElementById("input");
    const sendBtn = document.getElementById("send");

    input.addEventListener("input", () => {
      input.style.height = "24px";
      input.style.height = Math.min(input.scrollHeight, 140) + "px";
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    function usePrompt(text) {
      input.value = text;
      sendMessage();
    }

    function escapeHtml(str) {
      return str.replace(/[&<>"']/g, (m) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
      }[m]));
    }

    function formatMarkdown(text) {
      let safe = escapeHtml(text);
      safe = safe.replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, (_, code) => {
        const cleaned = code.replace(/^([a-zA-Z0-9_-]+)\\n/, "");
        return \`<pre><code>\${cleaned}</code></pre>\`;
      });
      safe = safe.replace(/\`([^\`]+)\`/g, "<code>$1</code>");
      safe = safe.replace(/\\*\\*([^*]+)\\*\\*/g, "<strong>$1</strong>");
      return safe
        .split(/\\n{2,}/)
        .map((p) => p.startsWith("<pre>") ? p : \`<p>\${p.replace(/\\n/g, "<br>")}</p>\`)
        .join("");
    }

    function hideEmptyState() {
      const el = document.getElementById("empty-state");
      if (el) el.remove();
    }

    function appendUser(text) {
      hideEmptyState();
      const row = document.createElement("div");
      row.className = "row user";
      const bubble = document.createElement("div");
      bubble.className = "bubble";
      bubble.textContent = text;
      row.appendChild(bubble);
      chatList.appendChild(row);
      chatScroll.scrollTop = chatScroll.scrollHeight;
    }

    function appendBotPlaceholder() {
      const row = document.createElement("div");
      row.className = "row bot";
      row.innerHTML = \`<div class="typing"><span></span><span></span><span></span></div>\`;
      chatList.appendChild(row);
      chatScroll.scrollTop = chatScroll.scrollHeight;
      return row;
    }

    async function sendMessage() {
      const text = input.value.trim();
      if (!text || sendBtn.disabled) return;

      input.value = "";
      input.style.height = "24px";
      appendUser(text);

      sendBtn.disabled = true;
      const botRow = appendBotPlaceholder();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, session_id: sessionId })
        });
        const data = await res.json();
        if (res.ok && data.status === "ok") {
          const shortProvider = (data.provider || "AI").split("(")[0].trim();
          botRow.innerHTML = \`
            <div class="meta"><span>\${escapeHtml(shortProvider)}</span></div>
            <div class="bubble bot-content">\${formatMarkdown(data.reply)}</div>
          \`;
        } else {
          botRow.innerHTML = \`<div class="bubble bot-content"><p style="color:#f87171;">\${escapeHtml(data.error || "Gagal memproses pesan.")}</p></div>\`;
        }
      } catch (err) {
        botRow.innerHTML = \`<div class="bubble bot-content"><p style="color:#f87171;">Koneksi gagal: \${escapeHtml(err.message)}</p></div>\`;
      } finally {
        sendBtn.disabled = false;
        chatScroll.scrollTop = chatScroll.scrollHeight;
        input.focus();
      }
    }

    async function resetChat() {
      await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId })
      });
      chatList.innerHTML = \`
        <div id="empty-state">
          <h2>Ada yang bisa dibantu?</h2>
          <p>Percakapan telah dibersihkan.</p>
        </div>
      \`;
    }

    function toggleModal() {
      const m = document.getElementById("api-modal");
      m.style.display = m.style.display === "flex" ? "none" : "flex";
    }
  </script>
</body>
</html>`;

function sendJson(res, statusCode, payload) {
  const body = Buffer.from(JSON.stringify(payload), "utf-8");
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Length": body.length,
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error("Format JSON tidak valid"));
      }
    });
    req.on("error", reject);
  });
}

async function handleRequest(req, res) {
  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { status: "ok" });
  }

  const urlPath = (req.url || "/").split("?")[0];

  if (req.method === "GET") {
    if (urlPath === "/" || urlPath === "/index.html") {
      const htmlBuf = Buffer.from(HTML_PAGE, "utf-8");
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Length": htmlBuf.length,
      });
      return res.end(htmlBuf);
    }

    if (urlPath === "/api/health") {
      const activeProviders = PROVIDERS.filter(
        (p) => !p.requiresKey || Boolean(p.apiKey)
      ).map((p) => p.name);
      return sendJson(res, 200, {
        status: "ok",
        runtime: "nodejs",
        active_providers: activeProviders,
        active_sessions: SESSIONS.size,
      });
    }

    return sendJson(res, 404, { status: "error", error: "Not found" });
  }

  if (req.method === "POST") {
    let data;
    try {
      data = await readJsonBody(req);
    } catch (err) {
      return sendJson(res, 400, { status: "error", error: err.message });
    }

    if (urlPath === "/api/chat") {
      const message = String(data.message || "").trim();
      const sessionId = String(data.session_id || "default").trim() || "default";
      const systemPrompt = String(data.system_prompt || "").trim();

      if (!message) {
        return sendJson(res, 400, {
          status: "error",
          error: "Field 'message' wajib diisi",
        });
      }

      const bot = getOrCreateSession(sessionId, systemPrompt);
      try {
        const result = await bot.chat(message);
        return sendJson(res, 200, {
          status: "ok",
          session_id: sessionId,
          provider: result.provider,
          model: result.model,
          reply: result.reply,
        });
      } catch (err) {
        return sendJson(res, 502, { status: "error", error: err.message });
      }
    }

    if (urlPath === "/api/reset") {
      const sessionId = String(data.session_id || "default").trim() || "default";
      if (SESSIONS.has(sessionId)) {
        SESSIONS.get(sessionId).resetHistory();
      }
      return sendJson(res, 200, {
        status: "ok",
        session_id: sessionId,
        message: "Riwayat sesi berhasil di-reset",
      });
    }

    return sendJson(res, 404, {
      status: "error",
      error: "Endpoint tidak ditemukan",
    });
  }

  return sendJson(res, 405, { status: "error", error: "Method not allowed" });
}

function startServers() {
  const mainServer = http.createServer(handleRequest);
  const altServer = http.createServer(handleRequest);

  mainServer.listen(PORT, "0.0.0.0", () => {
    console.log("Server Node.js Web Chat & REST API berjalan di:");
    console.log(`- Port Standar HTTP (80) : http://${PUBLIC_HOST}/`);
  });

  altServer.listen(ALT_PORT, "0.0.0.0", () => {
    console.log(`- Port Alternatif (8000) : http://${PUBLIC_HOST}:${ALT_PORT}/`);
    console.log(`- Endpoint Chat API      : POST http://${PUBLIC_HOST}/api/chat`);
  });
}

if (require.main === module) {
  startServers();
}

module.exports = { handleRequest, startServers };
