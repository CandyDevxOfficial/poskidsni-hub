const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const app = express();

app.use(express.json());

const DATA_DIR = fs.existsSync('/data') ? '/data' : path.join(__dirname, 'data_store');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_FILE = path.join(DATA_DIR, 'db.json');

let database = {};
if (fs.existsSync(DB_FILE)) {
    try { database = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { database = {}; }
}

function saveData() {
    fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2));
}

// ฟังก์ชันสุ่ม Secure Unique ID ความยาว 22 ตัวอักษร เช่น iWig0QoLQyNePrCUajPE6JK
function generateSecureId(length = 22) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const bytes = crypto.randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars[bytes[i] % chars.length];
    }
    return result;
}

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LuauForge - Lock System</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
        body {
            background-color: #0b0c10;
            color: #94a3b8;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            background: #11121c;
            border: 1px solid #1e202e;
            border-radius: 16px;
            width: 100%;
            max-width: 440px;
            padding: 24px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        }
        .label {
            font-size: 11px;
            font-weight: 700;
            color: #64748b;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            margin-bottom: 8px;
            display: block;
        }
        .form-group { margin-bottom: 20px; }
        
        input[type="text"] {
            width: 100%;
            background: #0d0e17;
            border: 1px solid #1e202f;
            border-radius: 10px;
            padding: 12px 14px;
            color: #f1f5f9;
            font-size: 13px;
            outline: none;
        }
        input[type="text"]::placeholder { color: #334155; }
        input[type="text"]:focus { border-color: #3b82f6; }

        .editor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        .editor-actions { display: flex; gap: 8px; }
        .btn-sub {
            background: #181926;
            border: 1px solid #232538;
            color: #cbd5e1;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 12px;
            cursor: pointer;
            font-weight: 500;
        }
        .btn-sub:hover { background: #222436; }

        .editor-container {
            position: relative;
            background: #0a0b12;
            border: 1px solid #1c1e2d;
            border-radius: 12px;
            padding: 14px;
        }
        textarea {
            width: 100%;
            height: 180px;
            background: transparent;
            border: none;
            color: #94a3b8;
            font-family: 'JetBrains Mono', monospace;
            font-size: 13px;
            outline: none;
            resize: vertical;
            line-height: 1.6;
        }

        .editor-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 16px;
        }
        .char-count { font-size: 12px; color: #475569; }

        .btn-submit {
            background: #ff5722;
            color: #ffffff;
            border: none;
            border-radius: 12px;
            padding: 12px 24px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(255, 87, 34, 0.3);
            transition: all 0.2s;
        }
        .btn-submit:hover { background: #f4511e; transform: translateY(-1px); }

        .result-section { display: none; }
        .status-header {
            color: #22c55e;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .input-with-btn {
            display: flex;
            gap: 8px;
        }
        .input-readonly {
            background: #090a10 !important;
            color: #64748b !important;
            border-color: #1a1c2a !important;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
        }
        .btn-copy {
            background: #1a1c2b;
            border: 1px solid #282a3f;
            color: #e2e8f0;
            padding: 0 16px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 12px;
            cursor: pointer;
        }
        .btn-copy:hover { background: #25283d; }

        .loadstring-box {
            background: #090a10;
            border: 1px solid #171926;
            border-radius: 10px;
            padding: 14px;
            color: #22c55e;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            line-height: 1.6;
            word-break: break-all;
            margin-bottom: 12px;
        }

        .btn-full-copy {
            width: 100%;
            background: #1a1c2b;
            border: 1px solid #282a3f;
            color: #cbd5e1;
            padding: 12px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            margin-bottom: 20px;
        }
        .btn-full-copy:hover { background: #24273c; }

        .info-footer {
            border-top: 1px solid #181a27;
            padding-top: 16px;
            font-size: 11px;
            color: #475569;
            line-height: 1.6;
        }
        .info-footer strong { color: #64748b; }
    </style>
</head>
<body>

<div class="container">
    <div id="formSection">
        <div class="form-group">
            <span class="label">SCRIPT NAME (OPTIONAL)</span>
            <input type="text" id="scriptName" placeholder="e.g. auto-farm, key-system...">
        </div>

        <div class="form-group">
            <div class="editor-header">
                <span class="label" style="margin:0;">CODE (LUA / TEXT)</span>
                <div class="editor-actions">
                    <button class="btn-sub" onclick="document.getElementById('fileInput').click()">📁 Upload .lua / .txt</button>
                    <button class="btn-sub" onclick="clearCode()">Clear</button>
                </div>
            </div>
            
            <input type="file" id="fileInput" accept=".lua,.txt" style="display:none;" onchange="handleFile(this)">

            <div class="editor-container">
                <textarea id="rawCode" placeholder="-- paste your code here or drop a file&#10;print('hello from LuauForge-Lock')" oninput="updateCount()"></textarea>
            </div>

            <div class="editor-footer">
                <span class="char-count" id="charCount">0 characters</span>
                <button class="btn-submit" onclick="createRaw()">Create Secure Raw</button>
            </div>
        </div>
    </div>

    <div class="result-section" id="resultSection">
        <div class="status-header">
            ✔ Raw ready — Browsers will receive 403
        </div>

        <div class="form-group">
            <span class="label">RAW URL</span>
            <div class="input-with-btn">
                <input type="text" id="rawUrl" class="input-readonly" readonly>
                <button class="btn-copy" onclick="copyText('rawUrl', this)">Copy</button>
            </div>
        </div>

        <div class="form-group">
            <span class="label">LOADSTRING (ROBLOX)</span>
            <div class="loadstring-box" id="loadstringBox"></div>
        </div>

        <button class="btn-full-copy" id="copyLoadstringBtn" onclick="copyText('loadstringBox', this, true)">Copy Loadstring</button>

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

function clearCode() {
    document.getElementById('rawCode').value = '';
    updateCount();
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
    if (!code) return alert('Please enter code first');

    const res = await fetch('/api/save-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });

    const data = await res.json();
    if (res.ok) {
        const rawLink = window.location.origin + '/raw/' + data.id;
        const loadstringText = 'loadstring(game:HttpGet("' + rawLink + '"))()';

        document.getElementById('rawUrl').value = rawLink;
        document.getElementById('loadstringBox').innerText = loadstringText;
        
        document.getElementById('formSection').style.display = 'none';
        document.getElementById('resultSection').style.display = 'block';
    } else {
        alert(data.error);
    }
}

function copyText(elementId, btn, isDiv = false) {
    const text = isDiv ? document.getElementById(elementId).innerText : document.getElementById(elementId).value;
    navigator.clipboard.writeText(text).then(() => {
        const oldText = btn.innerText;
        btn.innerText = 'Copied!';
        setTimeout(() => { btn.innerText = oldText; }, 2000);
    });
}
</script>

</body>
</html>
`;

app.get('/', (req, res) => res.send(htmlContent));

// API บันทึกโค้ดและสร้าง Unique ID 22 หลัก
app.post('/api/save-script', (req, res) => {
    const { code } = req.body;
    if (!code || !code.trim()) return res.status(400).json({ error: 'Code cannot be empty' });

    let id = generateSecureId(22);
    while (database[id]) {
        id = generateSecureId(22);
    }

    database[id] = { code };
    saveData();

    res.json({ id });
});

// ดึงสคริปต์ไปรัน - ตรวจจับ Header สกัดกั้น Web Browser (ส่ง 403 Forbidden)
app.get('/raw/:id', (req, res) => {
    const id = req.params.id;
    const script = database[id];

    if (!script) return res.status(404).send('Not Found');

    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const secFetchDest = req.headers['sec-fetch-dest'];
    const secFetchMode = req.headers['sec-fetch-mode'];
    const acceptHeader = (req.headers['accept'] || '').toLowerCase();

    // บล็อกถ้าคำขอมาจาก Browser
    const isBrowser = secFetchDest || secFetchMode || 
                      acceptHeader.includes('text/html') || 
                      (userAgent.includes('mozilla') && !userAgent.includes('roblox'));

    if (isBrowser) {
        return res.status(403).send('403 Forbidden - Access denied for Web Browsers');
    }

    res.type('text/plain; charset=utf-8');
    res.send(script.code);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server active on port ' + PORT));
