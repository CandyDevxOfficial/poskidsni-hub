const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const app = express();

app.use(express.json());

// Discord Webhooks
const DISCORD_STATUS_WEBHOOK = "https://discord.com/api/webhooks/1541093112695496744/Fgd7iGWH9LPpkKKIUpw_-qVTBic8WSvhYl07mddNGXzA0p5xw0z_DNA0CzAE65OX45W_";
const DISCORD_VERIFY_WEBHOOK = "https://discord.com/api/webhooks/1541095683615096923/j6GNXZb7HrAh-H7L5LaurTSIrPbKU9DlEMbGSlRiEyfk-CcWAkzHTBsF5Zx1XC5Ox7bM";

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

// Send Status Webhook
function sendDiscordStatus() {
    const timeUnix = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify({
        username: "SOLARIS SYSTEM MONITOR",
        avatar_url: "https://i.imgur.com/8N4T8I3.png",
        embeds: [{
            title: "🟢 SYSTEM STATUS : ONLINE",
            description: "All core systems and script vault services are running smoothly.",
            color: 2278750,
            fields: [
                { name: "🌐 Web Server", value: "`Operational` (Render)", inline: true },
                { name: "⚡ Script Vault", value: "`Online`", inline: true },
                { name: "🛡️ Security Logger", value: "`Active`", inline: true },
                { name: "🔄 Last Started", value: `<t:${timeUnix}:R>`, inline: true }
            ],
            footer: { text: "SOLARIS HUB • Automated System Monitor" },
            timestamp: new Date().toISOString()
        }]
    });
    postWebhook(DISCORD_STATUS_WEBHOOK, payload);
}

// Send Verification Log Webhook
function sendVerificationLog(discordId) {
    const timeUnix = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify({
        username: "SOLARIS VERIFY LOG",
        avatar_url: "https://i.imgur.com/8N4T8I3.png",
        embeds: [{
            title: "🎉 NEW USER VERIFIED / ROLE CLAIMED",
            description: `User <@${discordId}> has successfully verified or requested access.`,
            color: 65421,
            fields: [
                { name: "👤 User Mention", value: `<@${discordId}>`, inline: true },
                { name: "🆔 Discord ID", value: `\`${discordId}\``, inline: true },
                { name: "⏰ Verified At", value: `<t:${timeUnix}:F>`, inline: false }
            ],
            footer: { text: "SOLARIS HUB • Role Verification System" },
            timestamp: new Date().toISOString()
        }]
    });
    postWebhook(DISCORD_VERIFY_WEBHOOK, payload);
}

function postWebhook(webhookUrl, payload) {
    try {
        const url = new URL(webhookUrl);
        const req = https.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        });
        req.write(payload);
        req.end();
    } catch (err) {
        console.error("Failed to send webhook:", err);
    }
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

        .editor-wrapper {
            background: rgba(10, 12, 20, 0.8);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 12px;
        }
        textarea, input[type="text"] {
            width: 100%;
            background: transparent;
            border: none;
            color: #cbd5e1;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12.5px;
            outline: none;
        }
        textarea { height: 160px; resize: vertical; line-height: 1.5; }

        .input-box {
            background: rgba(10, 12, 20, 0.8);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 12px;
            margin-bottom: 12px;
        }

        .btn-submit {
            width: 100%;
            background: linear-gradient(135deg, #ff5722, #e64a19);
            color: #ffffff;
            border: none;
            border-radius: 12px;
            padding: 12px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 18px var(--accent-glow);
            transition: all 0.25s;
        }
        .btn-submit:hover { transform: translateY(-2px); }

        .result-box {
            display: none;
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px dashed rgba(255, 255, 255, 0.12);
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
        }
    </style>
</head>
<body>

<div class="main-card">
    <div class="brand-header">
        <div class="brand-title">SOLARIS RUNNER</div>
        <div class="brand-sub">Script Vault & Verification Portal</div>
    </div>

    <!-- Verification Section -->
    <div class="form-group" style="border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 18px;">
        <span class="label-title">MEMBER VERIFICATION (DISCORD ID)</span>
        <div class="input-box">
            <input type="text" id="discordIdInput" placeholder="Enter Discord ID (e.g. 123456789012345678)">
        </div>
        <button class="btn-submit" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);" onclick="submitVerify()">✅ Claim Role / Verify</button>
    </div>

    <!-- Script Converter Section -->
    <div class="form-group">
        <span class="label-title">SCRIPT CONVERTER</span>
        <div class="editor-wrapper">
            <textarea id="rawCode" placeholder="-- Paste Lua script here..."></textarea>
        </div>
        <button class="btn-submit" style="margin-top: 12px;" onclick="createRaw()">⚡ Convert Script</button>
    </div>

    <div class="result-box" id="resultArea">
        <span class="label-title">LOADSTRING</span>
        <div class="code-display" id="loadstringBox"></div>
    </div>
</div>

<script>
async function submitVerify() {
    const discordId = document.getElementById('discordIdInput').value.trim();
    if (!discordId) return alert('Please enter a valid Discord ID.');

    const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId })
    });

    const data = await res.json();
    if (res.ok) {
        alert('Verification logged successfully!');
        document.getElementById('discordIdInput').value = '';
    } else {
        alert(data.error);
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
        document.getElementById('loadstringBox').innerText = 'loadstring(game:HttpGet("' + rawLink + '"))()';
        document.getElementById('resultArea').style.display = 'block';
    }
}
</script>

</body>
</html>
`;

app.get('/', (req, res) => res.send(htmlContent));

// API Endpoint to Record Verification and Log to Webhook
app.post('/api/verify', (req, res) => {
    const { discordId } = req.body;
    if (!discordId || !/^\d{17,20}$/.test(discordId)) {
        return res.status(400).json({ error: 'Invalid Discord ID format' });
    }

    if (!database.users.includes(discordId)) {
        database.users.push(discordId);
        saveData();
    }

    sendVerificationLog(discordId);
    res.json({ success: true, message: 'Logged to Discord' });
});

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
        return res.status(403).send("403 Forbidden");
    }

    res.type('text/plain; charset=utf-8');
    res.send(script.code);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('SOLARIS RUNNER server active on port ' + PORT);
    sendDiscordStatus();
});
        
