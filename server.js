const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const app = express();

app.use(express.json());

const DATA_DIR = fs.existsSync('/data') ? '/data' : path.join(__dirname, 'data_store');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_FILE = path.join(DATA_DIR, 'db.json');

let database = { scripts: {}, users: [] };
if (fs.existsSync(DB_FILE)) {
    try { 
        const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); 
        database = { scripts: parsed.scripts || {}, users: parsed.users || [] };
    } catch (e) { 
        database = { scripts: {}, users: [] }; 
    }
}

function saveData() {
    fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2));
}

function generateSecureId(length = 22) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const bytes = crypto.randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars[bytes[i] % chars.length];
    }
    return result;
}

// Main Page HTML
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SOLARIS RUNNER - Script Vault</title>
    <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0b0c10;
            --card-bg: rgba(20, 22, 34, 0.9);
            --accent-main: #ff5722;
            --accent-glow: rgba(255, 87, 34, 0.35);
            --border-color: rgba(255, 255, 255, 0.08);
            --text-main: #f1f5f9;
            --text-sub: #64748b;
            --green-code: #22c55e;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Kanit', sans-serif; }
        
        body {
            background-color: var(--bg-color);
            background-image: 
                radial-gradient(circle at 10% 20%, rgba(255, 87, 34, 0.1) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 40%);
            color: var(--text-main);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 24px 12px;
        }

        .main-card {
            background: var(--card-bg);
            backdrop-filter: blur(16px);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            width: 100%;
            max-width: 480px;
            padding: 28px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        }

        .brand-header { text-align: center; margin-bottom: 22px; }
        .brand-title {
            font-size: 24px;
            font-weight: 700;
            background: linear-gradient(135deg, #ff5722, #ff8a65);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .brand-sub { font-size: 12px; color: var(--text-sub); margin-top: 2px; }

        .form-group { margin-bottom: 18px; }
        .label-title {
            font-size: 11px;
            font-weight: 600;
            color: #94a3b8;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 8px;
            display: block;
        }

        .editor-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        .btn-mini-group { display: flex; gap: 6px; }
        .btn-mini {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border-color);
            color: #cbd5e1;
            padding: 5px 10px;
            border-radius: 8px;
            font-size: 11px;
            cursor: pointer;
        }

        .editor-wrapper {
            background: rgba(10, 12, 20, 0.8);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 12px;
        }
        textarea {
            width: 100%;
            height: 180px;
            background: transparent;
            border: none;
            color: #cbd5e1;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12.5px;
            outline: none;
            resize: vertical;
            line-height: 1.5;
        }

        .editor-bottom {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 14px;
        }
        .char-counter { font-size: 12px; color: var(--text-sub); font-family: 'JetBrains Mono', monospace; }

        .btn-submit {
            background: linear-gradient(135deg, #ff5722, #e64a19);
            color: #ffffff;
            border: none;
            border-radius: 12px;
            padding: 11px 22px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 18px var(--accent-glow);
            transition: all 0.25s;
        }

        .result-box {
            display: none;
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px dashed rgba(255, 255, 255, 0.12);
        }

        .status-badge {
            color: var(--green-code);
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 16px;
        }

        .raw-input-group {
            display: flex;
            gap: 8px;
            margin-bottom: 18px;
        }
        .raw-input-box {
            flex: 1;
            background: rgba(10, 12, 20, 0.8);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            padding: 10px 12px;
            color: #cbd5e1;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            outline: none;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .btn-copy-sm {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid var(--border-color);
            color: var(--text-main);
            padding: 0 16px;
            border-radius: 10px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
        }

        .code-display {
            background: rgba(8, 9, 15, 0.9);
            border: 1px solid rgba(34, 197, 94, 0.2);
            border-radius: 10px;
            padding: 12px;
            color: var(--green-code);
            font-family: 'JetBrains Mono', monospace;
            font-size: 11.5px;
            word-break: break-all;
            margin-bottom: 12px;
        }

        .btn-copy-main {
            width: 100%;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid var(--border-color);
            color: var(--text-main);
            padding: 11px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 12.5px;
            cursor: pointer;
            margin-bottom: 20px;
        }

        .info-footer {
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            padding-top: 14px;
            font-size: 11.5px;
            color: #64748b;
            line-height: 1.6;
        }
        .info-footer strong { color: #94a3b8; }
    </style>
</head>
<body>

<div class="main-card">
    <div class="brand-header">
        <div class="brand-title">SOLARIS RUNNER</div>
        <div class="brand-sub">Secure Executable Script Engine</div>
    </div>

    <div class="form-group">
        <div class="editor-top">
            <span class="label-title" style="margin:0;">CODE (LUA / TEXT)</span>
            <div class="btn-mini-group">
                <button class="btn-mini" onclick="document.getElementById('fileInput').click()">📁 Upload File</button>
                <button class="btn-mini" onclick="document.getElementById('rawCode').value=''; updateCount();">🧹 Clear</button>
            </div>
        </div>

        <input type="file" id="fileInput" accept=".lua,.txt" style="display:none;" onchange="handleFile(this)">

        <div class="editor-wrapper">
            <textarea id="rawCode" placeholder="-- Paste your Lua script here..." oninput="updateCount()"></textarea>
        </div>

        <div class="editor-bottom">
            <span class="char-counter" id="charCount">0 characters</span>
            <button class="btn-submit" onclick="createRaw()">⚡ Convert Script</button>
        </div>
    </div>

    <div class="result-box" id="resultArea">
        <div class="status-badge">✔ Raw ready — Browsers will receive 403</div>

        <span class="label-title">RAW URL</span>
        <div class="raw-input-group">
            <input type="text" class="raw-input-box" id="rawUrlBox" readonly>
            <button class="btn-copy-sm" id="copyRawBtn" onclick="copyRawUrl()">Copy</button>
        </div>

        <span class="label-title">LOADSTRING (ROBLOX)</span>
        <div class="code-display" id="loadstringBox"></div>
        <button class="btn-copy-main" id="copyBtn" onclick="copyLoadstring()">📋 Copy Loadstring</button>

        <div class="info-footer">
            <strong>How the block works:</strong> Edge Function checks User-Agent + Sec-Fetch-* + Accept headers.<br>
            Modern browsers send Sec-Fetch → 403. Roblox HttpGet / most executors do not → code is returned.
        </div>
    </div>
</div>

<script>
function updateCount() {
    const len = document.getElementById('rawCode').value.length;
    document.getElementById('charCount').innerText = len + ' characters';
}

function handleFile(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('rawCode').value = e.target.result;
            updateCount();
        };
        reader.readAsText(file);
    }
}

async function createRaw() {
    const code = document.getElementById('rawCode').value.trim();
    if (!code) return alert('Please enter code.');

    const res = await fetch('/api/save-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });

    const data = await res.json();
    if (res.ok) {
        const rawLink = window.location.origin + '/raw/' + data.id;
        document.getElementById('rawUrlBox').value = rawLink;
        document.getElementById('loadstringBox').innerText = 'loadstring(game:HttpGet("' + rawLink + '"))()';
        document.getElementById('resultArea').style.display = 'block';
    }
}

function copyRawUrl() {
    const text = document.getElementById('rawUrlBox').value;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyRawBtn');
        btn.innerText = 'Copied!';
        setTimeout(() => { btn.innerText = 'Copy'; }, 2000);
    });
}

function copyLoadstring() {
    const text = document.getElementById('loadstringBox').innerText;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyBtn');
        btn.innerText = 'Copied!';
        setTimeout(() => { btn.innerText = '📋 Copy Loadstring'; }, 2000);
    });
}
</script>

</body>
</html>
`;

// 403 Page HTML
const forbiddenPageHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>403 Forbidden - SOLARIS RUNNER</title>
    <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
    <style>
        body { background: #0b0c10; color: #f1f5f9; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: 'Kanit', sans-serif; text-align: center; }
        .card { background: rgba(20, 22, 34, 0.9); border: 1px solid rgba(255,255,255,0.08); padding: 40px 28px; border-radius: 20px; max-width: 440px; }
        .code { font-size: 72px; font-weight: 700; color: #ff5722; font-family: 'JetBrains Mono', monospace; }
        .title { font-size: 20px; margin-bottom: 12px; }
        .desc { font-size: 13px; color: #94a3b8; margin-bottom: 28px; }
        .btn { background: #ff5722; color: #fff; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 13px; }
    </style>
</head>
<body>
<div class="card">
    <div class="code">403</div>
    <div class="title">Access Denied</div>
    <div class="desc">Direct web browser access is blocked to protect script integrity.</div>
    <a href="/" class="btn">Return to Home</a>
</div>
</body>
</html>
`;

app.get('/', (req, res) => res.send(htmlContent));

app.post('/api/save-script', (req, res) => {
    const { code } = req.body;
    if (!code || !code.trim()) return res.status(400).json({ error: 'Code cannot be empty' });

    let id = generateSecureId(22);
    while (database.scripts[id]) {
        id = generateSecureId(22);
    }

    database.scripts[id] = { code };
    saveData();

    res.json({ id });
});

app.get('/raw/:id', (req, res) => {
    const id = req.params.id;
    const script = database.scripts[id];

    if (!script) return res.status(404).send('Not Found');

    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const secFetchDest = req.headers['sec-fetch-dest'];
    const secFetchMode = req.headers['sec-fetch-mode'];
    const acceptHeader = (req.headers['accept'] || '').toLowerCase();

    const isBrowser = secFetchDest || secFetchMode || 
                      acceptHeader.includes('text/html') || 
                      (userAgent.includes('mozilla') && !userAgent.includes('roblox'));

    if (isBrowser) {
        return res.status(403).send(forbiddenPageHtml);
    }

    res.type('text/plain; charset=utf-8');
    res.send(script.code);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('SOLARIS RUNNER server active on port ' + PORT);
});
